import { Link } from 'react-router-dom';
import { useAuthForm } from '../../hooks/useAuthForm';
import InputField from '../../components/ui/InputField';
import { LogIn, Loader2, ShieldCheck } from 'lucide-react';

export default function Login() {
    const { formData, handleChange, handleSubmit, loading } = useAuthForm('login');

    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4 bg-slate-50">
            <div className="max-w-md w-full">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 mb-4">
                        <ShieldCheck size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
                    <p className="text-slate-500 mt-2 font-medium">
                        Enter your credentials to access your account
                    </p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <InputField
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="alex@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required />

                        <div className="space-y-1">
                            <InputField
                                label="Password"
                                name="password"
                                type="password"
                                placeholder="********"
                                value={formData.password}
                                onChange={handleChange}
                                required />

                            <div className="flex justify-end">
                                <button type="button" className="text-xs font-bold text-blue-600 hover:underline">
                                    Forgot Password?
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-slate-200">

                            {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
                            {loading ? 'Verifying Account...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                        <p className="text-slate-500 text-sm font-medium">
                            Don&apos;t have an account yet?{' '}
                            <Link to="/register" className="text-blue-600 font-bold hover:underline">
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center mt-8 text-xs text-slate-400 font-medium uppercase tracking-widest">
                    Secure 256-bit SSL Encryption
                </p>
            </div>
        </div>);

}
