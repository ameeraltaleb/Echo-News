import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { TrendingUp } from 'lucide-react';

interface Article {
  id: number;
  title: string;
}

export default function BreakingNews() {
  const { language, t } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch(`/api/articles?lang=${language}&limit=5`);
        const data = await res.json();
        setArticles(data);
      } catch (error) {
        console.error('Failed to fetch breaking news', error);
      }
    };

    fetchLatest();
  }, [language]);

  useEffect(() => {
    if (articles.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % articles.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [articles]);

  if (articles.length === 0) return null;

  return (
    <div className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-10">
        <div className="flex-shrink-0 flex items-center gap-2 bg-primary text-white px-3 py-1 text-xs font-bold uppercase tracking-wider mr-4 rtl:mr-0 rtl:ml-4">
          <TrendingUp className="w-3 h-3" />
          {language === 'en' ? 'Breaking' : 'عاجل'}
        </div>
        
        <div className="flex-grow relative h-full overflow-hidden">
          {articles.map((article, index) => (
            <Link
              key={article.id}
              to={`/article/${article.id}`}
              className={`absolute inset-0 flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-primary dark:hover:text-primary transition-all duration-500 transform ${
                index === currentIndex 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              <span className="truncate">{article.title}</span>
            </Link>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-4 rtl:ml-0 rtl:mr-4">
          <span>{currentIndex + 1} / {articles.length}</span>
        </div>
      </div>
    </div>
  );
}
