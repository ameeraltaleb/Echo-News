import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, X, ArrowLeft, Image as ImageIcon, Globe, Upload, Loader2 } from 'lucide-react';
import { useToast } from '../components/Toast';
import RichTextEditor from '../components/RichTextEditor';

interface Category {
  id: number;
  name: string;
}

export default function ArticleForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = !!id;
  const token = localStorage.getItem('admin_token');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState({
    category_id: 1,
    title_en: '',
    title_ar: '',
    summary_en: '',
    summary_ar: '',
    content_en: '',
    content_ar: '',
    image_url: '',
    author: '',
    status: 'published',
    published_at: new Date().toISOString().slice(0, 16),
    tags: [] as string[]
  });

  useEffect(() => {
    if (!token) navigate('/admin');

    const fetchData = async () => {
      try {
        // Fetch categories
        const catRes = await fetch('/api/categories?lang=en');
        const catData = await catRes.json();
        setCategories(Array.isArray(catData) ? catData : []);

        if (isEdit) {
          const artRes = await fetch(`/api/articles/${id}?lang=en`);
          const artData = await artRes.json();
          
          // We need all fields, so fetch the raw admin data instead
          const adminArtRes = await fetch('/api/admin/articles', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const adminArts = await adminArtRes.json();
          const currentArt = adminArts.find((a: any) => a.id === parseInt(id));
          
          if (currentArt) {
            // Fetch full content for edit
            const fullArtRes = await fetch(`/api/articles/${id}?lang=en`);
            const fullArtEn = await fullArtRes.json();
            const fullArtArRes = await fetch(`/api/articles/${id}?lang=ar`);
            const fullArtAr = await fullArtArRes.json();

            setFormData({
              category_id: currentArt.category_id,
              title_en: fullArtEn.title,
              title_ar: fullArtAr.title,
              summary_en: fullArtEn.summary || '',
              summary_ar: fullArtAr.summary || '',
              content_en: fullArtEn.content,
              content_ar: fullArtAr.content,
              image_url: currentArt.image_url || '',
              author: currentArt.author || '',
              status: currentArt.status || 'published',
              published_at: currentArt.published_at ? new Date(currentArt.published_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
              tags: currentArt.tags ? (() => {
                try {
                  const parsed = JSON.parse(currentArt.tags);
                  return Array.isArray(parsed) ? parsed : [];
                } catch {
                  return [];
                }
              })() : []
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEdit, navigate, token]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    setUploading(true);
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, image_url: data.url }));
        showToast('Image uploaded successfully');
      } else {
        showToast('Failed to upload image', 'error');
      }
    } catch (err) {
      showToast('Error uploading image', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEdit ? `/api/admin/articles/${id}` : '/api/admin/articles';
      const method = isEdit ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        showToast(isEdit ? 'Article updated successfully' : 'Article created successfully');
        navigate('/admin');
      } else {
        showToast('Failed to save article', 'error');
      }
    } catch (err) {
      showToast('Error saving article', 'error');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-zinc-600" />
            </Link>
            <h1 className="text-3xl font-bold text-zinc-900">
              {isEdit ? 'Edit Article' : 'Create New Article'}
            </h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/admin')}
              className="px-6 py-2.5 rounded-lg font-bold text-zinc-600 hover:bg-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              className="flex items-center gap-2 bg-primary text-white px-8 py-2.5 rounded-lg font-bold hover:opacity-90 transition-colors shadow-lg shadow-primary/10"
            >
              <Save className="w-5 h-5" />
              Save Article
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content Fields */}
          <div className="lg:col-span-3 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* English Content */}
              <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-zinc-400">
                  <Globe className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">English Content</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Title (EN)</label>
                    <input 
                      type="text"
                      value={formData.title_en}
                      onChange={e => setFormData({...formData, title_en: e.target.value})}
                      className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Summary (EN)</label>
                    <textarea 
                      rows={3}
                      value={formData.summary_en}
                      onChange={e => setFormData({...formData, summary_en: e.target.value})}
                      className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Content (EN)</label>
                    <RichTextEditor 
                      value={formData.content_en}
                      onChange={value => setFormData({...formData, content_en: value})}
                      placeholder="Write your article content here..."
                    />
                  </div>
                </div>
              </div>

              {/* Arabic Content */}
              <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm" dir="rtl">
                <div className="flex items-center gap-2 mb-4 text-zinc-400">
                  <Globe className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">المحتوى العربي</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">العنوان (AR)</label>
                    <input 
                      type="text"
                      value={formData.title_ar}
                      onChange={e => setFormData({...formData, title_ar: e.target.value})}
                      className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary outline-none font-arabic"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">الملخص (AR)</label>
                    <textarea 
                      rows={3}
                      value={formData.summary_ar}
                      onChange={e => setFormData({...formData, summary_ar: e.target.value})}
                      className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary outline-none font-arabic resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">المحتوى (AR)</label>
                    <RichTextEditor 
                      value={formData.content_ar}
                      onChange={value => setFormData({...formData, content_ar: value})}
                      placeholder="اكتب محتوى المقال هنا..."
                      isRtl={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
              <h3 className="text-lg font-bold text-zinc-900 mb-4">Article Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Category</label>
                  <select 
                    value={formData.category_id}
                    onChange={e => setFormData({...formData, category_id: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  >
                    {(categories || []).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Author Name</label>
                  <input 
                    type="text"
                    value={formData.author}
                    onChange={e => setFormData({...formData, author: e.target.value})}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Status</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, status: 'published'})}
                      className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                        formData.status === 'published'
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                      }`}
                    >
                      Published
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, status: 'draft'})}
                      className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                        formData.status === 'draft'
                          ? 'bg-zinc-600 text-white shadow-lg shadow-zinc-900/20'
                          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                      }`}
                    >
                      Draft
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Publish Date & Time</label>
                  <input 
                    type="datetime-local"
                    value={formData.published_at}
                    onChange={e => setFormData({...formData, published_at: e.target.value})}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Set a future date to schedule publishing.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input 
                      type="text"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
                            setFormData({...formData, tags: [...formData.tags, tagInput.trim()]});
                            setTagInput('');
                          }
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      placeholder="Add a tag and press Enter"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
                          setFormData({...formData, tags: [...formData.tags, tagInput.trim()]});
                          setTagInput('');
                        }
                      }}
                      className="px-4 py-2 bg-zinc-100 text-zinc-700 font-bold rounded-lg hover:bg-zinc-200"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.tags || []).map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                        {tag}
                        <button
                          type="button"
                          onClick={() => setFormData({...formData, tags: (formData.tags || []).filter(t => t !== tag)})}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
              <h3 className="text-lg font-bold text-zinc-900 mb-4">Media</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Cover Image</label>
                  
                  {/* Upload Area */}
                  <div 
                    className="border-2 border-dashed border-zinc-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-zinc-50 hover:border-primary transition-colors cursor-pointer relative"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    {uploading ? (
                      <div className="flex flex-col items-center text-zinc-500">
                        <Loader2 className="w-8 h-8 mb-2 animate-spin text-primary" />
                        <span className="text-sm font-medium">Uploading image...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-zinc-900 mb-1">Click to upload image</p>
                        <p className="text-xs text-zinc-500">PNG, JPG, WEBP up to 5MB</p>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-4 my-4">
                    <div className="h-px bg-zinc-200 flex-1"></div>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">OR</span>
                    <div className="h-px bg-zinc-200 flex-1"></div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-grow relative">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input 
                        type="url"
                        value={formData.image_url}
                        onChange={e => setFormData({...formData, image_url: e.target.value})}
                        className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                        placeholder="Paste image URL here..."
                      />
                    </div>
                  </div>
                </div>
                {formData.image_url && (
                  <div className="mt-4 rounded-lg overflow-hidden border border-zinc-200 relative group">
                    <img src={formData.image_url} alt="Preview" className="w-full h-auto object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, image_url: ''})}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
