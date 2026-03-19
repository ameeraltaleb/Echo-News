import { getSql, initPostgresDb } from '../../src/db/postgres';

export default async function handler(req, res) {
  const { id } = req.query;
  const lang = req.query.lang || 'en';

  try {
    await initPostgresDb();
    const sql = getSql();

    const titleCol = `title_${lang}`;
    const contentCol = `content_${lang}`;
    const summaryCol = `summary_${lang}`;

    // Check if ID is likely a slug or a numeric ID
    const isNumeric = /^\d+$/.test(id as string);
    
    const articles = await sql`
      SELECT a.id, a.slug, a.${sql(titleCol)} as title, a.${sql(contentCol)} as content, 
             a.${sql(summaryCol)} as summary,
             a.image_url, a.category_id, a.published_at, a.views, a.author, a.tags,
             c.slug as category_slug
      FROM articles a
      JOIN categories c ON a.category_id = c.id
      WHERE (a.id::text = ${id} OR a.slug = ${id}) 
      AND a.status = 'published'
      LIMIT 1
    `;

    if (articles.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = articles[0];

    // Increment views (safely using the actual ID)
    await sql`UPDATE articles SET views = views + 1 WHERE id = ${article.id}`;

    res.json(article);
  } catch (error: any) {
    console.error('API Article Detail Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch article', 
      details: error.message 
    });
  }
}
