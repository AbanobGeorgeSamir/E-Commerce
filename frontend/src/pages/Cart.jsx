import { useCart } from '../context/useCart';
import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ArrowRight, ShoppingCart, ChevronLeft } from 'lucide-react';
import { getEntityId, getProductImage, toCurrency } from '../utils/api';

export default function Cart() {
    const { cart, updateQty, removeFromCart, subtotal } = useCart();

    if (cart.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <ShoppingCart size={40} className="text-slate-300" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Your cart is empty</h2>
                <p className="text-slate-500 mt-2 max-w-sm">Looks like you haven&apos;t added anything yet.</p>
                <Link
                    to="/"
                    className="mt-8 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-blue-200">

                    Start Shopping
                </Link>
            </div>);

    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex items-center gap-4 mb-10">
                <Link
                    to="/"
                    className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">

                    <ChevronLeft size={20} />
                </Link>
                <h1 className="text-4xl font-black text-slate-900">Your Bag</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-4">
                    {cart.map((item) => {
                        const imageUrl = getProductImage(item);
                        const itemId = getEntityId(item);

                        return (
                            <div
                                key={itemId}
                                className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col sm:flex-row items-center gap-6">

                                {imageUrl ?
                                    <img
                                        src={imageUrl}
                                        className="w-32 h-32 object-cover rounded-2xl"
                                        alt={item.name} /> :

                                    <div className="w-32 h-32 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 font-bold">
                                        No image
                                    </div>
                                }

                                <div className="flex-1 text-center sm:text-left">
                                    <h3 className="font-bold text-xl text-slate-900">{item.name}</h3>
                                    <p className="text-blue-600 font-black text-lg mt-1">{toCurrency(item.price)}</p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => updateQty(itemId, item.quantity - 1)}
                                            className="p-1 text-slate-400 hover:text-blue-600">

                                            <Minus size={18} />
                                        </button>
                                        <span className="w-10 text-center font-bold">{item.quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => updateQty(itemId, item.quantity + 1)}
                                            className="p-1 text-slate-400 hover:text-blue-600">

                                            <Plus size={18} />
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeFromCart(itemId)}
                                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">

                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>);

                    })}
                </div>

                <div className="lg:col-span-4">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white sticky top-24 shadow-2xl">
                        <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                        <div className="space-y-4 border-b border-white/10 pb-6 mb-6">
                            <div className="flex justify-between text-slate-400">
                                <span>Subtotal</span>
                                <span className="text-white">{toCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Shipping</span>
                                <span className="text-green-400 font-bold">FREE</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-end mb-8">
                            <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Total</span>
                            <span className="text-4xl font-black">{toCurrency(subtotal)}</span>
                        </div>
                        <Link
                            to="/checkout"
                            className="group flex items-center justify-center gap-3 w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-xl shadow-blue-900/20">

                            Checkout Now <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>);

}
