import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || '';

export const sql = connectionString ? postgres(connectionString, {
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connect_timeout: 5,
  idle_timeout: 5,
  max_lifetime: 60 * 5,
}) : null as any;

export async function initPostgresDb() {
  if (!sql) {
    console.warn('DATABASE_URL is not set. PostgreSQL initialization skipped.');
    return;
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        name_en TEXT NOT NULL,
        name_ar TEXT NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES categories(id),
        title_en TEXT NOT NULL,
        title_ar TEXT NOT NULL,
        summary_en TEXT,
        summary_ar TEXT,
        content_en TEXT,
        content_ar TEXT,
        image_url TEXT,
        author TEXT,
        status TEXT DEFAULT 'published',
        published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        views INTEGER DEFAULT 0,
        tags TEXT DEFAULT '[]'
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `;

    // Seed settings
    const settingsCount = await sql`SELECT COUNT(*) as count FROM settings`;
    if (parseInt(settingsCount[0].count) === 0) {
      await sql`
        INSERT INTO settings (key, value) VALUES 
        ('site_name', 'ECHO NEWS'),
        ('seo_description', 'Delivering accurate, unbiased, and timely news from around the globe.'),
        ('facebook_url', 'https://facebook.com'),
        ('twitter_url', 'https://twitter.com'),
        ('instagram_url', 'https://instagram.com'),
        ('maintenance_mode', 'false')
      `;
      console.log('PostgreSQL: Settings seeded successfully.');
    }

    // Seed categories
    const categoryCount = await sql`SELECT COUNT(*) as count FROM categories`;
    if (parseInt(categoryCount[0].count) === 0) {
      await sql`
        INSERT INTO categories (slug, name_en, name_ar) VALUES 
        ('world', 'World', 'العالم'),
        ('business', 'Business', 'أعمال'),
        ('technology', 'Technology', 'تكنولوجيا'),
        ('science', 'Science', 'علوم'),
        ('health', 'Health', 'صحة'),
        ('sports', 'Sports', 'رياضة')
      `;
      console.log('PostgreSQL: Categories seeded successfully.');
    }
    
    console.log('PostgreSQL Database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize PostgreSQL database:', error);
  }
}
