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

    if (method === 'GET') {
      const articles = await sql`
        SELECT id, slug, title_en, title_ar, category_id, published_at, views, author, status, tags,
               content_en, content_ar, summary_en, summary_ar, image_url
        FROM articles
        ORDER BY published_at DESC
      `;
      res.json(articles);
    } else if (method === 'POST') {
      const {
        category_id, slug, title_en, title_ar, summary_en, summary_ar,
        content_en, content_ar, image_url, author, status, published_at, tags
      } = req.body;

      const result = await sql`
        INSERT INTO articles (
          category_id, slug, title_en, title_ar, summary_en, summary_ar,
          content_en, content_ar, image_url, author, status, published_at, tags
        ) VALUES (
          ${category_id}, ${slug}, ${title_en}, ${title_ar}, ${summary_en}, ${summary_ar},
          ${content_en}, ${content_ar}, ${image_url}, ${author}, ${status || 'published'},
          ${published_at || new Date().toISOString()}, ${tags ? JSON.stringify(tags) : '[]'}
        ) RETURNING id
      `;
      res.json({ id: result[0].id });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Article save error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
