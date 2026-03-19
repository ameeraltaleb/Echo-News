import { verifyAuthHeader } from '../_lib/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Verify Authentication
    const payload = await verifyAuthHeader(req.headers.authorization);
    if (!payload || payload.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Get query params
    const query = req.query.q;
    const page = req.query.page || '1';

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query (q) is required.' });
    }

    if (!process.env.UNSPLASH_ACCESS_KEY) {
      return res.status(500).json({ error: 'UNSPLASH_ACCESS_KEY is missing on the server.' });
    }

    // 3. Fetch from Unsplash API
    const unsplashRes = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=12&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
        }
      }
    );

    if (!unsplashRes.ok) {
      const errText = await unsplashRes.text();
      console.error('Unsplash API error:', errText);
      return res.status(unsplashRes.status).json({ error: 'Unsplash API error' });
    }

    const data = await unsplashRes.json();

    // 4. Return simplified results
    const images = data.results.map((img: any) => ({
      id: img.id,
      url_small: img.urls.small,
      url_regular: img.urls.regular,
      url_full: img.urls.full,
      alt: img.alt_description || img.description || 'Unsplash image',
      author: img.user.name,
      author_url: img.user.links.html,
      download_url: img.links.download_location,
    }));

    res.status(200).json({
      images,
      total: data.total,
      total_pages: data.total_pages,
    });
  } catch (err: any) {
    console.error('Unsplash search error:', err);
    res.status(500).json({ error: 'Failed to search images.' });
  }
}
