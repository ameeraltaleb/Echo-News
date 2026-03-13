import { getSql, initPostgresDb } from '../src/db/postgres.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initPostgresDb();
    const sql = getSql();

    const siteUrl = req.headers.host?.includes('localhost')
      ? `http://${req.headers.host}`
      : `https://${req.headers.host}`;

    // Fetch all published articles
    const articles = await sql`
      SELECT a.id, a.published_at, c.slug as category_slug
      FROM articles a
      JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'published'
      AND a.published_at <= ${new Date().toISOString()}
      ORDER BY a.published_at DESC
    `;

    // Fetch all categories
    const categories = await sql`SELECT slug FROM categories`;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>`;

    // Category pages
    for (const cat of categories) {
      xml += `
  <url>
    <loc>${siteUrl}/category/${cat.slug}</loc>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    // Article pages
    for (const article of articles) {
      const lastmod = new Date(article.published_at).toISOString().split('T')[0];
      xml += `
  <url>
    <loc>${siteUrl}/article/${article.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
    }

    xml += `\n</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.status(200).send(xml);
  } catch (err: any) {
    console.error('Sitemap error:', err);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
}
