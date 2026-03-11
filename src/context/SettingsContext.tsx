import React, { createContext, useContext, useState, useEffect } from 'react';

interface SiteSettings {
  site_name: string;
  seo_description: string;
  seo_keywords: string;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  youtube_url: string;
  contact_email: string;
  contact_phone: string;
  footer_text: string;
  primary_color: string;
  maintenance_mode: string;
}

interface SettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: SiteSettings = {
  site_name: 'ECHO NEWS',
  seo_description: 'Delivering accurate, unbiased, and timely news from around the globe.',
  seo_keywords: 'news, breaking news, global news',
  facebook_url: 'https://facebook.com',
  twitter_url: 'https://twitter.com',
  instagram_url: 'https://instagram.com',
  youtube_url: 'https://youtube.com',
  contact_email: 'info@echonews.com',
  contact_phone: '+1 (555) 123-4567',
  footer_text: '© 2026 ECHO NEWS. All rights reserved.',
  primary_color: '#B80000',
  maintenance_mode: 'false',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.status === 503) {
        setSettings(prev => ({ ...prev, maintenance_mode: 'true' }));
        return;
      }
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setSettings(data);
        } else {
          console.error('API returned non-JSON data for settings');
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
