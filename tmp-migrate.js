
import { getSql } from './src/db/postgres.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
  const sql = getSql();
  console.log('Starting migration: adding slug column to articles table...');
  try {
    // 1. Add slug column if it doesn't exist
    await sql`
      ALTER TABLE articles 
      ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
    `;
    console.log('Column slug added (or already exists).');

    // 2. Populate slug for existing articles that don't have one
    const articles = await sql`
      SELECT id, title_en FROM articles WHERE slug IS NULL OR slug = '';
    `;
    
    console.log(`Found ${articles.length} articles to update.`);
    
    for (const article of articles) {
      let slug = article.title_en
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      if (!slug) slug = `article-${article.id}`;
      
      // Ensure uniqueness by appending ID if needed (though title_en usually differs)
      try {
        await sql`
          UPDATE articles 
          SET slug = ${slug} 
          WHERE id = ${article.id};
        `;
      } catch (err) {
        // If slug collision, append ID
        await sql`
          UPDATE articles 
          SET slug = ${slug + '-' + article.id} 
          WHERE id = ${article.id};
        `;
      }
    }
    
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
