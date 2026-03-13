import { getSql, initPostgresDb } from '../src/db/postgres.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const type = req.query.type;

  if (!type || !['sitemap', 'robots', 'rss'].includes(type)) {
    return res.status(400).json({ error: 'Missing or invalid type. Use ?type=sitemap, ?type=robots, or ?type=rss' });
  }

  const siteUrl = req.headers.host?.includes('localhost')
    ? `http://${req.headers.host}`
    : `https://${req.headers.host}`;

  // --- ROBOTS.TXT ---
  if (type === 'robots') {
    const robotsTxt = `# Echo News - robots.txt
User-agent: *
Allow: /

Sitemap: ${siteUrl}/api/seo?type=sitemap

Disallow: /admin
Disallow: /api/admin/

Allow: /article/
Allow: /category/
Allow: /api/articles
Allow: /api/seo?type=rss
`;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(robotsTxt);
  }

  // --- SITEMAP & RSS need DB ---
  try {
    await initPostgresDb();
    const sql = getSql();

    // --- SITEMAP.XML ---
    if (type === 'sitemap') {
      const articles = await sql`
        SELECT a.id, a.published_at, c.slug as category_slug
        FROM articles a
        JOIN categories c ON a.category_id = c.id
        WHERE a.status = 'published'
        AND a.published_at <= ${new Date().toISOString()}
        ORDER BY a.published_at DESC
      `;
      const categories = await sql`SELECT slug FROM categories`;

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>`;

      for (const cat of categories) {
        xml += `
  <url>
    <loc>${siteUrl}/category/${cat.slug}</loc>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }

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
      return res.status(200).send(xml);
    }

    // --- RSS FEED ---
    if (type === 'rss') {
      const lang = req.query.lang || 'en';
      const siteName = 'Echo News';

      const articles = await sql`
        SELECT a.id, a.title_en, a.title_ar, a.summary_en, a.summary_ar,
               a.image_url, a.published_at, a.author, c.slug as category_slug
        FROM articles a
        JOIN categories c ON a.category_id = c.id
        WHERE a.status = 'published'
        AND a.published_at <= ${new Date().toISOString()}
        ORDER BY a.published_at DESC
        LIMIT 50
      `;

      const now = new Date().toUTCString();

      let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${siteName}</title>
    <link>${siteUrl}</link>
    <description>${lang === 'ar' ? 'آخر الأخبار والمقالات من إيكو نيوز' : 'Latest news and articles from Echo News'}</description>
    <language>${lang}</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${siteUrl}/api/seo?type=rss&lang=${lang}" rel="self" type="application/rss+xml" />`;

      for (const article of articles) {
        const title = lang === 'ar' ? article.title_ar : article.title_en;
        const summary = lang === 'ar' ? article.summary_ar : article.summary_en;
        const pubDate = new Date(article.published_at).toUTCString();
        const link = `${siteUrl}/article/${article.id}`;

        rss += `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${summary}]]></description>
      <pubDate>${pubDate}</pubDate>
      <author>${article.author || siteName}</author>
      <category>${article.category_slug}</category>
      ${article.image_url ? `<media:content url="${article.image_url}" medium="image" />` : ''}
    </item>`;
      }

      rss += `
  </channel>
</rss>`;

      res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800');
      return res.status(200).send(rss);
    }
  } catch (err: any) {
    console.error('SEO endpoint error:', err);
    res.status(500).json({ error: 'Failed to generate SEO content' });
  }
}
