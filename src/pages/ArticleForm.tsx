import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, X, ArrowLeft, Image as ImageIcon, Globe, Upload, Loader2, Sparkles, MessageSquare, Search } from 'lucide-react';
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
  
  // AI State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  // Unsplash State
  const [showUnsplashModal, setShowUnsplashModal] = useState(false);
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashImages, setUnsplashImages] = useState<any[]>([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const [unsplashPage, setUnsplashPage] = useState(1);
  const [unsplashTotalPages, setUnsplashTotalPages] = useState(0);
  const [selectingImage, setSelectingImage] = useState<string | null>(null);
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

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      showToast('Please enter a prompt for the AI', 'error');
      return;
    }
    
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: aiPrompt })
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          title_en: data.title_en || prev.title_en,
          title_ar: data.title_ar || prev.title_ar,
          summary_en: data.summary_en || prev.summary_en,
          summary_ar: data.summary_ar || prev.summary_ar,
          content_en: data.content_en || prev.content_en,
          content_ar: data.content_ar || prev.content_ar,
          tags: Array.isArray(data.tags) ? [...new Set([...prev.tags, ...data.tags])] : prev.tags
        }));
        setEditorKey(prev => prev + 1);
        showToast('Article generated successfully!', 'success');
        setShowAiModal(false);
        setAiPrompt('');
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to generate article', 'error');
      }
    } catch (err) {
      showToast('Connection error while reaching AI', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUnsplashSearch = async (page = 1) => {
    if (!unsplashQuery.trim()) return;
    setUnsplashLoading(true);
    try {
      const res = await fetch(`/api/admin/unsplash?q=${encodeURIComponent(unsplashQuery)}&page=${page}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnsplashImages(data.images);
        setUnsplashPage(page);
        setUnsplashTotalPages(data.total_pages);
      } else {
        showToast('Failed to search images', 'error');
      }
    } catch {
      showToast('Error searching Unsplash', 'error');
    } finally {
      setUnsplashLoading(false);
    }
  };

  const handleSelectUnsplashImage = async (img: any) => {
    setSelectingImage(img.id);
    try {
      const imgRes = await fetch(img.url_regular);
      const blob = await imgRes.blob();
      
      const fd = new FormData();
      fd.append('image', blob, `unsplash-${img.id}.jpg`);
      
      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });

      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        setFormData(prev => ({ ...prev, image_url: url }));
        showToast('Image added successfully!', 'success');
        setShowUnsplashModal(false);
      } else {
        showToast('Failed to upload image', 'error');
      }
    } catch {
      showToast('Error uploading image', 'error');
    } finally {
      setSelectingImage(null);
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

  if (loading) return <div className="p-8 text-center flex items-center justify-center min-h-screen text-zinc-500"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-zinc-50/50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-3 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-600 rounded-xl transition-all shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">
                {isEdit ? 'Edit Article' : 'New Article'}
              </h1>
              <p className="text-zinc-500 text-sm mt-1 font-medium">Craft your story and publish it to the world.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/admin')}
              className="px-6 py-2.5 rounded-xl font-bold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 transition-all shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-0.5"
            >
              <Sparkles className="w-5 h-5" />
              AI Assistant
            </button>
            <button 
              onClick={handleSubmit}
              className="flex items-center gap-2 bg-zinc-900 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-black transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
            >
              <Save className="w-5 h-5" />
              {isEdit ? 'Update' : 'Publish'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Fields */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* English Content */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 p-0 h-full bg-blue-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Globe className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 tracking-tight">English Version</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1.5">Article Title</label>
                  <input 
                    type="text"
                    value={formData.title_en}
                    onChange={e => setFormData({...formData, title_en: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-medium text-zinc-900 placeholder:text-zinc-400"
                    placeholder="Enter an engaging title..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1.5">Short Summary</label>
                  <textarea 
                    rows={2}
                    value={formData.summary_en}
                    onChange={e => setFormData({...formData, summary_en: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none font-medium text-zinc-900 placeholder:text-zinc-400"
                    placeholder="A brief overview of the article..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1.5">Full Content</label>
                  <div key={`editor-en-${editorKey}`} className="border border-zinc-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                    <RichTextEditor 
                      value={formData.content_en}
                      onChange={value => setFormData({...formData, content_en: value})}
                      placeholder="Write your article content here..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Arabic Content */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden group" dir="rtl">
              <div className="absolute top-0 right-0 w-1 p-0 h-full bg-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Globe className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 tracking-tight font-arabic">النسخة العربية</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1.5 font-arabic">عنوان المقال</label>
                  <input 
                    type="text"
                    value={formData.title_ar}
                    onChange={e => setFormData({...formData, title_ar: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-medium text-zinc-900 placeholder:text-zinc-400 font-arabic text-right"
                    placeholder="أدخل عنواناً جذاباً..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1.5 font-arabic">ملخص قصير</label>
                  <textarea 
                    rows={2}
                    value={formData.summary_ar}
                    onChange={e => setFormData({...formData, summary_ar: e.target.value})}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none font-medium text-zinc-900 placeholder:text-zinc-400 font-arabic text-right"
                    placeholder="نبذة مختصرة عن محتوى المقال..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1.5 font-arabic">المحتوى الكامل</label>
                  <div key={`editor-ar-${editorKey}`} className="border border-zinc-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
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
          <div className="lg:col-span-4">
            <div className="sticky top-8 space-y-6">
              
              {/* Settings Card */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <h3 className="text-lg font-black text-zinc-900 mb-5 tracking-tight">Organization</h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1.5">Category</label>
                    <select 
                      value={formData.category_id}
                      onChange={e => setFormData({...formData, category_id: parseInt(e.target.value)})}
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium cursor-pointer"
                    >
                      {(categories || []).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1.5">Author</label>
                    <input 
                      type="text"
                      value={formData.author}
                      onChange={e => setFormData({...formData, author: e.target.value})}
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium"
                      placeholder="e.g. John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-2">Publish Status</label>
                    <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, status: 'published'})}
                        className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                          formData.status === 'published'
                            ? 'bg-white text-emerald-600 shadow-sm border border-zinc-200/50'
                            : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                      >
                        Published
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, status: 'draft'})}
                        className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                          formData.status === 'draft'
                            ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50'
                            : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                      >
                        Draft
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1.5">Publish Date</label>
                    <input 
                      type="datetime-local"
                      value={formData.published_at}
                      onChange={e => setFormData({...formData, published_at: e.target.value})}
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1.5">Tags</label>
                    <div className="flex gap-2 mb-3">
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
                        className="flex-1 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                        placeholder="Add tag..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
                            setFormData({...formData, tags: [...formData.tags, tagInput.trim()]});
                            setTagInput('');
                          }
                        }}
                        className="px-4 py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors shadow-sm"
                      >
                        Add
                      </button>
                    </div>
                    {formData.tags && formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                        {formData.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-zinc-200 text-zinc-700 text-xs font-bold rounded-lg shadow-sm">
                            {tag}
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, tags: (formData.tags || []).filter(t => t !== tag)})}
                              className="text-zinc-400 hover:text-red-500 transition-colors bg-zinc-50 hover:bg-red-50 p-0.5 rounded-md"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Media Card */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <h3 className="text-lg font-black text-zinc-900 mb-5 tracking-tight">Media</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-3">Featured Image</label>
                    
                    {/* Upload Area */}
                    <div 
                      className="border-2 border-dashed border-zinc-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-zinc-50 hover:border-zinc-400 transition-all cursor-pointer group"
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
                        <div className="flex flex-col items-center text-zinc-500 py-4">
                          <Loader2 className="w-8 h-8 mb-3 animate-spin text-zinc-400" />
                          <span className="text-sm font-bold">Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-zinc-100 text-zinc-500 group-hover:bg-white group-hover:text-zinc-800 rounded-full flex items-center justify-center mb-3 transition-colors shadow-sm border border-zinc-200/50">
                            <Upload className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-bold text-zinc-900 mb-1">Upload Image</p>
                          <p className="text-xs text-zinc-500 font-medium">PNG, JPG, WEBP up to 5MB</p>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-4 my-5 opacity-60">
                      <div className="h-px bg-zinc-300 flex-1"></div>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">OR PASTE URL</span>
                      <div className="h-px bg-zinc-300 flex-1"></div>
                    </div>

                    <div className="relative">
                      <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input 
                        type="url"
                        value={formData.image_url}
                        onChange={e => setFormData({...formData, image_url: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm font-medium"
                        placeholder="https://..."
                      />
                    </div>

                    <div className="flex items-center gap-4 my-5 opacity-60">
                      <div className="h-px bg-zinc-300 flex-1"></div>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">OR SEARCH</span>
                      <div className="h-px bg-zinc-300 flex-1"></div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowUnsplashModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-sky-500/25 transition-all hover:-translate-y-0.5 text-sm"
                    >
                      <Search className="w-4 h-4" />
                      Search Unsplash Photos
                    </button>
                  </div>
                  {formData.image_url && (
                    <div className="mt-5 rounded-xl overflow-hidden border border-zinc-200 relative group shadow-sm">
                      <img src={formData.image_url} alt="Preview" className="w-full h-auto object-cover max-h-48" />
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, image_url: ''})}
                        className="absolute top-2 right-2 bg-white/90 backdrop-blur text-zinc-800 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600 shadow-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </form>
      </div>

      {/* AI Assistant Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 md:p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              
              <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-zinc-900 tracking-tight">AI Assistant</h2>
                    <p className="text-zinc-500 text-sm font-medium">Auto-generate a complete dual-language article</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAiModal(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-700 bg-white/50 hover:bg-white rounded-full transition-colors"
                  disabled={isGenerating}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-5">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  What should this article be about?
                </label>
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Write a breaking news report about Apple releasing a new VR headset... (Be as specific as you want)"
                  rows={4}
                  className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none resize-none font-medium text-zinc-900 placeholder:text-zinc-400"
                  disabled={isGenerating}
                />
                <p className="text-xs text-zinc-500 font-medium mt-2 flex items-center justify-between">
                  <span>Generates titles, summary, content (EN & AR), and tags.</span>
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowAiModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAiGenerate}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="flex-[2] py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Magic...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Article
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unsplash Search Modal */}
      {showUnsplashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-sky-500/10 to-blue-500/5 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-zinc-900 tracking-tight">Search Photos</h2>
                    <p className="text-zinc-500 text-sm font-medium">Free high-quality images from Unsplash</p>
                  </div>
                </div>
                <button onClick={() => setShowUnsplashModal(false)} className="p-2 text-zinc-400 hover:text-zinc-700 bg-white/50 hover:bg-white rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="px-6 pt-5 pb-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={unsplashQuery}
                    onChange={e => setUnsplashQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleUnsplashSearch(1); }}
                    placeholder="Search for images... (e.g. technology, nature, city)"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all outline-none font-medium text-zinc-900 placeholder:text-zinc-400"
                  />
                </div>
                <button
                  onClick={() => handleUnsplashSearch(1)}
                  disabled={unsplashLoading || !unsplashQuery.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {unsplashLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                </button>
              </div>
            </div>

            {/* Image Grid */}
            <div className="flex-1 overflow-y-auto p-6 pt-3">
              {unsplashImages.length === 0 && !unsplashLoading && (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                  <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-bold text-sm">Search for beautiful images</p>
                  <p className="text-xs">Results will appear here</p>
                </div>
              )}

              {unsplashLoading && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                </div>
              )}

              {!unsplashLoading && unsplashImages.length > 0 && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {unsplashImages.map((img: any) => (
                      <div
                        key={img.id}
                        className="relative group rounded-xl overflow-hidden border border-zinc-200 cursor-pointer hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/10 transition-all"
                        onClick={() => !selectingImage && handleSelectUnsplashImage(img)}
                      >
                        <img src={img.url_small} alt={img.alt} className="w-full h-32 object-cover" />
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <span className="text-white text-[10px] font-bold truncate w-full">📸 {img.author}</span>
                        </div>

                        {/* Loading overlay for selected image */}
                        {selectingImage === img.id && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {unsplashTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t border-zinc-100">
                      <button
                        onClick={() => handleUnsplashSearch(unsplashPage - 1)}
                        disabled={unsplashPage <= 1 || unsplashLoading}
                        className="px-4 py-2 text-sm font-bold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Previous
                      </button>
                      <span className="text-sm text-zinc-500 font-medium">Page {unsplashPage} of {unsplashTotalPages}</span>
                      <button
                        onClick={() => handleUnsplashSearch(unsplashPage + 1)}
                        disabled={unsplashPage >= unsplashTotalPages || unsplashLoading}
                        className="px-4 py-2 text-sm font-bold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
