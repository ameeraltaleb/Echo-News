import { getSql, initPostgresDb } from '../src/db/postgres.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const type = req.query.type;
  const siteUrl = req.headers.host?.includes('localhost')
    ? `http://${req.headers.host}`
    : `https://${req.headers.host}`;

  try {
    await initPostgresDb();
    const sql = getSql();

    // 1. ROBOTS.TXT
    if (type === 'robots') {
      const robotsTxt = `# Echo News - robots.txt
User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
Sitemap: ${siteUrl}/news-sitemap.xml

Disallow: /admin
Disallow: /api/admin/

Allow: /article/
Allow: /news/
Allow: /category/
Allow: /api/articles
Allow: /rss.xml
`;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      return res.status(200).send(robotsTxt);
    }

    // 2. REDIRECT (/article/:id -> /news/:slug)
    if (type === 'redirect') {
      const { id } = req.query;
      if (!id) return res.redirect(302, '/');
      
      const articles = await sql`SELECT slug FROM articles WHERE id::text = ${id} OR slug = ${id}`;
      if (articles.length > 0 && articles[0].slug) {
        res.writeHead(301, { Location: `/news/${articles[0].slug}` });
        return res.end();
      }
      return res.redirect(302, '/');
    }

    // 3. SITEMAP.XML
    if (type === 'sitemap') {
      const articles = await sql`
        SELECT a.id, a.slug, a.published_at 
        FROM articles a 
        WHERE a.status = 'published' AND a.published_at <= ${new Date().toISOString()} 
        ORDER BY a.published_at DESC
      `;
      const categories = await sql`SELECT slug FROM categories`;

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      xml += `  <url><loc>${siteUrl}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>\n`;
      for (const cat of categories) {
        xml += `  <url><loc>${siteUrl}/category/${cat.slug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>\n`;
      }
      for (const a of articles) {
        const lastmod = new Date(a.published_at).toISOString().split('T')[0];
        const path = a.slug ? `/news/${a.slug}` : `/article/${a.id}`;
        xml += `  <url><loc>${siteUrl}${path}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>\n`;
      }
      xml += `</urlset>`;

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
      return res.status(200).send(xml);
    }

    // 4. NEWS-SITEMAP.XML
    if (type === 'news-sitemap') {
      const siteNameRows = await sql`SELECT value FROM settings WHERE key = 'site_name'`;
      const siteName = siteNameRows[0]?.value || 'Echo News';
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const newsArticles = await sql`
        SELECT a.id, a.slug, a.title_en, a.published_at FROM articles a 
        WHERE a.status = 'published' AND a.published_at >= ${twoDaysAgo.toISOString()} AND a.published_at <= ${new Date().toISOString()} 
        ORDER BY a.published_at DESC LIMIT 1000
      `;

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n`;
      for (const a of newsArticles) {
        const path = a.slug ? `/news/${a.slug}` : `/article/${a.id}`;
        xml += `  <url>\n    <loc>${siteUrl}${path}</loc>\n    <news:news>\n      <news:publication><news:name><![CDATA[${siteName}]]></news:name><news:language>en</news:language></news:publication>\n      <news:publication_date>${new Date(a.published_at).toISOString()}</news:publication_date>\n      <news:title><![CDATA[${a.title_en}]]></news:title>\n    </news:news>\n  </url>\n`;
      }
      xml += `</urlset>`;

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800');
      return res.status(200).send(xml);
    }

    // 5. RSS.XML
    if (type === 'rss') {
      const settingsRows = await sql`SELECT key, value FROM settings WHERE key IN ('site_name', 'seo_description')`;
      const settings = Object.fromEntries(settingsRows.map(r => [r.key, r.value]));
      const siteName = settings.site_name || 'Echo News';
      const lang = req.query.lang || 'ar';
      
      const articles = await sql`
        SELECT a.id, a.slug, a.title_en, a.title_ar, a.summary_en, a.summary_ar, a.image_url, a.published_at, a.author, c.slug as category_slug
        FROM articles a JOIN categories c ON a.category_id = c.id
        WHERE a.status = 'published' AND a.published_at <= ${new Date().toISOString()}
        ORDER BY a.published_at DESC LIMIT 50
      `;

      const siteDesc = settings.seo_description || (lang === 'ar' ? 'آخر الأخبار والمقالات' : 'Latest news');
      let rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">\n  <channel>\n    <title>${siteName}</title>\n    <link>${siteUrl}</link>\n    <description>${siteDesc}</description>\n    <language>${lang}</language>\n    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
      for (const a of articles) {
        const title = lang === 'ar' ? a.title_ar : a.title_en;
        const summary = lang === 'ar' ? a.summary_ar : a.summary_en;
        const path = a.slug ? `/news/${a.slug}` : `/article/${a.id}`;
        rss += `    <item>\n      <title><![CDATA[${title}]]></title>\n      <link>${siteUrl}${path}</link>\n      <guid isPermaLink="false">${a.slug || a.id}</guid>\n      <description><![CDATA[${summary}]]></description>\n      <pubDate>${new Date(a.published_at).toUTCString()}</pubDate>\n      ${a.image_url ? `      <media:content url="${a.image_url}" medium="image" />\n` : ''}    </item>\n`;
      }
      rss += `  </channel>\n</rss>`;

      res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800');
      return res.status(200).send(rss);
    }

    // 6. DEBUG (Diagnostic)
    if (type === 'debug') {
      const articleCount = await sql`SELECT COUNT(*) as count FROM articles`;
      const categoryCount = await sql`SELECT COUNT(*) as count FROM categories`;
      const settingsCount = await sql`SELECT COUNT(*) as count FROM settings`;
      const sampleArticles = await sql`SELECT id, title_en, status, published_at FROM articles LIMIT 5`;

      return res.status(200).json({
        database: 'connected',
        counts: {
          articles: parseInt(articleCount[0].count),
          categories: parseInt(categoryCount[0].count),
          settings: parseInt(settingsCount[0].count)
        },
        sample: sampleArticles,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL_ENV: process.env.VERCEL_ENV
        }
      });
    }

    return res.status(400).json({ error: 'Invalid type' });
  } catch (err) {
    console.error('SEO Error:', err);
    if (type === 'sitemap' || type === 'news-sitemap' || type === 'rss') {
      res.setHeader('Content-Type', 'application/xml');
      return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><error>Service Temporarily Unavailable</error>');
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
