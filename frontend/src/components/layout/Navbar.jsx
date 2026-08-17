import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, LogOut, LayoutDashboard, Package } from 'lucide-react';
import { useCart } from '../../context/useCart';
import { useAuth } from '../../context/useAuth';
import { logoutRequest } from '../../api/axios';
import { isAdminUser } from '../../utils/api';

export default function Navbar() {
    const { cartCount } = useCart();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logoutRequest();
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            logout();
            navigate('/login');
        }
    };

    return (
        <nav aria-label="Main navigation" className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">

                <Link to="/" className="text-2xl font-black tracking-tighter text-slate-900">
                    LUXE<span className="text-blue-600">STORE.</span>
                </Link>

                <div className="flex items-center gap-2 sm:gap-6">

                    <Link to="/cart" aria-label={`Shopping bag${cartCount ? `, ${cartCount} items` : ''}`} className="relative p-2 text-slate-700 hover:text-blue-600 transition-colors">
                        <ShoppingBag size={24} />
                        {cartCount > 0 &&
                            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-in zoom-in">
                                {cartCount}
                            </span>
                        }
                    </Link>

                    {user ?
                        <div className="flex items-center gap-2 sm:gap-4 border-l pl-4 sm:pl-6 border-slate-200">

                            <Link
                                to="/orders"
                                className="p-2 text-slate-600 hover:text-blue-600 flex items-center gap-2 transition-colors"
                                title="My Orders">

                                <Package size={22} />
                                <span className="text-xs font-bold hidden lg:block">Orders</span>
                            </Link>

                            {isAdminUser(user) &&
                                <Link
                                    to="/admin"
                                    className="p-2 text-slate-600 hover:text-blue-600 flex items-center gap-2 transition-colors"
                                    title="Admin Dashboard">

                                    <LayoutDashboard size={22} />
                                    <span className="text-xs font-bold hidden lg:block">Admin</span>
                                </Link>
                            }

                            <div className="flex items-center gap-1 sm:gap-3 ml-2">
                                <div className="hidden sm:flex flex-col items-end mr-1">
                                    <span className="text-xs text-slate-400 font-medium">Hello,</span>
                                    <span className="text-sm font-bold text-slate-700 leading-none">
                                        {user.name?.split(' ')[0] || 'Account'}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    title="Logout">

                                    <LogOut size={22} />
                                </button>
                            </div>
                        </div> :

                        <Link
                            to="/login"
                            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-slate-200">

                            Login
                        </Link>
                    }
                </div>
            </div>
        </nav>);

}
