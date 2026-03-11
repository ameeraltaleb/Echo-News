import React, { useState, useEffect } from 'react';
import { Save, Globe, Share2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useSettings } from '../context/SettingsContext';

interface SettingRow {
  key: string;
  value: string;
}

export default function AdminSettings({ token }: { token: string }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const { refreshSettings } = useSettings();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data: SettingRow[] = await res.json();
        const settingsObj = data.reduce((acc, row) => {
          acc[row.key] = row.value;
          return acc;
        }, {} as Record<string, string>);
        setSettings(settingsObj);
      }
    } catch (error) {
      showToast('Failed to fetch settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        showToast('Settings updated successfully');
        await refreshSettings();
      } else {
        showToast('Failed to update settings', 'error');
      }
    } catch (error) {
      showToast('Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <form onSubmit={handleSave} className="space-y-8">
        {/* General Settings */}
        <section className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-3">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-zinc-900">General Information</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-wider">Site Name</label>
                <input 
                  type="text"
                  value={settings.site_name || ''}
                  onChange={(e) => handleChange('site_name', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="e.g. ECHO NEWS"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-wider">SEO Description</label>
                <textarea 
                  value={settings.seo_description || ''}
                  onChange={(e) => handleChange('seo_description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                  placeholder="Brief description for search engines..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-wider">SEO Keywords</label>
                <input 
                  type="text"
                  value={settings.seo_keywords || ''}
                  onChange={(e) => handleChange('seo_keywords', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="news, breaking news, global news"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-wider">Contact Email</label>
                <input 
                  type="email"
                  value={settings.contact_email || ''}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="info@echonews.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-wider">Contact Phone</label>
                <input 
                  type="text"
                  value={settings.contact_phone || ''}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-wider">Footer Copyright Text</label>
                <input 
                  type="text"
                  value={settings.footer_text || ''}
                  onChange={(e) => handleChange('footer_text', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="© 2026 ECHO NEWS. All rights reserved."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-wider">Primary Theme Color</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="color"
                    value={settings.primary_color || '#B80000'}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    className="h-12 w-12 rounded cursor-pointer border-0 p-0"
                  />
                  <input 
                    type="text"
                    value={settings.primary_color || '#B80000'}
                    onChange={(e) => handleChange('primary_color', e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-primary outline-none transition-all font-mono"
                    placeholder="#B80000"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Media */}
        <section className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-3">
            <Share2 className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-zinc-900">Social Media Links</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-wider">Facebook URL</label>
                <input 
                  type="url"
                  value={settings.facebook_url || ''}
                  onChange={(e) => handleChange('facebook_url', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-wider">Twitter URL</label>
                <input 
                  type="url"
                  value={settings.twitter_url || ''}
                  onChange={(e) => handleChange('twitter_url', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-wider">Instagram URL</label>
                <input 
                  type="url"
                  value={settings.instagram_url || ''}
                  onChange={(e) => handleChange('instagram_url', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2 uppercase tracking-wider">YouTube URL</label>
                <input 
                  type="url"
                  value={settings.youtube_url || ''}
                  onChange={(e) => handleChange('youtube_url', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </section>

        {/* System Settings */}
        <section className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-zinc-900">System Control</h2>
          </div>
          <div className="p-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              settings.maintenance_mode === 'true' 
                ? 'bg-amber-50 border-amber-200' 
                : 'bg-zinc-50 border-zinc-100'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${
                  settings.maintenance_mode === 'true' ? 'bg-amber-100 text-amber-600' : 'bg-zinc-200 text-zinc-500'
                }`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900">Maintenance Mode</h3>
                  <p className="text-sm text-zinc-500">When enabled, public users will see a maintenance page.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => handleChange('maintenance_mode', settings.maintenance_mode === 'true' ? 'false' : 'true')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  settings.maintenance_mode === 'true' ? 'bg-amber-500' : 'bg-zinc-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.maintenance_mode === 'true' ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button 
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving Changes...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
