import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProduct } from '../hooks/useProduct';
import { useCart } from '../context/useCart';
import { ShoppingBag, ChevronLeft, Star, ShieldCheck, Truck } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { getProductCategoryName, getProductImage, toCurrency } from '../utils/api';
import { usePageMeta } from '../hooks/usePageMeta';

export default function ProductShow() {
    const { id } = useParams();
    const { product, loading, error } = useProduct(id);
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const imageUrl = getProductImage(product);
    const availableStock = Math.max(0, Number(product?.stock) || 0);
    const isInStock = availableStock > 0;

    usePageMeta({
        title: product?.name || 'Product',
        description: product?.description || 'View product details at Luxe Store.',
        path: `/product/${id}`,
        image: imageUrl,
        type: 'product',
        jsonLd: product ? {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description || undefined,
            image: imageUrl || undefined,
            category: getProductCategoryName(product),
            offers: {
                '@type': 'Offer',
                priceCurrency: 'USD',
                price: Number(product.price) || 0,
                availability: isInStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                url: `${window.location.origin}/product/${id}`
            }
        } : null
    });

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>);

    }

    if (error || !product) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-slate-800">Product not found</h2>
                <Link to="/" className="text-blue-600 hover:underline mt-4 block">
                    Back to Store
                </Link>
            </div>);

    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <Link
                to="/"
                className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-8 font-medium transition-colors">

                <ChevronLeft size={20} /> Back to Collection
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                <div className="bg-white p-4 rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                    {imageUrl ?
                        <img
                            src={imageUrl}
                            alt={product.name}
                            width="1200"
                            height="1200"
                            fetchPriority="high"
                            decoding="async"
                            className="w-full h-auto object-cover rounded-[2.5rem] hover:scale-105 transition-transform duration-500" /> :

                        <div className="aspect-square rounded-[2.5rem] bg-slate-100 flex items-center justify-center text-slate-300 font-bold">
                            No image available
                        </div>
                    }
                </div>

                <div className="flex flex-col">
                    <span className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-2">
                        {getProductCategoryName(product)}
                    </span>
                    <h1 className="text-5xl font-black text-slate-900 mb-4 leading-tight">{product.name}</h1>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, index) =>
                                <Star key={index} size={18} fill="currentColor" />
                            )}
                        </div>
                        <span className="text-slate-400 text-sm font-medium border-l pl-4 border-slate-200">
                            {isInStock ? `${availableStock} in stock` : 'Out of stock'}
                        </span>
                    </div>

                    <p className="text-4xl font-black text-slate-900 mb-6">{toCurrency(product.price)}</p>

                    <p className="text-slate-500 text-lg leading-relaxed mb-8">
                        {product.description ||
                            'Crafted with premium materials and designed for durability, this exclusive piece brings both style and functionality to your lifestyle.'}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mb-10">
                        <div className="flex items-center border-2 border-slate-100 rounded-2xl p-1 bg-slate-50 w-fit">
                            <button
                                type="button"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                aria-label="Decrease quantity"
                                className="w-12 h-12 flex items-center justify-center font-bold hover:bg-white rounded-xl transition-colors">

                                -
                            </button>
                            <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                            <button
                                type="button"
                                onClick={() => setQuantity(Math.min(quantity + 1, availableStock))}
                                disabled={!isInStock || quantity >= availableStock}
                                aria-label="Increase quantity"
                                className="w-12 h-12 flex items-center justify-center font-bold hover:bg-white rounded-xl transition-colors">

                                +
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => addToCart(product, quantity)}
                            disabled={!isInStock}
                            className="flex-1 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed">

                            <ShoppingBag size={20} /> {isInStock ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 border-t border-slate-100">
                        <div className="flex items-center gap-3 text-slate-600">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Truck size={20} />
                            </div>
                            <span className="text-sm font-bold">Fast & Free Shipping</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                <ShieldCheck size={20} />
                            </div>
                            <span className="text-sm font-bold">2-Year Warranty</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>);

}
