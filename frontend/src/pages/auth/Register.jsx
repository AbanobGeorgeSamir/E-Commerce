import { Link } from 'react-router-dom';
import { useAuthForm } from '../../hooks/useAuthForm';
import InputField from '../../components/ui/InputField';
import { UserPlus, Loader2, ShieldCheck } from 'lucide-react';

export default function Register() {
    const { formData, handleChange, handleSubmit, loading } = useAuthForm('register');

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-premium">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-slate-900">Create Account</h2>
                    <p className="text-slate-500 mt-2">Join our premium shopping community</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField
                        label="Full Name"
                        name="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required />

                    <InputField
                        label="Email Address"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required />

                    <div className="grid grid-cols-1 gap-4">
                        <InputField
                            label="Password"
                            name="password"
                            type="password"
                            placeholder="********"
                            value={formData.password}
                            onChange={handleChange}
                            required />

                        <InputField
                            label="Confirm Password"
                            name="password_confirmation"
                            type="password"
                            placeholder="********"
                            value={formData.password_confirmation}
                            onChange={handleChange}
                            required />

                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all disabled:opacity-50 mt-4 shadow-lg shadow-blue-200">

                        {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
                        {loading ? 'Creating Account...' : 'Register Now'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col items-center gap-4">
                    <p className="text-sm text-slate-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-600 font-bold hover:underline">
                            Log in
                        </Link>
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        <ShieldCheck size={12} />
                        Secure Encrypted Registration
                    </div>
                </div>
            </div>
        </div>);

}
