/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
const Home = React.lazy(() => import('./pages/Home'));
const Article = React.lazy(() => import('./pages/Article'));
const Category = React.lazy(() => import('./pages/Category'));
const Search = React.lazy(() => import('./pages/Search'));
const StaticPage = React.lazy(() => import('./pages/StaticPage'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const ArticleForm = React.lazy(() => import('./pages/ArticleForm'));
const Maintenance = React.lazy(() => import('./pages/Maintenance'));
import { useSettings } from './context/SettingsContext';

import { Helmet } from 'react-helmet-async';

function AppRouter() {
  const { settings, loading } = useSettings();
  const isMaintenance = settings.maintenance_mode === 'true';
  const isAdminPath = window.location.pathname.startsWith('/admin');

  React.useEffect(() => {
    if (settings.primary_color) {
      document.documentElement.style.setProperty('--primary-color', settings.primary_color);
    }
  }, [settings.primary_color]);

  // Handle external scripts (GA, Adsense, GSC)
  React.useEffect(() => {
    // Dynamic Google Publisher Tools Setup
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (gaId && !document.querySelector('#ga-script')) {
      const script1 = document.createElement('script');
      script1.id = 'ga-script';
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
      `;
      document.head.appendChild(script2);
    }

    const adsenseId = import.meta.env.VITE_ADSENSE_CLIENT_ID;
    if (adsenseId && !document.querySelector('#adsense-script')) {
      const script = document.createElement('script');
      script.id = 'adsense-script';
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    const gscId = import.meta.env.VITE_GOOGLE_SEARCH_CONSOLE_ID;
    if (gscId && !document.querySelector('meta[name="google-site-verification"]')) {
      const meta = document.createElement('meta');
      meta.name = 'google-site-verification';
      meta.content = gscId;
      document.head.appendChild(meta);
    }
  }, []);

  if (loading) return null;

  if (isMaintenance && !isAdminPath) {
    return <Maintenance />;
  }

  const siteName = settings.site_name || 'Echo News';
  const siteDesc = settings.seo_description || 'Delivering accurate, unbiased, and timely news from around the globe.';

  return (
    <BrowserRouter>
      <Helmet>
        <title>{siteName}</title>
        <meta name="description" content={siteDesc} />
        {settings.seo_keywords && <meta name="keywords" content={settings.seo_keywords} />}
        <meta property="og:site_name" content={siteName} />
        <meta property="og:type" content="website" />
      </Helmet>
      <React.Suspense fallback={<div className="flex w-full items-center justify-center p-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="article/:id" element={<Article />} />
            <Route path="news/:slug" element={<Article />} />
            <Route path="category/:slug" element={<Category />} />
            <Route path="search" element={<Search />} />
            <Route path="page/:slug" element={<StaticPage />} />
          </Route>

          {/* Admin Routes (Hidden) */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/new" element={<ArticleForm />} />
          <Route path="/admin/edit/:id" element={<ArticleForm />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <SettingsProvider>
          <ToastProvider>
            <AppRouter />
          </ToastProvider>
        </SettingsProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
