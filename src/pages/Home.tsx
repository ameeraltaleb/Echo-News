import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import TrendingSidebar from '../components/TrendingSidebar';
import { HeroSkeleton, ArticleCardSkeleton } from '../components/Skeleton';

interface Article {
  id: number;
  title: string;
  summary: string;
  image_url: string;
  category_id: number;
  published_at: string;
  views: number;
}

export default function Home() {
  const { language, t } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 10;

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/articles?lang=${language}&limit=${limit}&offset=0`);
        const contentType = res.headers.get('content-type');
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || `HTTP error! status: ${res.status}`);
        }

        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setArticles(data);
            if (data.length < limit) setHasMore(false);
          } else {
            console.error('API returned non-array data:', data);
            setArticles([]);
            setHasMore(false);
          }
        } else {
          throw new Error('API returned non-JSON data');
        }
      } catch (err: any) {
        console.error('Failed to fetch articles', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [language]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/articles?lang=${language}&limit=${limit}&offset=${articles.length}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          if (data.length < limit) {
            setHasMore(false);
          }
          setArticles(prev => [...prev, ...data]);
        }
      }
    } catch (err) {
      console.error('Failed to load more articles', err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <HeroSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

  if (articles.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-zinc-500 dark:text-zinc-400"
      >
        No articles found.
      </motion.div>
    );
  }

  const heroArticle = articles[0];
  const secondaryArticles = articles.slice(1, 3);
  const gridArticles = articles.slice(3);

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: language === 'ar' ? ar : enUS
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* Top Section: Hero + Secondary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
        
        {/* Hero Article */}
        <motion.div 
          initial={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-8 group"
        >
          <Link to={`/article/${heroArticle.id}`} className="block relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 h-[450px] lg:h-[600px] rounded-3xl shadow-2xl">
            <img 
              src={heroArticle.image_url || undefined} 
              alt={heroArticle.title} 
              className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
              referrerPolicy="no-referrer"
              loading="eager"
              decoding="sync"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
              <div className="inline-block bg-primary text-white text-xs font-bold uppercase tracking-widest px-3 py-1 mb-4 rounded-full">
                {language === 'en' ? 'Featured' : 'مميز'}
              </div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-3xl lg:text-6xl font-bold text-white mb-4 leading-[1.1] tracking-tight group-hover:underline decoration-4 underline-offset-8 break-words"
              >
                {heroArticle.title}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-zinc-100 text-lg lg:text-xl line-clamp-2 mb-6 max-w-3xl font-medium opacity-90 break-words"
              >
                {heroArticle.summary}
              </motion.p>
              <div className="flex items-center text-sm text-zinc-300 font-medium uppercase tracking-wider">
                <span>{formatDate(heroArticle.published_at)}</span>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Secondary Articles */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {secondaryArticles.map((article, idx) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, x: language === 'ar' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + (idx * 0.1) }}
              className="h-full"
            >
              <Link to={`/article/${article.id}`} className="group flex flex-col h-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={article.image_url || undefined} 
                    alt={article.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-6 flex-grow min-w-0 flex flex-col justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2 leading-snug group-hover:text-primary transition-colors break-words">
                      {article.title}
                    </h2>
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500 font-bold uppercase tracking-wider mt-2">
                    {formatDate(article.published_at)}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Grid Section with Sidebar */}
      {gridArticles.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-4 mb-10">
              <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">
                {language === 'en' ? 'Latest Stories' : 'أحدث القصص'}
              </h2>
              <div className="flex-grow h-px bg-zinc-200 dark:bg-zinc-800"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {gridArticles.map((article, idx) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx % 2 * 0.1 }}
                >
                  <Link to={`/article/${article.id}`} className="group flex flex-col h-full">
                    <div className="relative h-64 overflow-hidden mb-5 rounded-2xl shadow-sm">
                      <img 
                        src={article.image_url || undefined} 
                        alt={article.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3 leading-snug group-hover:text-primary transition-colors break-words">
                      {article.title}
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm line-clamp-3 mb-4 leading-relaxed break-words">
                      {article.summary}
                    </p>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500 font-bold uppercase tracking-widest mt-auto flex items-center gap-2">
                      {formatDate(article.published_at)}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold rounded-full transition-colors disabled:opacity-50"
                >
                  {loadingMore 
                    ? (language === 'en' ? 'Loading...' : 'جاري التحميل...') 
                    : (language === 'en' ? 'Load More Articles' : 'عرض المزيد من المقالات')}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, x: language === 'ar' ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <TrendingSidebar />
            </motion.div>
          </aside>
        </div>
      )}
    </motion.div>
  );
}
