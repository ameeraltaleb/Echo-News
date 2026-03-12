import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { ArticleCardSkeleton } from '../components/Skeleton';

interface Article {
  id: number;
  title: string;
  summary: string;
  image_url: string;
  category_id: number;
  published_at: string;
  views: number;
}

interface CategoryData {
  id: number;
  name: string;
  slug: string;
}

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [category, setCategory] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Category Info
        const catRes = await fetch(`/api/categories/${slug}?lang=${language}`);
        if (!catRes.ok) {
          const errorData = await catRes.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || `Category fetch failed: ${catRes.status}`);
        }
        const catData = await catRes.json();
        setCategory(catData);

        // Fetch Articles for this category
        const artRes = await fetch(`/api/articles?lang=${language}&category=${slug}&limit=20`);
        if (!artRes.ok) {
          const errorData = await artRes.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || `Articles fetch failed: ${artRes.status}`);
        }
        const artData = await artRes.json();
        if (Array.isArray(artData)) {
          setArticles(artData);
        } else {
          console.error('API returned non-array data:', artData);
          setArticles([]);
        }
      } catch (err: any) {
        console.error('Failed to fetch category data', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [slug, language]);

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: language === 'ar' ? ar : enUS
    });
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="h-20 w-1/3 bg-zinc-100 dark:bg-zinc-900 rounded-lg mb-12 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 px-4"
      >
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            {language === 'en' ? 'Database Connection Error' : 'خطأ في الاتصال بقاعدة البيانات'}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            {t('failedToLoadArticles')}
          </p>
          <div className="bg-white dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 text-left overflow-auto">
            <p className="text-xs font-mono text-zinc-500 uppercase mb-2 tracking-widest">Error Details:</p>
            <code className="text-sm text-red-500 break-words">{error}</code>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-2 bg-primary text-white font-bold rounded-full hover:opacity-90 transition-opacity"
          >
            {language === 'en' ? 'Try Again' : 'إعادة المحاولة'}
          </button>
        </div>
      </motion.div>
    );
  }

  if (!category) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Category Not Found</h1>
        <Link to="/" className="text-primary hover:underline">Back to Home</Link>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* Category Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12 border-b-2 border-zinc-100 dark:border-zinc-800 pb-10"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-3 h-10 bg-primary"></div>
          <h1 className="text-5xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">
            {category.name}
          </h1>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-xl font-medium">
          {language === 'en' 
            ? `Latest news and updates from ${category.name}` 
            : `آخر الأخبار والتحديثات من قسم ${category.name}`}
        </p>
      </motion.div>

      {articles.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800"
        >
          <p className="text-zinc-500 dark:text-zinc-400 text-lg font-bold">
            {language === 'en' ? 'No articles found in this category.' : 'لا توجد مقالات في هذا القسم حالياً.'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {articles.map((article, idx) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx % 3 * 0.1 }}
            >
              <Link to={`/article/${article.id}`} className="group flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:shadow-2xl transition-all duration-500 rounded-2xl overflow-hidden h-full">
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={article.image_url || undefined} 
                    alt={article.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4">
                    <span className="bg-primary text-white text-[10px] font-black px-3 py-1.5 uppercase tracking-widest shadow-lg">
                      {category.name}
                    </span>
                  </div>
                </div>
                <div className="p-8 flex-grow min-w-0 flex flex-col">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 leading-tight group-hover:text-primary transition-colors line-clamp-2 break-words">
                    {article.title}
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-400 text-base line-clamp-3 mb-8 flex-grow leading-relaxed break-words">
                    {article.summary}
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-500 font-bold uppercase tracking-widest">
                    <span>{formatDate(article.published_at)}</span>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                      <span>{article.views} views</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
