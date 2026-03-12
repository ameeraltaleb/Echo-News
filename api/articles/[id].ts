import { getSql, initPostgresDb } from '../../src/db/postgres.js';

async function ensureDb() {
  await initPostgresDb();
}

export default async function handler(req, res) {
  const { id } = req.query;
  const lang = req.query.lang || 'en';

  try {
    await ensureDb();
    const sql = getSql();

    const titleCol = `title_${lang}`;
    const contentCol = `content_${lang}`;

    const articles = await sql`
      SELECT a.id, a.${sql(titleCol)} as title, a.${sql(contentCol)} as content, 
             a.image_url, a.category_id, a.published_at, a.views, a.author, a.tags,
             c.slug as category_slug
      FROM articles a
      JOIN categories c ON a.category_id = c.id
      WHERE a.id = ${id} AND a.status = 'published'
    `;

    if (articles.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Increment views
    await sql`UPDATE articles SET views = views + 1 WHERE id = ${id}`;

    res.json(articles[0]);
  } catch (error: any) {
    console.error('API Article Detail Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch article', 
      details: error.message 
    });
  }
}
