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
