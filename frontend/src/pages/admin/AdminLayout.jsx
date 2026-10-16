import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PackagePlus,
  Tags,
  Home,
  FolderTree,
  Loader2,
  Boxes,
  ClipboardList
} from
  'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { normalizeCategory, normalizeCollection } from '../../utils/api';

export default function AdminLayout() {
  const { pathname } = useLocation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(normalizeCollection(response.data).map(normalizeCategory));
      } catch (error) {
        console.error('Failed to load categories for sidebar', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const mainMenu = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Add Product', path: '/admin/add-product', icon: <PackagePlus size={20} /> },
    { name: 'Products', path: '/admin/products', icon: <Boxes size={20} /> },
    { name: 'Categories', path: '/admin/categories', icon: <Tags size={20} /> },
    { name: 'Orders', path: '/admin/orders', icon: <ClipboardList size={20} /> }];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-72 bg-slate-900 text-white p-6 hidden md:block sticky top-0 h-screen overflow-y-auto">
        <div className="mb-10 px-2">
          <h2 className="text-xl font-black tracking-tighter uppercase">
            Admin <span className="text-blue-500">Center</span>
          </h2>
        </div>

        <nav className="space-y-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-4">Main Menu</p>
          {mainMenu.map((item) =>
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 p-4 rounded-2xl transition-all font-bold ${pathname === item.path ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800'}`
              }>

              {item.icon} {item.name}
            </Link>
          )}

          <div className="pt-8">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-4">Live Categories</p>
            {loading ?
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin text-slate-600" />
              </div> :

              <div className="space-y-1">
                {categories.map((cat) =>
                  <Link
                    key={cat.id}
                    to={`/admin/categories/${cat.id}`}
                    className="flex items-center gap-3 p-3 px-4 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all">

                    <FolderTree size={16} className="text-blue-500/50" />
                    {cat.name}
                  </Link>
                )}
              </div>
            }
          </div>

          <div className="pt-10 border-t border-slate-800 mt-10">
            <Link to="/" className="flex items-center gap-3 p-4 text-slate-400 hover:text-white transition-colors font-bold">
              <Home size={20} /> Back to Store
            </Link>
          </div>
        </nav>
      </aside>

      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <Outlet />
      </main>
    </div>);

}
