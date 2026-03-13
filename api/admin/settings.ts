import { getSql, initPostgresDb } from '../../src/db/postgres.js';
import { verifyAuthHeader } from '../_lib/auth.js';

async function ensureDb() {
  await initPostgresDb();
}

export default async function handler(req, res) {
  const payload = await verifyAuthHeader(req.headers.authorization);
  if (!payload || payload.role !== 'admin') {
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
