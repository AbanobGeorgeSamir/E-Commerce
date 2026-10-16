import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/products/ProductCard';
import { Loader2, PackageSearch, ArrowRight, ArrowUp, ChevronDown } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

export default function Home() {
    const { products, loading, error } = useProducts();
    const [showScrollUp, setShowScrollUp] = useState(false);
    const productsRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollUp(window.scrollY > 500);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToProducts = () => {
        productsRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>);

    }

    if (error) {
        return <div className="text-center py-20 text-red-500 font-bold">{error}</div>;
    }

    return (
        <main className="pb-20 relative">
            <section className="relative bg-slate-900 py-24 mb-16 overflow-hidden min-h-[85vh] flex items-center">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-400 rounded-full blur-3xl" />
                </div>

                <div className="max-w-7xl mx-auto px-4 relative z-10 w-full">
                    <div className="max-w-2xl text-left">
                        <span className="text-blue-400 font-bold tracking-widest uppercase text-sm mb-4 block">
                            Summer Collection 2026
                        </span>
                        <h1 className="text-6xl md:text-7xl font-black text-white mb-6 leading-tight">
                            Elevate Your <span className="text-blue-500">Style.</span>
                        </h1>
                        <p className="text-slate-400 text-xl mb-10 leading-relaxed">
                            Experience the perfect blend of luxury and comfort with our latest arrivals.
                            Designed for those who never settle.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <button
                                type="button"
                                onClick={scrollToProducts}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all group">

                                Shop Now{' '}
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={scrollToProducts}
                    aria-label="Scroll to products"
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30 hover:text-blue-500 transition-colors animate-bounce">

                    <ChevronDown size={40} />
                </button>
            </section>

            <div ref={productsRef} className="max-w-7xl mx-auto px-4 scroll-mt-24">
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="text-left">
                        <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">New Arrivals</h2>
                        <p className="text-slate-500 text-lg">Our latest pieces, handpicked for you.</p>
                    </div>
                    <button
                        type="button"
                        onClick={scrollToProducts}
                        className="text-blue-600 font-bold flex items-center gap-2 hover:underline">

                        Browse Products <ArrowRight size={18} />
                    </button>
                </header>

                {products.length > 0 ?
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {products.map((product) =>
                            <ProductCard key={product.id} product={product} />
                        )}
                    </div> :

                    <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                        <PackageSearch className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-500 font-medium text-lg">No products available at the moment.</p>
                    </div>
                }
            </div>

            <button
                type="button"
                onClick={scrollToTop}
                className={`fixed bottom-10 right-10 p-4 rounded-full bg-blue-600 text-white shadow-2xl transition-all duration-300 hover:bg-slate-900 z-50 ${showScrollUp ? 'opacity-100' : 'opacity-0 pointer-events-none'}`
                }>

                <ArrowUp size={24} />
            </button>
        </main>);

}
