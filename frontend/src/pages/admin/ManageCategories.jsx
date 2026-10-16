import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Plus, X, Save, Loader2 } from 'lucide-react';
import {
  buildCategoryPayload,
  getApiErrorMessage,
  normalizeCategory,
  normalizeCollection } from
'../../utils/api';

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(normalizeCollection(res.data).map(normalizeCategory));
    } catch (err) {
      toast.error('Failed to load categories');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setName('');
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error('Category name is required');
      return;
    }

    setLoading(true);

    try {
      const payload = buildCategoryPayload(trimmedName);

      if (editingId) {
        await api.put(`/categories/${editingId}`, payload);
        toast.success('Category updated');
      } else {
        await api.post('/categories', payload);
        toast.success('Category created');
      }

      resetForm();
      await fetchCategories();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Action failed'));
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Are you sure? This may affect products in this category.')) return;

    try {
      await api.delete(`/categories/${id}`);
      setCategories((current) => current.filter((category) => String(category.id) !== String(id)));
      toast.success('Deleted successfully');
    } catch {
      toast.error('Cannot delete: Category might be in use.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-slate-900">Manage Categories</h1>
                <p className="text-slate-500">Add or edit product groupings</p>
            </header>

            <form onSubmit={handleSubmit} className="mb-10 flex gap-3">
                <input
          className="flex-1 p-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
          placeholder="New Category Name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required />

                <button
          disabled={loading}
          className="bg-slate-900 text-white px-8 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-50">

                    {loading ? <Loader2 className="animate-spin" size={18} /> : editingId ? <Save size={18} /> : <Plus size={18} />}
                    {editingId ? 'Update' : 'Add'}
                </button>
                {editingId &&
        <button
          type="button"
          onClick={resetForm}
          className="bg-slate-100 p-4 rounded-2xl text-slate-500 hover:bg-slate-200">

                        <X size={18} />
                    </button>
        }
            </form>

            <div className="grid gap-3">
                {categories.map((category) =>
        <div
          key={category.id}
          className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-center group hover:border-blue-200 transition-all shadow-sm">

                        <div>
                            <span className="font-bold text-slate-800 text-lg">{category.name}</span>
                            <p className="text-xs text-slate-400 font-mono">ID: {category.id}</p>
                        </div>
                        <div className="flex gap-1">
                            <button
              type="button"
              onClick={() => {
                setEditingId(category.id);
                setName(category.name);
              }}
              className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">

                                <Edit size={18} />
                            </button>
                            <button
              type="button"
              onClick={() => deleteCategory(category.id)}
              className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors">

                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
        )}
            </div>
        </div>);

}
