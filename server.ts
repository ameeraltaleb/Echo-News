import express from 'express';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.js';
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
  const PORT = 3000;

  app.use(express.json());
  app.use('/uploads', express.static(uploadDir));

  // API Routes
  app.get('/api/articles', (req, res) => {
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
      const conditions: string[] = [" a.status = 'published' ", " a.published_at <= ? "];
      params.push(new Date().toISOString());

      if (categorySlug) {
        query += ` JOIN categories c ON a.category_id = c.id `;
        conditions.push(` c.slug = ? `);
        params.push(categorySlug);
      }

      if (excludeId) {
        conditions.push(` a.id != ? `);
        params.push(excludeId);
      }

      if (searchQuery) {
        conditions.push(` (a.title_en LIKE ? OR a.title_ar LIKE ? OR a.summary_en LIKE ? OR a.summary_ar LIKE ?) `);
        const searchParam = `%${searchQuery}%`;
        params.push(searchParam, searchParam, searchParam, searchParam);
      }

      if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
      }

      if (sort === 'views') {
        query += ` ORDER BY a.views DESC LIMIT ? `;
      } else {
        query += ` ORDER BY a.published_at DESC LIMIT ? `;
      }
      params.push(limit);

      const articles = db.prepare(query).all(...params);
      res.json(articles);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch articles' });
    }
  });

  app.get('/api/categories/:slug', (req, res) => {
    const lang = req.query.lang || 'en';
    const slug = req.params.slug;
    try {
      const category = db.prepare(`
        SELECT id, name_${lang} as name, slug
        FROM categories
        WHERE slug = ?
      `).get(slug);
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch category' });
    }
  });

  app.get('/api/articles/:id', (req, res) => {
    const lang = req.query.lang || 'en';
    const id = req.params.id;
    
    try {
      const article = db.prepare(`
        SELECT a.id, a.title_${lang} as title, a.content_${lang} as content, 
               a.image_url, a.category_id, a.published_at, a.views, a.author,
               a.status, a.tags, c.slug as category_slug
        FROM articles a
        JOIN categories c ON a.category_id = c.id
        WHERE a.id = ? AND a.status = 'published' AND a.published_at <= ?
      `).get(id, new Date().toISOString());
      
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }
      
      // Increment views
      db.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').run(id);
      
      res.json(article);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch article' });
    }
  });

  app.get('/api/categories', (req, res) => {
    const lang = req.query.lang || 'en';
    try {
      const categories = db.prepare(`
        SELECT id, name_${lang} as name, slug
        FROM categories
      `).all();
      res.json(categories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Admin API Routes (Simple Auth for demo)
  const ADMIN_TOKEN = 'echo-news-secret-2026';

  const isAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader === `Bearer ${ADMIN_TOKEN}`) {
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };

  // Maintenance Mode Middleware
  app.use((req, res, next) => {
    // Skip maintenance check for admin API and static assets
    if (req.path.startsWith('/api/admin') || req.path.startsWith('/api/admin/login') || !req.path.startsWith('/api')) {
      return next();
    }

    try {
      const maintenance = db.prepare('SELECT value FROM settings WHERE key = ?').get('maintenance_mode') as { value: string };
      if (maintenance?.value === 'true') {
        return res.status(503).json({ error: 'Maintenance Mode', message: 'The site is currently under maintenance. Please check back later.' });
      }
    } catch (error) {
      console.error('Maintenance check failed:', error);
    }
    next();
  });

  app.get('/api/settings', (req, res) => {
    try {
      const settingsRows = db.prepare('SELECT key, value FROM settings').all() as { key: string, value: string }[];
      const settings = settingsRows.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
      }, {} as Record<string, string>);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.get('/api/admin/settings', isAdmin, (req, res) => {
    try {
      const settings = db.prepare('SELECT key, value FROM settings').all();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch admin settings' });
    }
  });

  app.post('/api/admin/settings', isAdmin, (req, res) => {
    const settings = req.body; // Expecting an object { key: value, ... }
    try {
      const updateStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
      const transaction = db.transaction((settingsObj) => {
        for (const [key, value] of Object.entries(settingsObj)) {
          updateStmt.run(key, value);
        }
      });
      transaction(settings);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === 'admin123') { // Simple hardcoded password for now
      res.json({ token: ADMIN_TOKEN });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  });

  app.get('/api/admin/articles', isAdmin, (req, res) => {
    try {
      const articles = db.prepare(`
        SELECT id, title_en, title_ar, category_id, published_at, views, author, status, tags,
               content_en, content_ar, summary_en, summary_ar, image_url
        FROM articles 
        ORDER BY published_at DESC
      `).all();
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

  app.post('/api/admin/articles', isAdmin, (req, res) => {
    const { 
      category_id, title_en, title_ar, summary_en, summary_ar, 
      content_en, content_ar, image_url, author, status, published_at, tags 
    } = req.body;

    try {
      const result = db.prepare(`
        INSERT INTO articles (
          category_id, title_en, title_ar, summary_en, summary_ar, 
          content_en, content_ar, image_url, author, status, published_at, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        category_id, title_en, title_ar, summary_en, summary_ar, 
        content_en, content_ar, image_url, author, status || 'published',
        published_at || new Date().toISOString(),
        tags ? JSON.stringify(tags) : '[]'
      );
      res.json({ id: result.lastInsertRowid });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create article' });
    }
  });

  app.put('/api/admin/articles/:id', isAdmin, (req, res) => {
    const { id } = req.params;
    const { 
      category_id, title_en, title_ar, summary_en, summary_ar, 
      content_en, content_ar, image_url, author, status, published_at, tags 
    } = req.body;

    try {
      db.prepare(`
        UPDATE articles SET 
          category_id = ?, title_en = ?, title_ar = ?, 
          summary_en = ?, summary_ar = ?, content_en = ?, 
          content_ar = ?, image_url = ?, author = ?, status = ?,
          published_at = ?, tags = ?
        WHERE id = ?
      `).run(
        category_id, title_en, title_ar, summary_en, summary_ar, 
        content_en, content_ar, image_url, author, status,
        published_at || new Date().toISOString(),
        tags ? JSON.stringify(tags) : '[]',
        id
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update article' });
    }
  });

  app.delete('/api/admin/articles/:id', isAdmin, (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM articles WHERE id = ?').run(id);
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
