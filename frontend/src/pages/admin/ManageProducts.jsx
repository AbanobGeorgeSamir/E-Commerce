import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import InputField from '../../components/ui/InputField';
import { Search, Edit2, Trash2, Plus, Loader2, Image as ImageIcon, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  buildProductPayload,
  getApiErrorMessage,
  getImageFileError,
  normalizeCategory,
  getProductCategoryName,
  getProductImage,
  normalizeCollection,
  normalizeProduct,
  toCurrency
} from
  '../../utils/api';

const emptyForm = {
  id: null,
  name: '',
  price: '',
  stock: '',
  category_id: '',
  description: '',
  image: null
};

const resolveCategoryId = (product, categories) => {
  if (product.category_id || product.categoryId) return String(product.category_id || product.categoryId);

  const matchingCategory = categories.find(
    (category) => category.name === getProductCategoryName(product)
  );
  return matchingCategory ? String(matchingCategory.id) : '';
};

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([api.get('/products'), api.get('/categories')]);
      setProducts(normalizeCollection(prodRes.data).map(normalizeProduct));
      setCategories(normalizeCollection(catRes.data).map(normalizeCategory));
    } catch (err) {
      toast.error('Failed to sync with catalog');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    return () => {
      if (previewImage?.startsWith?.('blob:')) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const filteredProducts = useMemo(
    () => products.filter((product) => product.name?.toLowerCase().includes(searchTerm.toLowerCase())),
    [products, searchTerm]
  );

  const resetForm = () => {
    if (previewImage?.startsWith?.('blob:')) {
      URL.revokeObjectURL(previewImage);
    }
    setFormData(emptyForm);
    setPreviewImage(null);
    setIsEditing(false);
  };

  const handleEditClick = (product) => {
    if (previewImage?.startsWith?.('blob:')) {
      URL.revokeObjectURL(previewImage);
    }

    setFormData({
      id: product.id,
      name: product.name || '',
      price: product.price ?? '',
      stock: product.stock ?? '',
      category_id: resolveCategoryId(product, categories),
      description: product.description || '',
      image: null
    });
    setPreviewImage(getProductImage(product));
    setIsEditing(true);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const imageError = getImageFileError(file);
    if (imageError) {
      toast.error(imageError);
      event.target.value = '';
      return;
    }

    if (previewImage?.startsWith?.('blob:')) {
      URL.revokeObjectURL(previewImage);
    }

    setFormData((current) => ({ ...current, image: file }));
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const normalizedPrice = Number(formData.price);

    if (!formData.name.trim() || !formData.category_id || !String(formData.price).trim() || Number.isNaN(normalizedPrice)) {
      toast.error('Product name, category, and a valid price are required');
      return;
    }

    setLoading(true);

    try {
      const data = await buildProductPayload(formData);
      if (formData.id) {
        await api.put(`/products/${formData.id}`, data);
        toast.success('Product updated!');
      } else {
        await api.post('/products', data);
        toast.success('New product added!');
      }

      resetForm();
      await fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Save failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    const confirmed = window.confirm('Delete this product permanently?');
    if (!confirmed) return;

    try {
      await api.delete(`/products/${productId}`);
      setProducts((current) => current.filter((product) => product.id !== productId));
      toast.success('Product deleted');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed'));
    }
  };

  const categoryNameFor = (categoryId) =>
    categories.find((category) => String(category.id) === String(categoryId))?.name || 'General';

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Inventory Management</h1>
          <p className="text-slate-500 mt-1">Create, update, and organize your live catalog.</p>
        </div>

        {!isEditing ?
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold hover:bg-blue-700 transition-all">

            <Plus size={20} /> Add Product
          </button> :

          <button type="button" onClick={resetForm} className="text-slate-500 font-bold flex items-center gap-2">
            <X size={20} /> Cancel
          </button>
        }
      </div>

      {isEditing ?
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-8">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
            <InputField
              label="Product Name"
              value={formData.name}
              onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
              required />

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                className="w-full min-h-[160px] px-5 py-4 rounded-2xl border border-slate-200 outline-none font-medium transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5"
                placeholder="Describe the product features and benefits..."
                required />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(event) => setFormData((current) => ({ ...current, price: event.target.value }))}
                required />

              <InputField
                label="Stock"
                type="number"
                value={formData.stock}
                onChange={(event) => setFormData((current) => ({ ...current, stock: event.target.value }))}
                required />

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(event) => setFormData((current) => ({ ...current, category_id: event.target.value }))}
                  className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 outline-none font-medium transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 bg-white"
                  required>

                  <option value="">Select category</option>
                  {categories.map((category) =>
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700">Product Image</label>
              <label className="flex items-center justify-center gap-3 border-2 border-dashed border-slate-200 rounded-3xl px-6 py-10 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                <ImageIcon className="text-slate-400" size={20} />
                <span className="font-medium text-slate-600">
                  {formData.image ? formData.image.name : 'Select image'}
                </span>
                <input type="file" className="hidden" accept="image/avif,image/jpeg,image/png,image/webp" onChange={handleImageChange} />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-slate-950 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2">

              {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
              {formData.id ? 'Save Changes' : 'Create Product'}
            </button>
          </div>

          <aside className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 h-max sticky top-8">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Preview</h3>
            <div className="rounded-3xl overflow-hidden border border-slate-100 bg-slate-50">
              <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                {previewImage ?
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" /> :

                  <ImageIcon className="text-slate-300" size={40} />
                }
              </div>
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  {categoryNameFor(formData.category_id)}
                </p>
                <h4 className="text-xl font-black text-slate-900 mt-2">
                  {formData.name || 'Product name'}
                </h4>
                <p className="text-slate-500 text-sm mt-2 line-clamp-3">
                  {formData.description || 'Description preview will appear here.'}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-lg font-black text-slate-900">{toCurrency(formData.price)}</span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                    Stock: {formData.stock || 0}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </form> :

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search inventory..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                onChange={(event) => setSearchTerm(event.target.value)}
                value={searchTerm} />

            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-500 text-sm uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Product</th>
                  <th className="px-6 py-4 font-bold">Category</th>
                  <th className="px-6 py-4 font-bold">Stock</th>
                  <th className="px-6 py-4 font-bold">Price</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map((product) => {
                  const imageUrl = getProductImage(product);

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                            {imageUrl ?
                              <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" /> :

                              <ImageIcon size={16} className="text-slate-300" />
                            }
                          </div>
                          <span className="font-bold text-slate-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {getProductCategoryName(product) || categoryNameFor(product.category_id)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black ${Number(product.stock) > 10 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`
                          }>

                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900">{toCurrency(product.price)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditClick(product)}
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors">

                            <Edit2 size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors">

                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>);

                })}
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>);

}
