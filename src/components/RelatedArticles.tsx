import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface Article {
  id: number;
  title: string;
  image_url: string;
  published_at: string;
}

interface RelatedArticlesProps {
  categorySlug: string;
  currentArticleId: number;
}

export default function RelatedArticles({ categorySlug, currentArticleId }: RelatedArticlesProps) {
  const { language } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const res = await fetch(`/api/articles?lang=${language}&category=${categorySlug}&exclude=${currentArticleId}&limit=3`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setArticles(data);
        } else {
          console.error('API returned non-array data:', data);
          setArticles([]);
        }
      } catch (error) {
        console.error('Failed to fetch related articles', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [categorySlug, currentArticleId, language]);

  if (loading) {
    return (
      <div className="mt-16 pt-8 border-t border-zinc-100 dark:border-zinc-800">
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-8 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3 animate-pulse">
              <div className="aspect-video bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (articles.length === 0) return null;

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: language === 'ar' ? ar : enUS
    });
  };

  return (
    <div className="mt-16 pt-12 border-t border-zinc-100 dark:border-zinc-800">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-8 flex items-center gap-3">
        <span className="w-2 h-8 bg-primary"></span>
        {language === 'en' ? 'Related Articles' : 'مقالات ذات صلة'}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {articles.map(article => (
          <Link key={article.id} to={`/article/${article.id}`} className="group flex flex-col">
            <div className="relative aspect-video overflow-hidden rounded-lg mb-4 bg-zinc-100 dark:bg-zinc-900">
              <img 
                src={article.image_url || undefined} 
                alt={article.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight group-hover:text-primary dark:group-hover:text-primary transition-colors line-clamp-2 mb-2 break-words">
              {article.title}
            </h3>
            <div className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
              {formatDate(article.published_at)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
