import 'dotenv/config';
import express from 'express';
import serverless from 'serverless-http';
import { sql, initPostgresDb } from '../src/db/postgres.js';
import multer from 'multer';

const app = express();

// Use memory storage for Vercel Serverless compatibility
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized && process.env.DATABASE_URL) {
    try {
      await initPostgresDb();
      dbInitialized = true;
    } catch (e) {
      console.error("DB Init Error:", e);
    }
  }
}

// Admin Login Route (POST only, reads from ENV)
app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body;
  const expectedPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim();
  
  if ((password || '').trim() === expectedPassword) {
    res.json({ token: process.env.ADMIN_TOKEN || 'echo-news-secret-2026' });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// --- Other Routes (Preserved logic) ---
app.get('/api/articles', async (req, res) => {
  await ensureDb();
  const lang = req.query.lang || 'en';
  try {
    const articles = await sql`SELECT * FROM articles WHERE status = 'published' ORDER BY published_at DESC`;
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// ... (Add other routes here, ensuring no app.listen) ...

// Export as Serverless Function
export default serverless(app);
