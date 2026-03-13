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

    const siteName = 'Echo News';

    // Fetch latest published articles
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

    const lang = req.query.lang || 'en';
    const now = new Date().toUTCString();

    let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${siteName}</title>
    <link>${siteUrl}</link>
    <description>${lang === 'ar' ? 'آخر الأخبار والمقالات من إيكو نيوز' : 'Latest news and articles from Echo News'}</description>
    <language>${lang}</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${siteUrl}/api/rss?lang=${lang}" rel="self" type="application/rss+xml" />
    <image>
      <url>${siteUrl}/favicon.ico</url>
      <title>${siteName}</title>
      <link>${siteUrl}</link>
    </image>`;

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
    res.status(200).send(rss);
  } catch (err: any) {
    console.error('RSS feed error:', err);
    res.status(500).json({ error: 'Failed to generate RSS feed' });
  }
}
