import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Search as SearchIcon, ArrowRight, ArrowLeft } from 'lucide-react';
import { ArticleCardSkeleton } from '../components/Skeleton';
import { Helmet } from 'react-helmet-async';

interface Article {
  id: number;
  title: string;
  summary: string;
  image_url: string;
  category_id: number;
  published_at: string;
  views: number;
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { language, t } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;
  
  const siteName = import.meta.env.VITE_SITE_NAME || 'ECHO NEWS';
  const pageTitle = query 
    ? `${language === 'en' ? 'Search Results for' : 'نتائج البحث عن'} "${query}" | ${siteName}`
    : `${language === 'en' ? 'Search' : 'بحث'} | ${siteName}`;
  const pageDesc = query
    ? language === 'en'
      ? `Find news articles matching "${query}". Stay informed with the latest breaking news and updates.`
      : `ابحث عن المقالات الإخبارية المطابقة لـ "${query}". ابق على اطلاع بأحدث الأخبار العاجلة والتحديثات.`
    : language === 'en'
      ? 'Search for news articles across all categories on ECHO NEWS.'
      : 'ابحث عن المقالات الإخبارية عبر جميع الأقسام في إيكو نيوز.';

  // Generate JSON-LD for search page
  const jsonLd = query ? {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    "name": pageTitle,
    "description": pageDesc,
    "url": window.location.href,
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": siteName,
      "logo": {
        "@type": "ImageObject",
        "url": `${window.location.origin}/logo.png`
      }
    },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": articles.length,
      "itemListElement": articles.map((article, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `${window.location.origin}/article/${article.id}`,
        "name": article.title
      }))
    }
  } : {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": pageTitle,
    "description": pageDesc,
    "url": window.location.href,
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": siteName
    }
  };

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setArticles([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setHasMore(true);
      try {
        const res = await fetch(`/api/articles?lang=${language}&q=${encodeURIComponent(query)}&limit=${limit}&offset=0`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setArticles(data);
          if (data.length < limit) setHasMore(false);
        } else {
          console.error('API returned non-array data:', data);
          setArticles([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error('Failed to fetch search results', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, language]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/articles?lang=${language}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${articles.length}`);
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
      console.error('Failed to load more search results', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: language === 'ar' ? ar : enUS
    });
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="h-12 w-1/4 bg-zinc-100 dark:bg-zinc-900 rounded mb-8 animate-pulse"></div>
        <div className="space-y-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col md:flex-row gap-6 p-4 border border-zinc-100 dark:border-zinc-800 rounded-xl">
              <div className="md:w-64 h-40 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg"></div>
              <div className="flex-grow space-y-4">
                <div className="h-6 w-3/4 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded"></div>
                <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded"></div>
                <div className="h-4 w-2/3 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={window.location.href} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        
        {/* Noindex for search results pages to avoid thin content */}
        {query && <meta name="robots" content="noindex, follow" />}
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-4 tracking-tighter">
          <div className="p-3 bg-primary text-white rounded-2xl shadow-lg">
            <SearchIcon className="w-8 h-8" />
          </div>
          {language === 'en' ? 'Search Results' : 'نتائج البحث'}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-xl font-medium">
          {language === 'en' 
            ? `Showing results for: "${query}"` 
            : `عرض النتائج لـ: "${query}"`}
        </p>
      </motion.div>

      {articles.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800"
        >
          <p className="text-zinc-500 dark:text-zinc-400 text-xl font-bold">
            {language === 'en' 
              ? 'No articles found matching your search.' 
              : 'لم يتم العثور على مقالات تطابق بحثك.'}
          </p>
          <Link to="/" className="inline-flex items-center gap-2 mt-6 text-primary font-black uppercase tracking-widest hover:underline">
            {language === 'ar' ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            {t('nav.home')}
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {articles.map((article, idx) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
            >
              <Link 
                to={`/article/${article.id}`} 
                className="group flex flex-col md:flex-row gap-8 bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 hover:border-primary hover:shadow-2xl transition-all duration-500 rounded-2xl"
              >
                <div className="md:w-72 h-48 flex-shrink-0 overflow-hidden rounded-xl shadow-md">
                  <img 
                    src={article.image_url || undefined} 
                    alt={article.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-grow min-w-0 py-2 flex flex-col">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3 group-hover:text-primary transition-colors leading-tight break-words">
                    {article.title}
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-400 text-base line-clamp-2 mb-6 leading-relaxed break-words">
                    {article.summary}
                  </p>
                  <div className="flex items-center gap-6 text-xs text-zinc-500 dark:text-zinc-500 font-bold uppercase tracking-widest mt-auto">
                    <span className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      {formatDate(article.published_at)}
                    </span>
                    <span className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full"></div>
                      {article.views} {t('article.views')}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
          
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
                  : (language === 'en' ? 'Load More Results' : 'عرض المزيد من النتائج')}
              </button>
            </div>
          )}
        </div>
      )}
      </motion.div>
    </>
  );
}
