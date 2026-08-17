import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';    import { toast } from 'react-hot-toast';import {
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    MapPin,
    Package,
    Printer,
    Truck
} from
    'lucide-react';
import api from '../api/axios';
import {
    getEntityId,
    getOrderAddress,
    getOrderCustomerName,
    getOrderDate,
    getOrderItems,
    getOrderPhone,
    getOrderStatus,
    getOrderTotal,
    getProductCategoryName,
    getProductImage,
    normalizeCollection,
    toCurrency
} from
    '../utils/api';

export default function OrderDetailPage() {
    const { id } = useParams();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await api.get(`/orders/${id}`);
                const order = normalizeCollection([response.data])[0];
                setOrders([{ ...order, id: getEntityId(order) }]);
            } catch (error) {
                console.error('Fetch Error:', error);
                setOrders([]);
                toast.error('Failed to load order details');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchOrders();
    }, [id]);

    const order = useMemo(
        () => orders.find((item) => String(item.id) === String(id)) || null,
        [id, orders]
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600" />
            </div>);

    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                    <Package size={48} />
                </div>
                <p className="text-slate-500 font-bold text-xl">Order not found.</p>
                <Link to="/orders" className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-600 transition-all">
                    Return to My Orders
                </Link>
            </div>);

    }

    const orderItems = getOrderItems(order);
    const orderStatus = String(getOrderStatus(order)).toLowerCase();
    const subtotal = orderItems.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
        0
    );

    return (
        <div className="min-h-screen bg-slate-50/30 py-12 px-4">
            <div className="max-w-5xl mx-auto">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <Link
                            to="/orders"
                            className="flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-4 transition-colors font-bold text-xs tracking-widest">

                            <ArrowLeft size={16} /> BACK TO ORDERS
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            Order <span className="text-blue-600">#{String(order.id).slice(-8).toUpperCase()}</span>
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium">
                            Placed on{' '}
                            {getOrderDate(order) ?
                                new Date(getOrderDate(order)).toLocaleDateString('en-US', { dateStyle: 'long' }) :
                                'N/A'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">

                        <Printer size={18} />
                        Print Invoice
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="font-black text-slate-900 flex items-center gap-2">
                                    <Package size={20} className="text-blue-600" />
                                    Order Items ({orderItems.length || 0})
                                </h3>
                                <span className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black tracking-widest uppercase">
                                    {getOrderStatus(order)}
                                </span>
                            </div>

                            <div className="divide-y divide-slate-50 px-8">
                                {orderItems.map((item) => {
                                    const imageUrl = getProductImage(item.product || item);
                                    const productName = item.product?.name || item.name || `Product #${item.product_id}`;

                                    return (
                                        <div key={item.id} className="py-6 flex items-center gap-6">
                                            <div className="h-24 w-24 flex-shrink-0 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 relative group">
                                                {imageUrl ?
                                                    <img
                                                        src={imageUrl}
                                                        alt={productName}
                                                        className="h-full w-full object-cover transition-transform group-hover:scale-110" /> :

                                                    <div className="h-full w-full flex items-center justify-center text-slate-200">
                                                        <Package size={32} />
                                                    </div>
                                                }
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-900 text-lg leading-tight mb-1">{productName}</h4>
                                                <p className="text-sm text-slate-400 font-medium capitalize">
                                                    Category: {getProductCategoryName(item.product || item)}
                                                </p>
                                                <div className="mt-3 flex items-center gap-4">
                                                    <span className="text-sm font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg">
                                                        Qty: {item.quantity || 1}
                                                    </span>
                                                    <span className="text-lg font-black text-blue-600">
                                                        {toCurrency(item.price)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>);

                                })}
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2">
                                <Truck size={20} className="text-blue-600" />
                                Delivery Status
                            </h3>
                            <div className="flex items-center justify-between relative px-4">
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0" />
                                <StatusStep icon={<CheckCircle2 />} label="Confirmed" active />
                                <StatusStep
                                    icon={<Package />}
                                    label="Processing"
                                    active={orderStatus !== 'pending'} />

                                <StatusStep
                                    icon={<Truck />}
                                    label="Shipped"
                                    active={['shipped', 'completed', 'delivered'].includes(orderStatus)} />

                                <StatusStep
                                    icon={<CheckCircle2 />}
                                    label="Completed"
                                    active={['completed', 'delivered'].includes(orderStatus)} />

                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-200">
                            <h3 className="font-black text-xl mb-6">Payment Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between text-slate-400 font-medium text-sm">
                                    <span>Items Subtotal</span>
                                    <span className="text-white">{toCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-slate-400 font-medium text-sm">
                                    <span>Shipping Fee</span>
                                    <span className="text-white">{toCurrency(0)}</span>
                                </div>
                                <div className="h-px bg-white/10 my-4" />
                                <div className="flex justify-between items-end">
                                    <span className="font-bold text-lg">Order Total</span>
                                    <span className="text-3xl font-black text-blue-400">
                                        {toCurrency(getOrderTotal(order))}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-3">
                                <CreditCard className="text-slate-500" size={20} />
                                <span className="text-xs font-bold text-slate-400 tracking-wide uppercase italic">
                                    Method: {order.payment || 'Direct Payment'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                                <MapPin size={20} className="text-blue-600" />
                                Shipping Details
                            </h3>
                            <div className="text-slate-500 text-sm leading-relaxed font-medium">
                                <p className="font-black text-slate-900 text-base mb-1">
                                    {getOrderCustomerName(order)}
                                </p>
                                <p className="mb-1">{getOrderAddress(order)}</p>
                                <p className="text-slate-400">{getOrderPhone(order)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>);

}

function StatusStep({ icon, label, active }) {
    return (
        <div className="relative z-10 flex flex-col items-center gap-2">
            <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center border-4 border-white shadow-sm transition-all duration-500 ${active ? 'bg-blue-600 text-white scale-110' : 'bg-slate-100 text-slate-400'}`
                }>

                {icon}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-tighter ${active ? 'text-slate-900' : 'text-slate-300'}`}>
                {label}
            </span>
        </div>);

}
