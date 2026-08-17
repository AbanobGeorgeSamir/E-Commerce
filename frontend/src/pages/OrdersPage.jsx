import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Package, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  getEntityId,
  getOrderDate,
  getOrderItems,
  getOrderStatus,
  getOrderTotal,
  getProductImage,
  normalizeCollection,
  toCurrency
} from
  '../utils/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders');
        setOrders(normalizeCollection(response.data).map((order) => ({ ...order, id: getEntityId(order) })));
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusStyle = (status = 'pending') => {
    switch (String(status).toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'shipped':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'processing':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getStatusIcon = (status = 'pending') => {
    switch (String(status).toLowerCase()) {
      case 'completed':
      case 'delivered':
        return <CheckCircle2 size={16} />;
      case 'processing':
        return <Clock size={16} />;
      case 'shipped':
        return <Truck size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
          <p className="text-slate-400 font-medium animate-pulse">Loading your orders...</p>
        </div>
      </div>);

  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-4 inline-block">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{error}</h2>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 text-blue-600 font-bold hover:underline">

            Retry
          </button>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <Link
              to="/"
              className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-4 transition-colors text-sm font-bold uppercase tracking-wider">

              <ArrowLeft size={16} />
              Back to Store
            </Link>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Orders</h1>
            <p className="text-slate-500 mt-2 font-medium">Track and review your purchases.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm text-sm">
            <span className="text-slate-400 font-bold uppercase tracking-tighter">Total Orders: </span>
            <span className="font-black text-slate-900">{orders.length}</span>
          </div>
        </header>

        {!orders.length ?
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="text-slate-200" size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-900">No orders yet</h3>
            <p className="text-slate-500 mt-2 mb-10 max-w-xs mx-auto font-medium">
              Your future purchases will appear here once checkout is completed.
            </p>
            <Link
              to="/"
              className="inline-block bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 hover:-translate-y-1">

              Explore Collection
            </Link>
          </div> :

          <div className="space-y-6">
            {orders.map((order) =>
              <div
                key={order.id}
                className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">

                <div className="p-6 md:p-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Reference</p>
                      <p className="text-sm font-bold text-slate-900 uppercase">#{String(order.id).slice(-8)}</p>
                    </div>
                    <div className="h-10 w-px bg-slate-100 hidden sm:block" />
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Placed On</p>
                      <p className="text-sm font-bold text-slate-900">
                        {getOrderDate(order) ?
                          new Date(getOrderDate(order)).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) :
                          'N/A'}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[11px] font-black tracking-widest ${getStatusStyle(getOrderStatus(order))}`}>

                    {getStatusIcon(getOrderStatus(order))}
                    {String(getOrderStatus(order)).toUpperCase()}
                  </div>
                </div>

                <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex -space-x-4">
                      {getOrderItems(order).
                        slice(0, 3).
                        map((item) => {
                          const imageUrl = getProductImage(item.product || item);

                          return (
                            <div key={item.id} className="relative">
                              <div className="h-16 w-16 rounded-2xl ring-4 ring-white overflow-hidden bg-slate-100 shadow-sm">
                                {imageUrl ?
                                  <img
                                    src={imageUrl}
                                    alt={item.product?.name || 'product'}
                                    className="h-full w-full object-cover" /> :

                                  <div className="h-full w-full flex items-center justify-center text-slate-300 text-xs font-bold">
                                    Item
                                  </div>
                                }
                              </div>
                            </div>);

                        })}
                      {getOrderItems(order).length > 3 &&
                        <div className="h-16 w-16 rounded-2xl ring-4 ring-white bg-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                          +{getOrderItems(order).length - 3}
                        </div>
                      }
                    </div>
                    <div className="ml-2">
                      <p className="text-sm font-bold text-slate-900">
                        {getOrderItems(order).length || 0}{' '}
                        {getOrderItems(order).length === 1 ? 'Item' : 'Items'}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">Click to see details</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full md:w-auto md:gap-12 border-t md:border-none pt-6 md:pt-0">
                    <div className="flex flex-col md:items-end gap-1">
                      <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Order Total</p>
                      <p className="text-2xl font-black text-slate-900">{toCurrency(getOrderTotal(order))}</p>
                    </div>

                    <Link
                      to={`/orders/${order.id}`}
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-50 text-slate-900 text-sm font-bold hover:bg-slate-900 hover:text-white transition-all group-hover:translate-x-1">

                      Details
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        }
      </div>
    </div>);

}
