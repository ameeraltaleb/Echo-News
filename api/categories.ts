import { getSql, initPostgresDb } from '../src/db/postgres.js';

async function ensureDb() {
  await initPostgresDb();
}

export default async function handler(req, res) {
  await ensureDb();
  const sql = getSql();
  const lang = req.query.lang || 'en';
  const slug = req.query.slug;
  
  try {
    const langCol = lang === 'ar' ? 'name_ar' : 'name_en';
    
    if (slug) {
        const category = await sql.unsafe(`SELECT id, ${langCol} as name, slug FROM categories WHERE slug = $1`, [slug]);
        if (category.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(category[0]);
    } else {
        const categories = await sql.unsafe(`SELECT id, ${langCol} as name, slug FROM categories`);
        res.json(categories);
    }
  } catch (error: any) {
    console.error('API Categories Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch categories',
      details: error.message 
    });
  }
}
