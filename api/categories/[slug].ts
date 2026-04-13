import { getSql, initPostgresDb } from '../../src/db/postgres.js';

async function ensureDb() {
  await initPostgresDb();
}

export default async function handler(req, res) {
  const { slug } = req.query;
  const lang = req.query.lang || 'en';

  try {
    await ensureDb();
    const sql = getSql();
    const langCol = lang === 'ar' ? 'name_ar' : 'name_en';

    const categories = await sql`
      SELECT id, ${sql(langCol)} as name, slug
      FROM categories
      WHERE slug = ${slug}
    `;

    if (categories.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(categories[0]);
  } catch (error: any) {
    console.error('API Category Detail Error:', error);
    res.status(500).json({
      error: 'Failed to fetch category'
    });
  }
}
