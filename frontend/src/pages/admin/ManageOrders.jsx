import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    Loader2,
    MapPin,
    Package,
    Phone,
    User
} from
    'lucide-react';
import api from '../../api/axios';
import {
    getEntityId,
    getOrderAddress,
    getOrderCustomerName,
    getOrderDate,
    getOrderItems,
    getOrderPhone,
    getOrderStatus,
    getOrderTotal,
    normalizeCollection,
    normalizeItem,
    normalizeOrder,
    toCurrency
} from
    '../../utils/api';

import { useAuth } from '../../context/useAuth';
import { useNavigate } from 'react-router-dom';

const STATUS_TRANSITIONS = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: [],
    completed: [],
    cancelled: [],
};
const FILTER_STATUSES = ['all', 'pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];

export default function ManageOrders() {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [updatingOrderId, setUpdatingOrderId] = useState('');

    const fetchOrders = async () => {
        setLoading(true);

        try {
            const response = await api.get('/orders');
            setOrders(normalizeCollection(response.data).map((order) => ({ ...order, id: getEntityId(order) })));
        } catch (error) {
            toast.error('Failed to load orders');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAdmin) return;
        fetchOrders();
    }, [isAdmin]);

    const handleStatusChange = async (orderId, status) => {
        setUpdatingOrderId(orderId);
        try {
            const response = await api.patch(`/orders/${orderId}/status`, { status });
            const updatedOrder = normalizeOrder(normalizeItem(response.data));
            setOrders((current) => current.map((order) => order.id === orderId ? updatedOrder : order));
            toast.success('Order status updated.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Could not update order status.');
        } finally {
            setUpdatingOrderId('');
        }
    };

    const filteredOrders = useMemo(() => {
        if (filterStatus === 'all') {
            return orders;
        }

        return orders.filter((order) => String(getOrderStatus(order)).toLowerCase() === filterStatus);
    }, [filterStatus, orders]);

    if (!isAdmin) {
        return (
            <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
                    <p className="text-slate-500 mb-4">You do not have permission to access this page.</p>
                    <button onClick={() => navigate('/')} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-300" size={48} />
            </div>);

    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Orders</h1>
                    <p className="text-slate-500">Review customer orders and update their delivery status.</p>
                </div>

                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                    {FILTER_STATUSES.map((status) =>
                        <button
                            key={status}
                            type="button"
                            onClick={() => setFilterStatus(status)}
                            className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all ${filterStatus === status ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`
                            }>

                            {status}
                        </button>
                    )}
                </div>
            </header>

            {filteredOrders.length === 0 ?
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
                    <Package className="mx-auto text-slate-200 mb-4" size={48} />
                    <p className="text-slate-400 font-medium">No orders found for this filter.</p>
                </div> :

                <div className="grid gap-6">
                    {filteredOrders.map((order) => {
                        const items = getOrderItems(order);
                        const currentStatus = String(getOrderStatus(order)).toLowerCase();
                        const nextStatuses = STATUS_TRANSITIONS[currentStatus] || [];

                        return <article
                            key={order.id}
                            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

                            <div className="bg-slate-50/50 px-8 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                                <div>
                                    <p className="font-mono font-bold text-slate-500">#{order.id}</p>
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mt-1">{currentStatus}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-400">
                                        {getOrderDate(order) ? new Date(getOrderDate(order)).toLocaleDateString() : 'No date'}
                                    </p>
                                    <p className="text-xl font-black text-slate-900">{toCurrency(getOrderTotal(order))}</p>
                                </div>
                                <label className="sr-only" htmlFor={`order-status-${order.id}`}>Update order status</label>
                                <select
                                    id={`order-status-${order.id}`}
                                    value={currentStatus}
                                    disabled={!nextStatuses.length || updatingOrderId === order.id}
                                    onChange={(event) => handleStatusChange(order.id, event.target.value)}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 disabled:opacity-60">
                                    {[currentStatus, ...nextStatuses].map((status) =>
                                        <option key={status} value={status}>{status}</option>
                                    )}
                                </select>
                            </div>

                            <div className="p-8 grid md:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest">Customer</h4>
                                    <div className="flex items-center gap-3 text-slate-700">
                                        <User size={18} className="text-slate-300" />
                                        <span className="font-bold">{getOrderCustomerName(order)}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-600 text-sm">
                                        <Phone size={18} className="text-slate-300" />
                                        <span>{getOrderPhone(order)}</span>
                                    </div>
                                    <div className="flex items-start gap-3 text-slate-600 text-sm">
                                        <MapPin size={18} className="text-slate-300 mt-0.5" />
                                        <span>{getOrderAddress(order)}</span>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4">Items</h4>
                                    <div className="grid gap-3">
                                        {items.length ?
                                            items.map((item) =>
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">

                                                    <div>
                                                        <p className="font-bold text-slate-800">
                                                            {item.name || item.product?.name || `Product #${item.product_id}`}
                                                        </p>
                                                        <p className="text-sm text-slate-400">Qty: {item.quantity}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-slate-900">{toCurrency(item.price)}</p>
                                                        <p className="text-xs text-slate-400">each</p>
                                                    </div>
                                                </div>
                                            ) :

                                            <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-6 text-slate-400">
                                                Item details were not included for this order.
                                            </div>
                                        }
                                    </div>

                                </div>
                            </div>
                        </article>;
                    })}
                </div>
            }
        </div>);

}
