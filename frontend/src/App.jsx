import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import { useAuth } from './context/useAuth';
import Home from './pages/Home';
import { isAdminUser } from './utils/api';
import { usePageMeta } from './hooks/usePageMeta';

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Cart = lazy(() => import('./pages/Cart'));
const ProductShow = lazy(() => import('./pages/ProductShow'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AddProduct = lazy(() => import('./pages/admin/AddProduct'));
const ManageProducts = lazy(() => import('./pages/admin/ManageProducts'));
const ManageCategories = lazy(() => import('./pages/admin/ManageCategories'));
const EditCategory = lazy(() => import('./pages/admin/EditCategory'));
const ManageOrders = lazy(() => import('./pages/admin/ManageOrders'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));

const pageDetails = (pathname) => {
    if (pathname.startsWith('/product/')) return { title: 'Product', description: 'View product details at Luxe Store.' };
    if (pathname === '/cart') return { title: 'Shopping bag', description: 'Review the products in your Luxe Store shopping bag.', noIndex: true };
    if (pathname === '/login') return { title: 'Sign in', description: 'Sign in to your Luxe Store account.', noIndex: true };
    if (pathname === '/register') return { title: 'Create account', description: 'Create your Luxe Store account.', noIndex: true };
    if (pathname.startsWith('/checkout')) return { title: 'Checkout', description: 'Complete your Luxe Store order securely.', noIndex: true };
    if (pathname.startsWith('/order-success')) return { title: 'Order confirmed', description: 'Your Luxe Store order has been confirmed.', noIndex: true };
    if (pathname.startsWith('/orders')) return { title: 'Your orders', description: 'View your Luxe Store orders.', noIndex: true };
    if (pathname.startsWith('/admin')) return { title: 'Store administration', description: 'Luxe Store administration.', noIndex: true };
    return { title: 'Curated products', description: 'Discover thoughtfully selected products at Luxe Store.' };
};

const PageLoader = () => (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-label="Loading page">
        <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
    </div>
);

const StoreLayout = () =>
    <>
        <Navbar />
        <Outlet />
    </>;

const ProtectedRoute = ({ adminOnly = false }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
            </div>);

    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (adminOnly && !isAdminUser(user)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default function App() {
    const location = useLocation();
    const metadata = pageDetails(location.pathname);
    usePageMeta({
        ...metadata,
        path: location.pathname,
        skip: location.pathname.startsWith('/product/')
    });

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<StoreLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/product/:id" element={<ProductShow />} />
                </Route>

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route element={<ProtectedRoute />}>
                    <Route element={<StoreLayout />}>
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/order-success" element={<OrderSuccess />} />
                        <Route path="/orders" element={<OrdersPage />} />
                        <Route path="/orders/:id" element={<OrderDetailPage />} />
                    </Route>
                </Route>

                <Route element={<ProtectedRoute adminOnly={true} />}>
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="add-product" element={<AddProduct />} />
                        <Route path="products" element={<ManageProducts />} />
                        <Route path="categories" element={<ManageCategories />} />
                        <Route path="categories/:id" element={<EditCategory />} />
                        <Route path="orders" element={<ManageOrders />} />
                    </Route>
                </Route>

                <Route
                    path="*"
                    element={
                        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                            <h1 className="text-5xl font-black text-slate-900">404</h1>
                            <p className="text-slate-500 mt-3">The page you requested could not be found.</p>
                            <Link to="/" className="mt-6 text-blue-600 font-bold hover:underline">
                                Go back home
                            </Link>
                        </div>
                    } />

              </Routes>
            </Suspense>
        </div>);

}
