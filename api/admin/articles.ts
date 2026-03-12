import { getSql, initPostgresDb } from '../../src/db/postgres.js';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'echo-news-secret-2026';

async function ensureDb() {
  await initPostgresDb();
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { method } = req;
  const { id } = req.query;

  try {
    await ensureDb();
    const sql = getSql();

    if (method === 'GET') {
      const articles = await sql`
        SELECT id, title_en, title_ar, category_id, published_at, views, author, status, tags,
               content_en, content_ar, summary_en, summary_ar, image_url
        FROM articles 
        ORDER BY published_at DESC
      `;
      res.json(articles);
    } else if (method === 'POST') {
      const { 
        category_id, title_en, title_ar, summary_en, summary_ar, 
        content_en, content_ar, image_url, author, status, published_at, tags 
      } = req.body;
      const result = await sql`
        INSERT INTO articles (
          category_id, title_en, title_ar, summary_en, summary_ar, 
          content_en, content_ar, image_url, author, status, published_at, tags
        ) VALUES (
          ${category_id}, ${title_en}, ${title_ar}, ${summary_en}, ${summary_ar}, 
          ${content_en}, ${content_ar}, ${image_url}, ${author}, ${status || 'published'}, 
          ${published_at || new Date().toISOString()}, ${tags ? JSON.stringify(tags) : '[]'}
        ) RETURNING id
      `;
      res.json({ id: result[0].id });
    } else if (method === 'PUT') {
      const { 
        category_id, title_en, title_ar, summary_en, summary_ar, 
        content_en, content_ar, image_url, author, status, published_at, tags 
      } = req.body;
      await sql`
        UPDATE articles SET 
          category_id = ${category_id}, title_en = ${title_en}, title_ar = ${title_ar}, 
          summary_en = ${summary_en}, summary_ar = ${summary_ar}, content_en = ${content_en}, 
          content_ar = ${content_ar}, image_url = ${image_url}, author = ${author}, status = ${status},
          published_at = ${published_at || new Date().toISOString()}, tags = ${tags ? JSON.stringify(tags) : '[]'}
        WHERE id = ${id}
      `;
      res.json({ success: true });
    } else if (method === 'DELETE') {
      await sql`DELETE FROM articles WHERE id = ${id}`;
      res.json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Article save error:', error);
    res.status(500).json({ error: 'Failed to process request', details: error instanceof Error ? error.message : String(error) });
  }
}
