import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit, Trash2, LogOut, LayoutDashboard, FileText, Settings, Search, ArrowUpDown, ArrowUp, ArrowDown, Eye, TrendingUp, BarChart3, Menu, X } from 'lucide-react';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import AdminSettings from '../components/AdminSettings';

interface Article {
  id: number;
  title_en: string;
  title_ar: string;
  category_id: number;
  published_at: string;
  views: number;
  author: string;
  status: 'published' | 'draft';
}

export default function AdminDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [activeTab, setActiveTab] = useState<'dashboard' | 'articles' | 'settings'>('dashboard');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'published_at' | 'views'>('published_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Modal states
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; articleId: number | null }>({
    isOpen: false,
    articleId: null
  });
  const [logoutModal, setLogoutModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchArticles = async (authToken: string) => {
    try {
      const res = await fetch('/api/admin/articles', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchArticles(token);
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        const { token: newToken } = await res.json();
        localStorage.setItem('admin_token', newToken);
        setToken(newToken);
        showToast('Welcome back, Editor!');
      } else {
        setError('Invalid password');
        showToast('Invalid password', 'error');
      }
    } catch (err) {
      setError('Login failed');
      showToast('Login failed', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    showToast('Logged out successfully', 'info');
    navigate('/admin');
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setArticles(articles.filter(a => a.id !== id));
        showToast('Article deleted successfully');
      } else {
        showToast('Failed to delete article', 'error');
      }
    } catch (err) {
      showToast('Error deleting article', 'error');
    }
  };

  const handleSort = (field: 'published_at' | 'views') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedArticles = articles
    .filter(article => 
      article.title_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.title_ar.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'published_at') {
        comparison = new Date(a.published_at).getTime() - new Date(b.published_at).getTime();
      } else if (sortField === 'views') {
        comparison = a.views - b.views;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const stats = {
    totalArticles: articles.length,
    totalViews: articles.reduce((sum, a) => sum + a.views, 0),
    avgViews: articles.length > 0 ? Math.round(articles.reduce((sum, a) => sum + a.views, 0) / articles.length) : 0,
    topViews: articles.length > 0 ? Math.max(...articles.map(a => a.views)) : 0
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="bg-primary text-white font-bold text-xl px-2 py-1 tracking-wider">ECHO</div>
              <span className="font-bold text-xl tracking-tight">ADMIN</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900">Editor Login</h2>
            <p className="text-zinc-500 text-sm mt-2">Enter your password to access the dashboard</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            <button 
              type="submit"
              className="w-full bg-zinc-900 text-white font-bold py-3 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-zinc-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-white font-bold text-lg px-2 py-1 tracking-wider">ECHO</div>
          <span className="font-bold text-lg tracking-tight">ADMIN</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-zinc-800 rounded-lg">
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-zinc-900 text-white flex flex-col transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        rtl:${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-zinc-800 hidden md:block">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-white font-bold text-lg px-2 py-1 tracking-wider">ECHO</div>
            <span className="font-bold text-lg tracking-tight">ADMIN</span>
          </div>
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-all ${
              activeTab === 'dashboard' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>
          <Link 
            to="/admin/new" 
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Article</span>
          </Link>
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Management</div>
          <button 
            onClick={() => { setActiveTab('articles'); setIsSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-all ${
              activeTab === 'articles' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Articles</span>
          </button>
          <button 
            onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-all ${
              activeTab === 'settings' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={() => setLogoutModal(true)}
            className="flex items-center gap-3 px-4 py-3 w-full text-zinc-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8">
        {activeTab === 'dashboard' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-zinc-900">Dashboard Overview</h1>
              <p className="text-zinc-500 mt-1">Quick summary of your news platform performance</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Articles</span>
                </div>
                <div className="text-3xl font-bold text-zinc-900">{stats.totalArticles}</div>
                <div className="text-sm text-zinc-500 mt-1">Published content</div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Eye className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Views</span>
                </div>
                <div className="text-3xl font-bold text-zinc-900">{stats.totalViews.toLocaleString()}</div>
                <div className="text-sm text-zinc-500 mt-1">Across all articles</div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Avg. Views</span>
                </div>
                <div className="text-3xl font-bold text-zinc-900">{stats.avgViews.toLocaleString()}</div>
                <div className="text-sm text-zinc-500 mt-1">Per article average</div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Top Performance</span>
                </div>
                <div className="text-3xl font-bold text-zinc-900">{stats.topViews.toLocaleString()}</div>
                <div className="text-sm text-zinc-500 mt-1">Highest single views</div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm text-center">
              <div className="max-w-md mx-auto">
                <div className="p-4 bg-zinc-50 rounded-full inline-block mb-4">
                  <LayoutDashboard className="w-12 h-12 text-zinc-400" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 mb-2">Welcome to your Dashboard</h2>
                <p className="text-zinc-500">Use the sidebar to manage your articles, create new content, or adjust site-wide settings.</p>
              </div>
            </div>
          </>
        )}

        {activeTab === 'articles' && (
          <>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900">Articles</h1>
                <p className="text-zinc-500 mt-1">Manage and publish your news content</p>
              </div>
              <Link 
                to="/admin/new"
                className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-colors shadow-lg shadow-primary/10"
              >
                <Plus className="w-5 h-5" />
                Create New Article
              </Link>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input 
                  type="text"
                  placeholder="Search articles by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Article</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Author</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                      <th 
                        className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider cursor-pointer hover:bg-zinc-100 transition-colors"
                        onClick={() => handleSort('published_at')}
                      >
                        <div className="flex items-center gap-1">
                          Date
                          {sortField === 'published_at' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider cursor-pointer hover:bg-zinc-100 transition-colors"
                        onClick={() => handleSort('views')}
                      >
                        <div className="flex items-center gap-1">
                          Views
                          {sortField === 'views' ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {filteredAndSortedArticles.map((article) => (
                      <tr key={article.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-zinc-900 line-clamp-1">{article.title_en}</div>
                          <div className="text-sm text-zinc-500 font-medium mt-0.5" dir="rtl">{article.title_ar}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600 font-medium">{article.author}</td>
                        <td className="px-6 py-4">
                          {(() => {
                            const isScheduled = new Date(article.published_at) > new Date();
                            const statusText = article.status === 'draft' ? 'Draft' : (isScheduled ? 'Scheduled' : 'Published');
                            const statusColor = article.status === 'draft' 
                              ? 'bg-zinc-100 text-zinc-600' 
                              : (isScheduled ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700');
                            
                            return (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColor}`}>
                                {statusText}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-500">
                          {new Date(article.published_at).toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-500">{article.views}</td>
                        <td className="px-6 py-4 text-right space-x-2 rtl:space-x-reverse">
                          <Link 
                            to={`/admin/edit/${article.id}`}
                            className="inline-flex p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit className="w-5 h-5" />
                          </Link>
                          <button 
                            onClick={() => setDeleteModal({ isOpen: true, articleId: article.id })}
                            className="inline-flex p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-zinc-900">Site Settings</h1>
              <p className="text-zinc-500 mt-1">Configure your global website appearance and behavior</p>
            </div>
            <AdminSettings token={token!} />
          </>
        )}
      </main>
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, articleId: null })}
        onConfirm={() => deleteModal.articleId && handleDelete(deleteModal.articleId)}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmText="Delete"
        isDanger={true}
      />

      <ConfirmModal
        isOpen={logoutModal}
        onClose={() => setLogoutModal(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Are you sure you want to logout from the admin dashboard?"
        confirmText="Logout"
        isDanger={false}
      />
    </div>
  );
}
