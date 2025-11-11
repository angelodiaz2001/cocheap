"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, TrendingDown, ArrowUp, Loader2 } from "lucide-react";
import Image from "next/image";

interface Product {
  title: string;
  price: number;
  currency: string;
  store?: string;
  source?: string;
  url?: string;
  permalink?: string;
  image?: string;
  thumbnail?: string;
}

const STORE_LOGOS: Record<string, string> = {
  "mercadolibre": "/icons/mercadolibre.png",
  "falabella": "/icons/falabella.png",
  "éxito": "/icons/exito.png",
  "exito": "/icons/exito.png",
  "olímpica": "/icons/olimpica.png",
  "olimpica": "/icons/olimpica.png",
  "homecenter": "/icons/homecenter.png",
  "alkosto": "/icons/alkosto.png",
};

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [cheapest, setCheapest] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "az" | "za">("price-asc");

  const handleSearchWithQuery = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      
      const sortedItems = (data.items || []).sort((a: any, b: any) => a.price - b.price);
      
      setResults(sortedItems);
      setCheapest(data.cheapest || null);
    } catch (error) {
      console.error('Error buscando:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      handleSearchWithQuery(q);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchWithQuery(query);
  };

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case "price-asc": return a.price - b.price;
      case "price-desc": return b.price - a.price;
      case "az": return a.title.localeCompare(b.title);
      case "za": return b.title.localeCompare(a.title);
      default: return 0;
    }
  });

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-emerald-50/20">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <motion.div
          className="absolute top-1/4 -left-12 w-96 h-96 bg-emerald-300 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-12 w-96 h-96 bg-emerald-200 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Main content */}
      <div className="relative">
        {/* Search Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-16 z-40 backdrop-blur-lg bg-white/60 border-b border-gray-200 shadow-sm"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Busca iPhone, laptops, electrodomésticos..."
                  className="w-full rounded-full bg-gray-50 border border-gray-200 pl-12 pr-6 py-3 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 font-medium transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Buscar
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.header>

        {/* Results section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            // Loading skeleton
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          ) : results.length === 0 && query ? (
            // No results
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="text-6xl mb-4">😕</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                No encontramos resultados para "{query}"
              </h3>
              <p className="text-gray-600 mb-6">
                Prueba con otro término o explora nuestras categorías
              </p>
              <a
                href="/"
                className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all"
              >
                Volver al inicio
              </a>
            </motion.div>
          ) : results.length > 0 ? (
            <>
              {/* Results toolbar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-36 z-30 backdrop-blur-md bg-white/80 rounded-full px-6 py-3 shadow-sm border border-gray-200 mb-6 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Search className="w-4 h-4" />
                  <span className="font-medium">
                    Resultados para: <span className="text-gray-900">{query}</span>
                  </span>
                  <span className="text-emerald-600 font-semibold">
                    ({results.length} productos)
                  </span>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-full border border-gray-200 px-4 py-1 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white/80"
                >
                  <option value="price-asc">Menor precio</option>
                  <option value="price-desc">Mayor precio</option>
                  <option value="az">A → Z</option>
                  <option value="za">Z → A</option>
                </select>
              </motion.div>

              {/* Best Price Card */}
              {cheapest && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-8 bg-gradient-to-br from-emerald-50 to-white rounded-2xl shadow-lg border border-emerald-100 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                        className="text-3xl"
                      >
                        🏷️
                      </motion.div>
                      <div>
                        <h3 className="text-lg font-semibold text-emerald-900">
                          ¡Mejor oferta encontrada!
                        </h3>
                        <p className="text-sm text-emerald-700">
                          El precio más bajo disponible
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                      {cheapest.thumbnail && (
                        <img
                          src={cheapest.thumbnail}
                          alt={cheapest.title}
                          className="w-32 h-32 object-contain rounded-xl bg-white p-2"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-lg font-medium text-gray-800 mb-2 line-clamp-2">
                          {cheapest.title}
                        </p>
                        <div className="flex items-center gap-3 mb-3">
                          {cheapest.source && STORE_LOGOS[cheapest.source.toLowerCase()] && (
                            <img
                              src={STORE_LOGOS[cheapest.source.toLowerCase()]}
                              alt={cheapest.source}
                              className="h-6"
                            />
                          )}
                          <span className="text-sm text-gray-600">{cheapest.source}</span>
                        </div>
                        <p className="text-4xl font-bold text-emerald-600 mb-4">
                          {formatPrice(cheapest.price, cheapest.currency)}
                        </p>
                        <a
                          href={cheapest.url || cheapest.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium transition-all hover:shadow-lg"
                        >
                          <TrendingDown className="w-5 h-5" />
                          Ver producto
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Products Grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              >
                <AnimatePresence>
                  {sortedResults.map((item, index) => (
                    <motion.div
                      key={`${item.source}-${index}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className="group bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden transition-all duration-300"
                    >
                      {/* Ranking badge */}
                      <div className="absolute top-3 left-3 z-10 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        #{index + 1}
                      </div>

                      {/* Product image */}
                      <div className="relative h-48 bg-gray-50 overflow-hidden">
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            Sin imagen
                          </div>
                        )}
                      </div>

                      {/* Product info */}
                      <div className="p-4 space-y-2">
                        <p className="font-medium text-sm text-gray-800 line-clamp-2 min-h-[40px]">
                          {item.title}
                        </p>
                        
                        {/* Store logo */}
                        {item.source && STORE_LOGOS[item.source.toLowerCase()] && (
                          <img
                            src={STORE_LOGOS[item.source.toLowerCase()]}
                            alt={item.source}
                            className="h-4"
                          />
                        )}

                        {/* Price */}
                        <p className="text-xl font-bold text-emerald-600">
                          {formatPrice(item.price, item.currency)}
                        </p>

                        {/* View button */}
                        <a
                          href={item.url || item.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full text-center py-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg font-medium text-sm transition-all"
                        >
                          Ver detalles
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </>
          ) : (
            // Initial state
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Ingresa un producto para comparar precios
              </h3>
              <p className="text-gray-600">
                Busca iPhone, laptops, electrodomésticos y más
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg transition-all"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BuscarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-zinc-600">Cargando buscador...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
