import { useState, useEffect } from 'react';
import api from '../../api/axios';
import InputField from '../../components/ui/InputField';
import {
    Loader2,
    Image as ImageIcon,
    AlignLeft,
    Layers3,
    DollarSign,
    PackageSearch,
    Save,
    AlertCircle
} from
    'lucide-react';
import { toast } from 'react-hot-toast';
import {
    buildProductPayload,
    getImageFileError,
    getApiErrorMessage,
    normalizeCategory,
    normalizeCollection
} from
    '../../utils/api';

export default function AddProduct() {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock: '',
        category_id: '',
        description: '',
        image: null
    });

    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories');
                setCategories(normalizeCollection(res.data).map(normalizeCategory));
            } catch (err) {
                console.error("Could not load categories:", err);
                toast.error("Failed to load categories list");
            }
        };
        fetchCategories();
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const imageError = getImageFileError(file);
        if (imageError) {
            toast.error(imageError);
            e.target.value = '';
            return;
        }

        setFormData({ ...formData, image: file });
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleAction = async (e) => {
        e.preventDefault();
        const normalizedPrice = Number(formData.price);

        if (!formData.name.trim() || !formData.category_id || !formData.price.trim() || Number.isNaN(normalizedPrice)) {
            toast.error('Product name, category, and a valid price are required');
            return;
        }

        setLoading(true);

        try {
            const data = await buildProductPayload(formData);
            await api.post('/products', data);

            toast.success('Product successfully added to catalog!');

            setFormData({ name: '', price: '', stock: '', category_id: '', description: '', image: null });
            setPreviewImage(null);
        } catch (err) {
            console.error("Upload Error:", err.response?.data);
            const errorMsg = getApiErrorMessage(err, 'Failed to publish product');
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 py-10 px-4 md:px-10">

            <header className="mb-10 flex items-center justify-between pb-6 border-b border-slate-100">
                <div>
                    <h1 className="text-4xl font-black text-slate-950 tracking-tighter">Add New Product</h1>
                    <p className="text-slate-500 mt-1.5 text-lg">Introduce a new masterpiece to your store's inventory.</p>
                </div>
                <button
                    form="add-product-form"
                    disabled={loading}
                    className="flex items-center gap-3 bg-slate-950 text-white px-10 py-5 rounded-3xl font-extrabold shadow-lg shadow-slate-200 group hover:bg-blue-600 transition-all duration-300 disabled:opacity-60">

                    {loading ?
                        <Loader2 className="animate-spin" size={20} /> :

                        <Save size={20} className="group-hover:scale-110 transition-transform" />
                    }
                    {loading ? 'Publishing...' : 'Publish to Store'}
                </button>
            </header>

            <form id="add-product-form" onSubmit={handleAction} className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-10">

                <div className="space-y-10">

                    <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-premium">
                        <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                            <Layers3 className="text-blue-500" />
                            Core Details
                        </h3>

                        <div className="space-y-6">
                            <InputField
                                label="Product Title"
                                name="name"
                                placeholder="e.g., Premium Wireless Headphones"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required />

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                                    <AlignLeft size={16} className="text-slate-400" />
                                    Product Description
                                </label>
                                <textarea
                                    className="w-full p-6 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all min-h-[180px] resize-none text-slate-600 placeholder:text-slate-300 bg-slate-50/50"
                                    placeholder="Craft a compelling description that highlights unique features, benefits, and specifications..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required />

                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="block text-sm font-bold text-slate-700 ml-1">Assign Category</label>
                                <select
                                    className="w-full p-5 rounded-2xl border border-slate-200 outline-none bg-slate-50/50 focus:border-blue-500 transition-all cursor-pointer text-slate-600 font-medium"
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    required>

                                    <option value="">Select Category...</option>
                                    {categories.length > 0 ?
                                        categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>) :

                                        <option disabled>Loading categories...</option>
                                    }
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-premium">
                        <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                            <ImageIcon className="text-blue-500" />
                            Product Gallery
                        </h3>

                        <div className="group relative p-12 border-2 border-dashed border-slate-200 rounded-3xl hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-500 bg-slate-50">
                            <label className="flex flex-col items-center gap-4 cursor-pointer">
                                <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 group-hover:shadow-lg transition-all">
                                    <ImageIcon size={32} className="text-blue-500" />
                                </div>
                                <div className="text-center">
                                    <span className="block text-base font-bold text-slate-800">
                                        {formData.image ? `File Selected: ${formData.image.name}` : "Drop or select product image"}
                                    </span>
                                    <span className="text-sm text-slate-400 mt-1 block">
                                        High-resolution images (JPG, PNG, WEBP) are recommended.
                                    </span>
                                </div>
                                <input type="file" className="hidden" accept="image/avif,image/jpeg,image/png,image/webp" onChange={handleImageChange} name='image' />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="space-y-10 lg:sticky lg:top-10 lg:h-max">

                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-premium">
                        <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                            <DollarSign className="text-blue-500" size={20} />
                            Logistics
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <InputField
                                label="Unit Price ($)"
                                name="price"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required />

                            <InputField
                                label="Inventory Stock"
                                name="stock"
                                type="number"
                                placeholder="0"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                required />

                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-premium">
                        <h3 className="text-sm font-bold text-slate-500 mb-5 flex items-center gap-2 uppercase tracking-wider">
                            <PackageSearch size={16} />
                            Live Catalog Preview
                        </h3>

                        <div className="border border-slate-100 rounded-3xl overflow-hidden group shadow-inner bg-slate-50/50">
                            <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center relative overflow-hidden">
                                {previewImage ?
                                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> :

                                    <ImageIcon size={48} className="text-slate-300" />
                                }
                                {(!formData.name || !formData.price || !formData.stock) &&
                                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-amber-400 text-amber-950 px-3 py-1 text-[11px] font-extrabold uppercase rounded-full shadow-lg">
                                        <AlertCircle size={12} /> Needs Data
                                    </div>
                                }
                            </div>

                            <div className="p-6 space-y-3">
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                                    {categories.find((c) => c.id == formData.category_id)?.name || 'Unassigned Category'}
                                </div>
                                <h4 className="text-lg font-extrabold text-slate-950 leading-tight line-clamp-2 min-h-[56px]">
                                    {formData.name || "Product Title Placeholder"}
                                </h4>
                                <div className="flex items-end justify-between pt-1 gap-2 border-t border-slate-100/50">
                                    <div className="text-2xl font-black text-blue-600">
                                        ${parseFloat(formData.price || 0).toFixed(2)}
                                    </div>
                                    <div className={`text-sm font-bold px-3 py-1 rounded-full ${parseInt(formData.stock || 0) > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                        Stock: {formData.stock || 0}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>);

}
