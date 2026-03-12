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

    const titleCol = `title_${lang}`;
    const summaryCol = `summary_${lang}`;

    const articles = await sql`
      SELECT a.id, a.${sql(titleCol)} as title, a.${sql(summaryCol)} as summary, 
             a.image_url, a.category_id, a.published_at, a.views, a.status, a.tags
      FROM articles a
      ${categorySlug ? sql`JOIN categories c ON a.category_id = c.id` : sql``}
      WHERE a.status = 'published'
      AND a.published_at <= ${new Date().toISOString()}
      ${categorySlug ? sql`AND c.slug = ${categorySlug}` : sql``}
      ${excludeId ? sql`AND a.id != ${excludeId}` : sql``}
      ${searchQuery ? sql`AND (a.title_en ILIKE ${'%' + searchQuery + '%'} OR a.title_ar ILIKE ${'%' + searchQuery + '%'} OR a.summary_en ILIKE ${'%' + searchQuery + '%'} OR a.summary_ar ILIKE ${'%' + searchQuery + '%'})` : sql``}
      ORDER BY ${sort === 'views' ? sql`a.views DESC` : sql`a.published_at DESC`}
      LIMIT ${limit}
    `;
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
