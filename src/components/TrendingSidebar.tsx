import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { TrendingUp, Eye } from 'lucide-react';

interface Article {
  id: number;
  title: string;
  image_url: string;
  views: number;
  published_at: string;
}

export default function TrendingSidebar() {
  const { language, t } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(`/api/articles?lang=${language}&limit=5&sort=views`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setArticles(data);
        } else {
          console.error('API returned non-array data:', data);
          setArticles([]);
        }
      } catch (error) {
        console.error('Failed to fetch trending articles', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [language]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-20 h-16 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
          {language === 'en' ? 'Most Read' : 'الأكثر قراءة'}
        </h2>
      </div>

      <div className="space-y-6">
        {articles.map((article, index) => (
          <Link 
            key={article.id} 
            to={`/article/${article.id}`}
            className="group flex gap-4 items-start"
          >
            <div className="relative flex-shrink-0">
              <span className="absolute -top-2 -left-2 w-6 h-6 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full z-10 border-2 border-white dark:border-zinc-950">
                {index + 1}
              </span>
              <div className="w-20 h-16 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-900">
                <img 
                  src={article.image_url || undefined} 
                  alt={article.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className="flex-grow min-w-0">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug group-hover:text-primary dark:group-hover:text-primary transition-colors line-clamp-2 mb-1 break-words">
                {article.title}
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                <Eye className="w-3 h-3" />
                <span>{article.views} {t('article.views')}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
