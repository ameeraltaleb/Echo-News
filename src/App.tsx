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
import Home from './pages/Home';
import Article from './pages/Article';
import Category from './pages/Category';
import Search from './pages/Search';
import StaticPage from './pages/StaticPage';
import AdminDashboard from './pages/AdminDashboard';
import ArticleForm from './pages/ArticleForm';
import Maintenance from './pages/Maintenance';
import { useSettings } from './context/SettingsContext';

function AppRouter() {
  const { settings, loading } = useSettings();
  const isMaintenance = settings.maintenance_mode === 'true';
  const isAdminPath = window.location.pathname.startsWith('/admin');

  React.useEffect(() => {
    if (settings.primary_color) {
      document.documentElement.style.setProperty('--primary-color', settings.primary_color);
    }
  }, [settings.primary_color]);

  React.useEffect(() => {
    if (settings.site_name) {
      document.title = settings.site_name;
    }
    if (settings.seo_description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', settings.seo_description);
      }
    }
    if (settings.seo_keywords) {
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute('content', settings.seo_keywords);
      }
    }

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
  }, [settings.site_name, settings.seo_description, settings.seo_keywords]);

  if (loading) return null;

  if (isMaintenance && !isAdminPath) {
    return <Maintenance />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="article/:id" element={<Article />} />
          <Route path="category/:slug" element={<Category />} />
          <Route path="search" element={<Search />} />
          <Route path="page/:slug" element={<StaticPage />} />
        </Route>

        {/* Admin Routes (Hidden) */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/new" element={<ArticleForm />} />
        <Route path="/admin/edit/:id" element={<ArticleForm />} />
      </Routes>
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
