import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { Globe, Search, Menu, X, Sun, Moon, Twitter, Facebook, Instagram, Youtube } from 'lucide-react';
import BreakingNews from './BreakingNews';

export default function Layout() {
  const { language, setLanguage, t, dir } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const siteNameParts = settings.site_name.split(' ');
  const logoMain = siteNameParts[0] || 'ECHO';
  const logoSub = siteNameParts.slice(1).join(' ') || 'NEWS';

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/category/world', label: t('nav.world') },
    { path: '/category/business', label: t('nav.business') },
    { path: '/category/technology', label: t('nav.tech') },
    { path: '/category/science', label: t('nav.science') },
    { path: '/category/health', label: t('nav.health') },
    { path: '/category/sports', label: t('nav.sports') },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300">
      {/* Top Bar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex items-center min-w-0 mr-2 rtl:mr-0 rtl:ml-2 w-[180px] md:w-[310px] flex-shrink">
              <Link to="/" className="flex items-center gap-1.5 md:gap-2 min-w-0">
                <div className="bg-primary text-white font-bold text-lg md:text-xl px-1.5 md:px-2 py-0.5 md:py-1 tracking-wider flex-shrink-0">
                  {logoMain}
                </div>
                <span className="font-bold text-lg md:text-xl tracking-tight dark:text-white truncate">{logoSub}</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-4 lg:space-x-6 rtl:space-x-reverse flex-shrink-0">
              {navLinks.map((link) => (
                <NavLink 
                  key={link.path}
                  to={link.path} 
                  className={({ isActive }) => `
                    relative px-1 py-2 text-xs lg:text-sm font-bold uppercase tracking-wider transition-colors
                    ${isActive ? 'text-primary' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      {link.label}
                      {isActive && (
                        <motion.div 
                          layoutId="nav-underline"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </button>
              
              <button 
                onClick={toggleTheme}
                className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              <button 
                onClick={toggleLanguage}
                className="flex items-center gap-1 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{language === 'en' ? 'عربي' : 'EN'}</span>
                <span className="sm:hidden">{language === 'en' ? 'AR' : 'EN'}</span>
              </button>
              
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Search Overlay */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-16 left-0 w-full bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-2xl z-40"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-400" />
                  <input 
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'en' ? 'Search for news...' : 'ابحث عن الأخبار...'}
                    className="w-full pl-12 pr-4 py-3 sm:pl-14 sm:py-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-lg sm:text-xl dark:text-white font-medium"
                  />
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-4 text-base font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-primary rounded-xl transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <BreakingNews />

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 text-zinc-400 py-12 border-t-4 border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary text-white font-bold text-xl px-2 py-1 tracking-wider">
                  {logoMain}
                </div>
                <span className="font-bold text-xl text-white tracking-tight">{logoSub}</span>
              </div>
              <p className="text-sm max-w-md mb-6 break-words">
                {settings.seo_description}
              </p>
              {(settings.contact_email || settings.contact_phone) && (
                <div className="mb-6 space-y-2 text-sm">
                  {settings.contact_email && (
                    <p className="flex items-center gap-2">
                      <span className="font-bold">{language === 'en' ? 'Email:' : 'البريد الإلكتروني:'}</span>
                      <a href={`mailto:${settings.contact_email}`} className="hover:text-white transition-colors">
                        {settings.contact_email}
                      </a>
                    </p>
                  )}
                  {settings.contact_phone && (
                    <p className="flex items-center gap-2">
                      <span className="font-bold">{language === 'en' ? 'Phone:' : 'الهاتف:'}</span>
                      <a href={`tel:${settings.contact_phone}`} className="hover:text-white transition-colors">
                        {settings.contact_phone}
                      </a>
                    </p>
                  )}
                </div>
              )}
              <div className="flex items-center gap-4">
                {settings.twitter_url && (
                  <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors" aria-label="Twitter">
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {settings.facebook_url && (
                  <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors" aria-label="Facebook">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {settings.instagram_url && (
                  <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors" aria-label="Instagram">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {settings.youtube_url && (
                  <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors" aria-label="YouTube">
                    <Youtube className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">{language === 'en' ? 'Sections' : 'الأقسام'}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/category/world" className="hover:text-white transition-colors">{t('nav.world')}</Link></li>
                <li><Link to="/category/business" className="hover:text-white transition-colors">{t('nav.business')}</Link></li>
                <li><Link to="/category/technology" className="hover:text-white transition-colors">{t('nav.tech')}</Link></li>
                <li><Link to="/category/science" className="hover:text-white transition-colors">{t('nav.science')}</Link></li>
                <li><Link to="/category/health" className="hover:text-white transition-colors">{t('nav.health')}</Link></li>
                <li><Link to="/category/sports" className="hover:text-white transition-colors">{t('nav.sports')}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">{language === 'en' ? 'Information' : 'معلومات'}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/page/about" className="hover:text-white transition-colors">{language === 'en' ? 'About Us' : 'من نحن'}</Link></li>
                <li><Link to="/page/newsletters" className="hover:text-white transition-colors">{language === 'en' ? 'Newsletters' : 'النشرات البريدية'}</Link></li>
                <li><Link to="/page/accessibility" className="hover:text-white transition-colors">{language === 'en' ? 'Accessibility' : 'إمكانية الوصول'}</Link></li>
                <li><Link to="/page/sitemap" className="hover:text-white transition-colors">{language === 'en' ? 'Sitemap' : 'خريطة الموقع'}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">{language === 'en' ? 'Legal' : 'قانوني'}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/page/terms" className="hover:text-white transition-colors">{language === 'en' ? 'Terms & Conditions' : 'الأحكام والشروط'}</Link></li>
                <li><Link to="/page/privacy" className="hover:text-white transition-colors">{language === 'en' ? 'Privacy Policy' : 'سياسة الخصوصية'}</Link></li>
                <li><Link to="/page/cookies" className="hover:text-white transition-colors">{language === 'en' ? 'Cookie Policy' : 'سياسة ملفات الارتباط'}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-zinc-800 text-sm text-center">
            {settings.footer_text || t('footer.copyright')}
          </div>
        </div>
      </footer>
    </div>
  );
}
