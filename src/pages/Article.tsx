import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Eye, Clock, User, Share2, MessageSquare, ThumbsUp, ArrowLeft, ArrowRight } from 'lucide-react';
import TrendingSidebar from '../components/TrendingSidebar';
import RelatedArticles from '../components/RelatedArticles';
import ShareButtons from '../components/ShareButtons';
import { ArticleDetailSkeleton } from '../components/Skeleton';

interface ArticleData {
  id: number;
  title: string;
  content: string;
  image_url: string;
  category_id: number;
  category_slug: string;
  published_at: string;
  views: number;
  author: string;
  tags?: string;
}

export default function Article() {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/articles/${id}?lang=${language}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || `Article fetch failed: ${res.status}`);
        }
        const data = await res.json();
        setArticle(data);
      } catch (err: any) {
        console.error('Failed to fetch article', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
    window.scrollTo(0, 0);
  }, [id, language]);

  useEffect(() => {
    if (article) {
      const siteName = import.meta.env.VITE_SITE_NAME || 'Echo News';
      document.title = `${article.title} | ${siteName}`;
      
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', article.title); 

      // OpenGraph
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) { ogTitle = document.createElement('meta'); ogTitle.setAttribute('property', 'og:title'); document.head.appendChild(ogTitle); }
      ogTitle.setAttribute('content', article.title);

      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) { ogImage = document.createElement('meta'); ogImage.setAttribute('property', 'og:image'); document.head.appendChild(ogImage); }
      ogImage.setAttribute('content', article.image_url || '');
      
      let ogUrl = document.querySelector('meta[property="og:url"]');
      if (!ogUrl) { ogUrl = document.createElement('meta'); ogUrl.setAttribute('property', 'og:url'); document.head.appendChild(ogUrl); }
      ogUrl.setAttribute('content', window.location.href);

      // JSON-LD Structured Data for rich Google results
      let jsonLd = document.querySelector('script[type="application/ld+json"]');
      if (!jsonLd) {
        jsonLd = document.createElement('script');
        jsonLd.setAttribute('type', 'application/ld+json');
        document.head.appendChild(jsonLd);
      }
      const siteNameLd = import.meta.env.VITE_SITE_NAME || 'Echo News';
      jsonLd.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": article.title,
        "image": article.image_url ? [article.image_url] : [],
        "datePublished": article.published_at,
        "dateModified": article.published_at,
        "author": {
          "@type": "Person",
          "name": article.author || siteNameLd
        },
        "publisher": {
          "@type": "Organization",
          "name": siteNameLd,
          "url": window.location.origin
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": window.location.href
        },
        "articleSection": article.category_slug,
        "url": window.location.href
      });
    }
  }, [article]);

  if (loading) {
    return <ArticleDetailSkeleton />;
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

  if (!article) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">{t('error.notfound')}</h1>
        <Link to="/" className="text-primary hover:underline flex items-center justify-center gap-2">
          {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t('nav.home')}
        </Link>
      </motion.div>
    );
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP', {
      locale: language === 'ar' ? ar : enUS
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12"
    >
      <article className="lg:col-span-8 bg-white dark:bg-zinc-950 transition-colors duration-300">
        {/* Article Header */}
        <header className="mb-10 border-b border-zinc-200 dark:border-zinc-800 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Link 
              to={`/category/${article.category_slug}`}
              className="inline-block bg-primary text-white text-xs font-black uppercase tracking-widest px-3 py-1 mb-6 hover:bg-black transition-colors"
            >
              {article.category_slug}
            </Link>
            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-zinc-100 mb-8 leading-[1.1] tracking-tight break-words">
              {article.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-8 text-sm text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="text-zinc-900 dark:text-zinc-100">{article.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatDate(article.published_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{article.views} {t('article.views')}</span>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Main Image */}
        <motion.figure 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mb-12 relative group"
        >
          <img 
            src={article.image_url || undefined} 
            alt={article.title} 
            className="w-full h-auto max-h-[650px] object-cover bg-zinc-100 dark:bg-zinc-900 shadow-2xl rounded-sm"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-black/10 pointer-events-none"></div>
          <figcaption className="text-xs text-zinc-400 dark:text-zinc-500 mt-4 italic flex items-center gap-2 justify-center">
            <span className="w-4 h-px bg-zinc-300 dark:bg-zinc-700"></span>
            Image source: Echo News Archive
            <span className="w-4 h-px bg-zinc-300 dark:bg-zinc-700"></span>
          </figcaption>
        </motion.figure>

        {/* Article Content & Sidebar */}
        <div className="flex flex-col md:flex-row gap-12">
          
          {/* Social Actions Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="md:w-16 flex flex-col md:flex-row gap-4 border-b md:border-b-0 md:border-r rtl:md:border-r-0 rtl:md:border-l border-zinc-200 dark:border-zinc-800 pb-6 md:pb-0 md:pr-6 rtl:md:pr-0 rtl:md:pl-6 sticky top-24 h-fit"
          >
            <div className="flex flex-wrap md:flex-col gap-4 w-full justify-center md:justify-start">
              <ShareButtons title={article.title} url={window.location.href} />
              
              <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800 my-2 hidden md:block"></div>
              
              <button className="p-3 bg-zinc-50 dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 rounded-xl text-zinc-400 dark:text-zinc-500 transition-all duration-300 shadow-sm border border-zinc-100 dark:border-zinc-800" title="Like">
                <ThumbsUp className="w-5 h-5" />
              </button>
              <button className="p-3 bg-zinc-50 dark:bg-zinc-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 rounded-xl text-zinc-400 dark:text-zinc-500 transition-all duration-300 shadow-sm border border-zinc-100 dark:border-zinc-800" title="Comment">
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Content Body */}
          <div className="flex-1 min-w-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="prose prose-lg prose-zinc dark:prose-invert max-w-none mb-12 break-words"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Tags */}
            {(() => {
              try {
                const tags = article.tags ? JSON.parse(article.tags) : [];
                if (Array.isArray(tags) && tags.length > 0) {
                  return (
                    <div className="flex flex-wrap gap-2 mb-12">
                      {tags.map((tag: string) => (
                        <span key={tag} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-medium rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  );
                }
              } catch (e) {
                return null;
              }
              return null;
            })()}

            {/* Related Articles Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <RelatedArticles 
                categorySlug={article.category_slug} 
                currentArticleId={article.id} 
              />
            </motion.div>
          </div>
        </div>
      </article>

      {/* Sidebar */}
      <aside className="lg:col-span-4">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="sticky top-24"
        >
          <TrendingSidebar />
        </motion.div>
      </aside>
    </motion.div>
  );
}
