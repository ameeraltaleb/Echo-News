import { getSql, initPostgresDb } from '../../src/db/postgres.js';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'echo-news-secret-2026';

async function ensureDb() {
  await initPostgresDb();
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await ensureDb();
    const sql = getSql();

    if (req.method === 'GET') {
      const settings = await sql`SELECT key, value FROM settings`;
      res.json(settings);
    } else if (req.method === 'POST') {
      const settings = req.body;
      
      // Update each setting
      for (const [key, value] of Object.entries(settings)) {
        await sql`
          INSERT INTO settings (key, value) 
          VALUES (${key}, ${String(value)})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `;
      }
      
      res.json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API Admin Settings Error:', error);
    res.status(500).json({ 
      error: 'Failed to process settings', 
      details: error.message 
    });
  }
}
