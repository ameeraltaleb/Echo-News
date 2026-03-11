import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { sql, initPostgresDb } from './src/db/postgres.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  if (!process.env.DATABASE_URL) {
    console.warn("WARNING: DATABASE_URL environment variable is not set.");
    console.warn("The server will start, but database-dependent features will not work.");
    console.warn("Please set DATABASE_URL to your PostgreSQL connection string in a .env file.");
  } else {
    await initPostgresDb();
  }

  app.use(express.json());
  app.use('/uploads', express.static(uploadDir));

  // Middleware to check DB connection for API routes
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api')) return next();
    
    // Allow login without DB just in case, though it might not be useful
    if (req.path === '/api/admin/login') return next();
    
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ 
        error: 'Service Unavailable', 
        message: 'Database is not configured. Please set DATABASE_URL.' 
      });
    }
    next();
  });

  // API Routes
  app.get('/api/articles', async (req, res) => {
    const lang = req.query.lang || 'en';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const categorySlug = req.query.category as string;
    const searchQuery = req.query.q as string;
    const sort = req.query.sort as string;
    const excludeId = req.query.exclude ? parseInt(req.query.exclude as string) : null;
    
    try {
      let query = `
        SELECT a.id, a.title_${lang} as title, a.summary_${lang} as summary, 
               a.image_url, a.category_id, a.published_at, a.views, a.status, a.tags
        FROM articles a
      `;
      const params: any[] = [];
      let pIdx = 1;
      const conditions: string[] = [" a.status = 'published' ", ` a.published_at <= $${pIdx++} `];
      params.push(new Date().toISOString());

      if (categorySlug) {
        query += ` JOIN categories c ON a.category_id = c.id `;
        conditions.push(` c.slug = $${pIdx++} `);
        params.push(categorySlug);
      }

      if (excludeId) {
        conditions.push(` a.id != $${pIdx++} `);
        params.push(excludeId);
      }

      if (searchQuery) {
        conditions.push(` (a.title_en ILIKE $${pIdx} OR a.title_ar ILIKE $${pIdx} OR a.summary_en ILIKE $${pIdx} OR a.summary_ar ILIKE $${pIdx}) `);
        params.push(`%${searchQuery}%`);
        pIdx++;
      }

      if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
      }

      if (sort === 'views') {
        query += ` ORDER BY a.views DESC LIMIT $${pIdx++} `;
      } else {
        query += ` ORDER BY a.published_at DESC LIMIT $${pIdx++} `;
      }
      params.push(limit);

      const articles = await sql.unsafe(query, params);
      res.json(articles);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch articles' });
    }
  });

  app.get('/api/categories/:slug', async (req, res) => {
    const lang = req.query.lang || 'en';
    const slug = req.params.slug;
    try {
      const langCol = lang === 'ar' ? 'name_ar' : 'name_en';
      const category = await sql.unsafe(`SELECT id, ${langCol} as name, slug FROM categories WHERE slug = $1`, [slug]);
      
      if (category.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json(category[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch category' });
    }
  });

  app.get('/api/articles/:id', async (req, res) => {
    const lang = req.query.lang || 'en';
    const id = req.params.id;
    
    try {
      const langColTitle = lang === 'ar' ? 'title_ar' : 'title_en';
      const langColContent = lang === 'ar' ? 'content_ar' : 'content_en';
      const article = await sql.unsafe(`
        SELECT a.id, a.${langColTitle} as title, a.${langColContent} as content, 
               a.image_url, a.category_id, a.published_at, a.views, a.author,
               a.status, a.tags, c.slug as category_slug
        FROM articles a
        JOIN categories c ON a.category_id = c.id
        WHERE a.id = $1 AND a.status = 'published' AND a.published_at <= $2
      `, [id, new Date().toISOString()]);
      
      if (article.length === 0) {
        return res.status(404).json({ error: 'Article not found' });
      }
      
      // Increment views
      await sql`UPDATE articles SET views = views + 1 WHERE id = ${id}`;
      
      res.json(article[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch article' });
    }
  });

  app.get('/api/categories', async (req, res) => {
    const lang = req.query.lang || 'en';
    try {
      const langCol = lang === 'ar' ? 'name_ar' : 'name_en';
      const categories = await sql.unsafe(`SELECT id, ${langCol} as name, slug FROM categories`);
      res.json(categories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Admin API Routes (Simple Auth for demo)
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'echo-news-secret-2026';

  const isAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader === `Bearer ${ADMIN_TOKEN}`) {
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };

  // Maintenance Mode Middleware
  app.use(async (req, res, next) => {
    if (req.path.startsWith('/api/admin') || req.path.startsWith('/api/admin/login') || !req.path.startsWith('/api')) {
      return next();
    }

    try {
      const maintenance = await sql`SELECT value FROM settings WHERE key = 'maintenance_mode'`;
      if (maintenance.length > 0 && maintenance[0].value === 'true') {
        return res.status(503).json({ error: 'Maintenance Mode', message: 'The site is currently under maintenance. Please check back later.' });
      }
    } catch (error) {
      console.error('Maintenance check failed:', error);
    }
    next();
  });

  app.get('/api/settings', async (req, res) => {
    try {
      const settingsRows = await sql`SELECT key, value FROM settings`;
      const settings = settingsRows.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
      }, {} as Record<string, string>);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.get('/api/admin/settings', isAdmin, async (req, res) => {
    try {
      const settings = await sql`SELECT key, value FROM settings`;
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch admin settings' });
    }
  });

  app.post('/api/admin/settings', isAdmin, async (req, res) => {
    const settingsObj = req.body;
    try {
      for (const [key, value] of Object.entries(settingsObj)) {
        await sql`
          INSERT INTO settings (key, value) VALUES (${key}, ${value as string})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `;
      }
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    if (password === adminPassword) {
      res.json({ token: ADMIN_TOKEN });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  });

  app.get('/api/admin/articles', isAdmin, async (req, res) => {
    try {
      const articles = await sql`
        SELECT id, title_en, title_ar, category_id, published_at, views, author, status, tags,
               content_en, content_ar, summary_en, summary_ar, image_url
        FROM articles 
        ORDER BY published_at DESC
      `;
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch admin articles' });
    }
  });

  app.post('/api/admin/upload', isAdmin, upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl });
  });

  app.post('/api/admin/articles', isAdmin, async (req, res) => {
    const { 
      category_id, title_en, title_ar, summary_en, summary_ar, 
      content_en, content_ar, image_url, author, status, published_at, tags 
    } = req.body;

    try {
      const result = await sql`
        INSERT INTO articles (
          category_id, title_en, title_ar, summary_en, summary_ar, 
          content_en, content_ar, image_url, author, status, published_at, tags
        ) VALUES (
          ${category_id}, ${title_en}, ${title_ar}, ${summary_en}, ${summary_ar}, 
          ${content_en}, ${content_ar}, ${image_url}, ${author}, ${status || 'published'}, 
          ${published_at || new Date().toISOString()}, ${tags ? JSON.stringify(tags) : '[]'}
        ) RETURNING id
      `;
      res.json({ id: result[0].id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create article' });
    }
  });

  app.put('/api/admin/articles/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { 
      category_id, title_en, title_ar, summary_en, summary_ar, 
      content_en, content_ar, image_url, author, status, published_at, tags 
    } = req.body;

    try {
      await sql`
        UPDATE articles SET 
          category_id = ${category_id}, title_en = ${title_en}, title_ar = ${title_ar}, 
          summary_en = ${summary_en}, summary_ar = ${summary_ar}, content_en = ${content_en}, 
          content_ar = ${content_ar}, image_url = ${image_url}, author = ${author}, status = ${status},
          published_at = ${published_at || new Date().toISOString()}, tags = ${tags ? JSON.stringify(tags) : '[]'}
        WHERE id = ${id}
      `;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update article' });
    }
  });

  app.delete('/api/admin/articles/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      await sql`DELETE FROM articles WHERE id = ${id}`;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete article' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT as number, '0.0.0.0', () => {
    console.log(`Production Server running on http://localhost:${PORT}`);
  });
}

startServer();
