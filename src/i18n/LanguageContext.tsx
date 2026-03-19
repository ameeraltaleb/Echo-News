import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  dir: 'ltr' | 'rtl';
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.world': 'World',
    'nav.business': 'Business',
    'nav.tech': 'Tech',
    'nav.science': 'Science',
    'nav.health': 'Health',
    'nav.sports': 'Sports',
    'article.published': 'Published',
    'article.by': 'By',
    'article.views': 'views',
    'article.readMore': 'Read more',
    'footer.copyright': '© 2026 Echo News. All rights reserved.',
    'error.loading': 'Loading...',
    'error.notfound': 'Article not found',
  },
  ar: {
    'nav.home': 'الرئيسية',
    'nav.world': 'العالم',
    'nav.business': 'أعمال',
    'nav.tech': 'تكنولوجيا',
    'nav.science': 'علوم',
    'nav.health': 'صحة',
    'nav.sports': 'رياضة',
    'article.published': 'نُشر في',
    'article.by': 'بقلم',
    'article.views': 'مشاهدة',
    'article.readMore': 'اقرأ المزيد',
    'footer.copyright': '© 2026 إيكو نيوز. جميع الحقوق محفوظة.',
    'error.loading': 'جاري التحميل...',
    'error.notfound': 'المقال غير موجود',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar'); // Default to Arabic as requested

  useEffect(() => {
    const savedLang = localStorage.getItem('echo_lang') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('echo_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, dir, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
