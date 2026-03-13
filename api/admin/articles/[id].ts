import { getSql, initPostgresDb } from '../../../src/db/postgres.js';
import { verifyAuthHeader } from '../../_lib/auth.js';

async function ensureDb() {
  await initPostgresDb();
}

export default async function handler(req, res) {
  const payload = await verifyAuthHeader(req.headers.authorization);
  if (!payload || payload.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { method } = req;
  const { id } = req.query;

  try {
    await ensureDb();
    const sql = getSql();

    if (method === 'PUT') {
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
    } else if (method === 'GET') {
      // Optional: fetch single article for admin
      const articles = await sql`SELECT * FROM articles WHERE id = ${id}`;
      if (articles.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(articles[0]);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin article process error:', error);
    res.status(500).json({ error: 'Failed to process request', details: error instanceof Error ? error.message : String(error) });
  }
}
