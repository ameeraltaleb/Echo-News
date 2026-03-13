export default async function handler(req: any, res: any) {
  const siteUrl = req.headers.host?.includes('localhost')
    ? `http://${req.headers.host}`
    : `https://${req.headers.host}`;

  const robotsTxt = `# Echo News - robots.txt
User-agent: *
Allow: /

# Sitemaps
Sitemap: ${siteUrl}/api/sitemap

# Disallow admin routes
Disallow: /admin
Disallow: /api/admin/

# Allow article and category pages
Allow: /article/
Allow: /category/
Allow: /api/articles
Allow: /api/rss
`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.status(200).send(robotsTxt);
}
