import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  AlertTriangle,
  DollarSign,
  LayoutDashboard,
  Layers,
  Package,
  RefreshCcw
} from
  'lucide-react';
import api from '../../api/axios';
import {
  getEntityId,
  getOrderCustomerName,
  getOrderTotal,
  normalizeCategory,
  normalizeCollection,
  normalizeProduct,
  toCurrency
} from
  '../../utils/api';

const buildDashboardData = ({ products, categories, orders }) => {
  const totalRevenue = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);
  const totalStockUnits = products.reduce((sum, product) => sum + (Number(product.stock) || 0), 0);
  const lowStockCount = products.filter((product) => Number(product.stock) < 5).length;
  const categoryDistribution = categories.map((category) => ({
    id: category.id,
    name: category.name,
    count: products.filter(
      (product) =>
        String(product.category_id || product.categoryId) === String(category.id) ||
        product.category === category.name ||
        product.category?.name === category.name
    ).length
  }));

  return {
    totalRevenue,
    totalProducts: products.length,
    totalCategories: categories.length,
    totalOrders: orders.length,
    lowStockCount,
    totalStockUnits,
    categoryDistribution,
    latestOrders: orders.slice(0, 5)
  };
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      const [productsResponse, categoriesResponse, ordersResponse] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/orders')]
      );

      const products = normalizeCollection(productsResponse.data).map(normalizeProduct);
      const categories = normalizeCollection(categoriesResponse.data).map(normalizeCategory);
      const orders = normalizeCollection(ordersResponse.data).map((order) => ({
        ...order,
        id: getEntityId(order)
      }));

      setData(buildDashboardData({ products, categories, orders }));
    } catch (error) {
      toast.error('Could not load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="p-6 md:p-10 bg-[#F8FAFC] min-h-screen font-sans">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
              <LayoutDashboard className="text-white" size={28} />
            </div>
            Command Center
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Live totals generated from the routes your backend currently exposes.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:shadow-md transition-all active:scale-95">

          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          Sync Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <MetricCard
          label="Order Revenue"
          value={loading ? null : toCurrency(data?.totalRevenue)}
          trend="Tracked"
          icon={<DollarSign className="text-emerald-600" />}
          bgColor="bg-emerald-50" />

        <MetricCard
          label="Products"
          value={loading ? null : data?.totalProducts || 0}
          trend="Catalog"
          icon={<Package className="text-blue-600" />}
          bgColor="bg-blue-50" />

        <MetricCard
          label="Low Stock"
          value={loading ? null : data?.lowStockCount || 0}
          trend="Alerts"
          icon={<AlertTriangle className={data?.lowStockCount ? 'text-orange-500' : 'text-slate-400'} />}
          bgColor="bg-orange-50" />

        <MetricCard
          label="Stock Units"
          value={loading ? null : data?.totalStockUnits?.toLocaleString() || 0}
          trend="Available"
          icon={<Layers className="text-violet-600" />}
          bgColor="bg-violet-50" />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40">
          <h3 className="text-xl font-black text-slate-900 mb-8">Category Breakdown</h3>

          <div className="space-y-8">
            {loading ?
              [1, 2, 3].map((item) =>
                <div key={item} className="h-12 bg-slate-100 animate-pulse rounded-xl" />
              ) :
              data?.categoryDistribution?.map((category) =>
                <div key={category.id || category.name}>
                  <div className="flex justify-between mb-3">
                    <span className="text-slate-700 font-extrabold">{category.name}</span>
                    <span className="text-slate-400 font-bold text-sm">{category.count} items</span>
                  </div>
                  <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-700"
                      style={{
                        width: `${category.count / (data?.totalProducts || 1) * 100}%`
                      }} />

                  </div>
                </div>
              )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl text-white">
          <h3 className="text-xl font-black mb-8">Latest Orders</h3>
          <div className="space-y-6">
            {loading ?
              [1, 2, 3].map((item) =>
                <div key={item} className="h-14 bg-white/10 animate-pulse rounded-xl" />
              ) :
              data?.latestOrders?.length ?
                data.latestOrders.map((order) =>
                  <div key={order.id} className="rounded-2xl bg-white/5 p-4 border border-white/5">
                    <p className="font-black text-slate-100">Order #{order.id}</p>
                    <p className="text-sm text-slate-400 mt-1">{getOrderCustomerName(order)}</p>
                    <p className="text-sm text-blue-300 mt-2">{toCurrency(getOrderTotal(order))}</p>
                  </div>
                ) :
                <p className="text-slate-400">No orders found yet.</p>}
          </div>
        </div>
      </div>
    </div>);

}

function MetricCard({ label, value, trend, icon, bgColor }) {
  return (
    <div className="bg-white p-8 rounded-[2.2rem] border border-slate-100 shadow-xl shadow-slate-200/30">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl ${bgColor}`}>{icon}</div>
        {value !== null &&
          <div className="text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter text-slate-500 bg-slate-50">
            {trend}
          </div>
        }
      </div>
      <div>
        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.15em] mb-1">{label}</p>
        {value === null ?
          <div className="h-9 w-24 bg-slate-100 animate-pulse rounded-lg" /> :

          <h2 className="text-3xl font-black text-slate-950">{value}</h2>
        }
      </div>
    </div>);

}
