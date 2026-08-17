import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Home, ShoppingBag } from 'lucide-react';
import { toCurrency } from '../utils/api';

export default function OrderSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const orderId = location.state?.orderId;
    const total = location.state?.total;

    if (!orderId || total === undefined) {
        navigate('/', { replace: true });
        return null;
    }

    return (
        <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-slate-50">
            <div className="max-w-xl w-full bg-white border border-slate-100 rounded-[2.5rem] p-10 text-center shadow-xl shadow-slate-200/40">
                <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle2 size={42} className="text-green-600" />
                </div>
                <h1 className="text-4xl font-black text-slate-900">Order confirmed</h1>
                <p className="mt-3 text-slate-500">
                    Your checkout request was sent successfully and is now waiting for review.
                </p>

                <div className="mt-8 grid gap-4 text-left">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Order ID</span>
                        <span className="font-black text-slate-900">{orderId ? `#${orderId}` : 'Created successfully'}</span>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Estimated total</span>
                        <span className="font-black text-slate-900">{toCurrency(total)}</span>
                    </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <Link
                        to="/"
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white px-6 py-4 font-bold hover:bg-blue-600 transition-all">

                        <ShoppingBag size={18} /> Continue shopping
                    </Link>
                    <Link
                        to="/"
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 text-slate-700 px-6 py-4 font-bold hover:bg-slate-50 transition-all">

                        <Home size={18} /> Back home
                    </Link>
                </div>
            </div>
        </div>);

}
