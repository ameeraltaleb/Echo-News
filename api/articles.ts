import { getSql, initPostgresDb } from '../src/db/postgres.js';

async function ensureDb() {
  await initPostgresDb();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const lang = req.query.lang || 'en';
  const limit = parseInt(String(req.query.limit)) || 20;
  const categorySlug = String(req.query.category || '');
  const searchQuery = String(req.query.q || '');
  const sort = String(req.query.sort || '');
  const excludeId = req.query.exclude ? parseInt(String(req.query.exclude)) : null;
  
  try {
    await ensureDb();
    const sql = getSql();

    let query = `
      SELECT a.id, a.title_${lang} as title, a.summary_${lang} as summary, 
             a.image_url, a.category_id, a.published_at, a.views, a.status, a.tags
      FROM articles a
    `;
    const params: any[] = [];
    let pIdx = 1;
    const conditions: string[] = [" a.status = 'published' ", ` a.published_at <= $${pIdx++} `];
    params.push(new Date().toISOString());

    if (categorySlug) {
      query += ` JOIN categories c ON a.category_id = c.id `;
      conditions.push(` c.slug = $${pIdx++} `);
      params.push(categorySlug);
    }

    if (excludeId) {
      conditions.push(` a.id != $${pIdx++} `);
      params.push(excludeId);
    }

    if (searchQuery) {
      conditions.push(` (a.title_en ILIKE $${pIdx} OR a.title_ar ILIKE $${pIdx} OR a.summary_en ILIKE $${pIdx} OR a.summary_ar ILIKE $${pIdx}) `);
      params.push(`%${searchQuery}%`);
      pIdx++;
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    if (sort === 'views') {
      query += ` ORDER BY a.views DESC LIMIT $${pIdx++} `;
    } else {
      query += ` ORDER BY a.published_at DESC LIMIT $${pIdx++} `;
    }
    params.push(limit);

    const articles = await sql.unsafe(query, params);
    res.json(articles);
  } catch (error: any) {
    console.error('API Articles Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch articles', 
      details: error.message,
      env: process.env.NODE_ENV
    });
  }
}
