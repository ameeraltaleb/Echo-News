import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
const dbPath = path.join(__dirname, '../../echo-news.db');
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Migration: Add status column if it doesn't exist
try {
  db.prepare("SELECT status FROM articles LIMIT 1").get();
} catch (e) {
  try {
    db.exec("ALTER TABLE articles ADD COLUMN status TEXT DEFAULT 'published'");
    console.log("Migration: Added status column to articles table");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

// Migration: Add tags column if it doesn't exist
try {
  db.prepare("SELECT tags FROM articles LIMIT 1").get();
} catch (e) {
  try {
    db.exec("ALTER TABLE articles ADD COLUMN tags TEXT DEFAULT '[]'");
    console.log("Migration: Added tags column to articles table");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    title_en TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    summary_en TEXT,
    summary_ar TEXT,
    content_en TEXT,
    content_ar TEXT,
    image_url TEXT,
    author TEXT,
    status TEXT DEFAULT 'published',
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    views INTEGER DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories (id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed settings if empty
const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
if (settingsCount.count === 0) {
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('site_name', 'ECHO NEWS');
  insertSetting.run('seo_description', 'Delivering accurate, unbiased, and timely news from around the globe. Your trusted source for world events.');
  insertSetting.run('facebook_url', 'https://facebook.com');
  insertSetting.run('twitter_url', 'https://twitter.com');
  insertSetting.run('instagram_url', 'https://instagram.com');
  insertSetting.run('maintenance_mode', 'false');
  console.log('Settings seeded successfully.');
}

// Seed data if empty
const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };

if (categoryCount.count === 0) {
  const insertCategory = db.prepare(`
    INSERT INTO categories (slug, name_en, name_ar) 
    VALUES (?, ?, ?)
  `);

  const categories = [
    { slug: 'world', en: 'World', ar: 'العالم' },
    { slug: 'business', en: 'Business', ar: 'أعمال' },
    { slug: 'technology', en: 'Technology', ar: 'تكنولوجيا' },
    { slug: 'science', en: 'Science', ar: 'علوم' },
    { slug: 'health', en: 'Health', ar: 'صحة' },
    { slug: 'sports', en: 'Sports', ar: 'رياضة' }
  ];

  const catIds: Record<string, number> = {};
  
  categories.forEach(cat => {
    const info = insertCategory.run(cat.slug, cat.en, cat.ar);
    catIds[cat.slug] = info.lastInsertRowid as number;
  });

  const insertArticle = db.prepare(`
    INSERT INTO articles (
      category_id, title_en, title_ar, summary_en, summary_ar, 
      content_en, content_ar, image_url, author, published_at, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const articles = [
    {
      category: 'world',
      title_en: 'Global Climate Summit Reaches Historic Agreement',
      title_ar: 'قمة المناخ العالمية تتوصل إلى اتفاق تاريخي',
      summary_en: 'World leaders have agreed on a new framework to reduce carbon emissions by 50% over the next decade.',
      summary_ar: 'اتفق قادة العالم على إطار عمل جديد لخفض انبعاثات الكربون بنسبة 50٪ خلال العقد المقبل.',
      content_en: 'In a landmark decision today, representatives from over 190 countries signed the new Climate Accord. The agreement mandates strict reductions in fossil fuel usage and provides funding for developing nations to transition to renewable energy sources. Experts call this the most significant environmental treaty since the Paris Agreement.',
      content_ar: 'في قرار تاريخي اليوم، وقع ممثلون من أكثر من 190 دولة على اتفاقية المناخ الجديدة. تلزم الاتفاقية بتخفيضات صارمة في استخدام الوقود الأحفوري وتوفر تمويلاً للدول النامية للانتقال إلى مصادر الطاقة المتجددة. يصف الخبراء هذه المعاهدة بأنها الأهم بيئياً منذ اتفاقية باريس.',
      image_url: 'https://picsum.photos/seed/climate/800/450',
      author: 'Sarah Jenkins',
      published_at: new Date().toISOString()
    },
    {
      category: 'technology',
      title_en: 'Next-Gen AI Models Show Unprecedented Reasoning Capabilities',
      title_ar: 'نماذج الذكاء الاصطناعي من الجيل القادم تظهر قدرات استنتاج غير مسبوقة',
      summary_en: 'Researchers have unveiled a new AI architecture that significantly improves logical reasoning and problem-solving.',
      summary_ar: 'كشف الباحثون عن بنية جديدة للذكاء الاصطناعي تعمل على تحسين التفكير المنطقي وحل المشكلات بشكل كبير.',
      content_en: 'The tech industry was stunned today as a leading research lab demonstrated their latest AI model. Unlike previous iterations that relied heavily on pattern matching, this new system exhibits genuine step-by-step logical deduction. Applications in medicine, law, and software engineering are already being explored.',
      content_ar: 'أذهلت صناعة التكنولوجيا اليوم عندما عرض مختبر أبحاث رائد أحدث نموذج للذكاء الاصطناعي لديهم. على عكس التكرارات السابقة التي اعتمدت بشكل كبير على مطابقة الأنماط، يُظهر هذا النظام الجديد استنتاجاً منطقياً حقيقياً خطوة بخطوة. يتم بالفعل استكشاف تطبيقات في الطب والقانون وهندسة البرمجيات.',
      image_url: 'https://picsum.photos/seed/ai/800/450',
      author: 'Ahmed Hassan',
      published_at: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
    },
    {
      category: 'business',
      title_en: 'Markets Rally as Inflation Hits Two-Year Low',
      title_ar: 'انتعاش الأسواق مع وصول التضخم إلى أدنى مستوى له في عامين',
      summary_en: 'Global stock markets surged following reports that inflation has cooled faster than expected.',
      summary_ar: 'ارتفعت أسواق الأسهم العالمية في أعقاب تقارير تفيد بأن التضخم قد تباطأ بشكل أسرع من المتوقع.',
      content_en: 'Investors breathed a sigh of relief as new economic data showed inflation dropping to 2.8%, the lowest level in 24 months. The S&P 500 and FTSE 100 both saw gains of over 2% in morning trading. Central banks are now expected to pause interest rate hikes.',
      content_ar: 'تنفس المستثمرون الصعداء بعد أن أظهرت بيانات اقتصادية جديدة انخفاض التضخم إلى 2.8٪، وهو أدنى مستوى في 24 شهراً. شهد كل من مؤشر S&P 500 و FTSE 100 مكاسب بأكثر من 2٪ في التداولات الصباحية. من المتوقع الآن أن توقف البنوك المركزية رفع أسعار الفائدة.',
      image_url: 'https://picsum.photos/seed/market/800/450',
      author: 'Elena Rostova',
      published_at: new Date(Date.now() - 3600000 * 5).toISOString() // 5 hours ago
    },
    {
      category: 'health',
      title_en: 'Breakthrough in Alzheimer\'s Treatment Shows Promise',
      title_ar: 'اختراق في علاج مرض الزهايمر يظهر نتائج واعدة',
      summary_en: 'A new drug has shown significant ability to slow cognitive decline in early-stage Alzheimer\'s patients.',
      summary_ar: 'أظهر دواء جديد قدرة كبيرة على إبطاء التدهور المعرفي لدى مرضى الزهايمر في مراحله المبكرة.',
      content_en: 'Clinical trials for a novel monoclonal antibody have yielded exciting results. Patients receiving the treatment showed a 35% reduction in cognitive decline compared to the placebo group over an 18-month period. Regulatory approval is expected later this year.',
      content_ar: 'أسفرت التجارب السريرية لجسم مضاد وحيد النسيلة جديد عن نتائج مثيرة. أظهر المرضى الذين تلقوا العلاج انخفاضاً بنسبة 35٪ في التدهور المعرفي مقارنة بمجموعة الدواء الوهمي على مدى 18 شهراً. من المتوقع الحصول على الموافقة التنظيمية في وقت لاحق من هذا العام.',
      image_url: 'https://picsum.photos/seed/health/800/450',
      author: 'Dr. James Wilson',
      published_at: new Date(Date.now() - 3600000 * 12).toISOString() // 12 hours ago
    },
    {
      category: 'sports',
      title_en: 'Underdog Team Secures Historic Championship Victory',
      title_ar: 'الفريق المستضعف يحقق فوزاً تاريخياً بالبطولة',
      summary_en: 'In a stunning upset, the lowest-ranked team in the tournament has claimed the championship trophy.',
      summary_ar: 'في مفاجأة مذهلة، حصد الفريق الأقل تصنيفاً في البطولة كأس البطولة.',
      content_en: 'Sports history was made last night as the city\'s beloved underdogs defeated the reigning champions 3-2 in overtime. The victory marks the team\'s first championship in their 50-year history, sparking city-wide celebrations that lasted well into the morning.',
      content_ar: 'صُنع تاريخ الرياضة الليلة الماضية عندما هزم الفريق المستضعف المحبوب في المدينة الأبطال المدافعين عن اللقب 3-2 في الوقت الإضافي. يمثل هذا الفوز أول بطولة للفريق في تاريخه الممتد لـ 50 عاماً، مما أثار احتفالات عمت جميع أنحاء المدينة واستمرت حتى الصباح.',
      image_url: 'https://picsum.photos/seed/sports/800/450',
      author: 'Marcus Johnson',
      published_at: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
      status: 'published'
    }
  ];

  articles.forEach(art => {
    insertArticle.run(
      catIds[art.category],
      art.title_en,
      art.title_ar,
      art.summary_en,
      art.summary_ar,
      art.content_en,
      art.content_ar,
      art.image_url,
      art.author,
      art.published_at,
      art.status
    );
  });
  
  console.log('Database seeded successfully.');
}
