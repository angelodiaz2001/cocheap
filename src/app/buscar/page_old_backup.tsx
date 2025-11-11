"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, TrendingDown, ArrowUpDown } from "lucide-react";

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

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [cheapest, setCheapest] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearchWithQuery = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      // Usar backend en puerto 8000
      const res = await fetch(`http://localhost:8000/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      
      // Ordenar resultados por precio (menor a mayor)
      const sortedItems = (data.items || []).sort((a: any, b: any) => a.price - b.price);
      
      setResults(sortedItems);
      setCheapest(data.cheapest || null);
    } catch (error) {
      console.error('Error buscando:', error);
    }
    setLoading(false);
  };

  // Leer query parameter y ejecutar búsqueda automática
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      // Ejecutar búsqueda automáticamente
      handleSearchWithQuery(q);
    }
  }, [searchParams]);

  const handleSearch = async () => {
    handleSearchWithQuery(query);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Fijo */}
      <div className="bg-white shadow-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                🛒 Comparador de Precios Colombia
              </h1>
            </div>
            {results.length > 0 && (
              <div className="hidden md:flex gap-4 text-sm text-gray-600">
                <span className="font-semibold">{results.length} productos</span>
              </div>
            )}
          </div>
          
          {/* Buscador */}
          <div className="flex gap-2 max-w-2xl">
            <Input
              placeholder="Buscar producto (ej: iPhone, laptop, audífonos)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading} size="lg">
              <Search className="w-4 h-4 mr-2" />
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-8 mt-2">
        {/* Producto más barato */}
        {cheapest && (
          <Card className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
            <div className="flex items-start gap-4">
              <TrendingDown className="w-8 h-8 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-green-800 mb-2">¡Mejor Precio!</h2>
                <div className="flex items-start gap-4">
                  {(cheapest.image || cheapest.thumbnail) && (
                    <img
                      src={cheapest.image || cheapest.thumbnail}
                      alt={cheapest.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{cheapest.title}</h3>
                    <span className={`inline-block text-xs font-medium tracking-wide uppercase px-2 py-1 rounded mb-2 ${
                      (cheapest.store === 'mercadolibre' || cheapest.source === 'mercadolibre') ? 'bg-yellow-100 text-yellow-800' :
                      (cheapest.store === 'falabella' || cheapest.source === 'falabella') ? 'bg-green-100 text-green-800' :
                      cheapest.source === 'exito' ? 'bg-red-100 text-red-800' :
                      cheapest.source === 'olimpica' ? 'bg-purple-100 text-purple-800' :
                      cheapest.source === 'homecenter' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {cheapest.store || cheapest.source}
                    </span>
                    <p className="text-2xl font-bold text-green-600 mb-3">
                      {formatPrice(cheapest.price, cheapest.currency)}
                    </p>
                    <a
                      href={cheapest.url || cheapest.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded inline-block text-center transition-colors"
                    >
                      Ver producto
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Grid de productos */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Buscando productos...</p>
          </div>
        )}

        {!loading && results.length === 0 && query && (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No se encontraron resultados</p>
            <p className="text-gray-400 text-sm">Intenta con otra búsqueda</p>
          </div>
        )}

        {!loading && results.length === 0 && !query && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Busca un producto para comparar precios</p>
            <p className="text-gray-400 text-sm">Ejemplo: iPhone, laptop, audífonos</p>
          </div>
        )}

        {/* Indicador de ordenamiento */}
        {results.length > 0 && (
          <div className="container mx-auto px-6 mb-4">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-blue-50 rounded-lg py-2 px-4">
              <ArrowUpDown className="w-4 h-4 text-blue-600" />
              <span>Ordenado por precio: <strong>menor a mayor</strong></span>
            </div>
          </div>
        )}

        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((item, i) => (
              <Card 
                key={i} 
                className="overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-300 relative"
              >
                {/* Badge de posición */}
                {i < 3 && (
                  <div className={`absolute top-2 left-2 z-10 ${
                    i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-300' : 'bg-orange-400'
                  } text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-md`}>
                    #{i + 1}
                  </div>
                )}
                
                {/* Logo de la tienda */}
                <div className="absolute top-2 right-2 z-10 bg-white rounded-md p-1 shadow-sm">
                  {(item.store === 'mercadolibre' || item.source === 'mercadolibre') && (
                    <img 
                      src="/icons/mercadolibre.png" 
                      alt="MercadoLibre" 
                      className="w-7 h-7 object-contain"
                      title="MercadoLibre"
                    />
                  )}
                  {(item.store === 'falabella' || item.source === 'falabella') && (
                    <img 
                      src="/icons/falabella.png" 
                      alt="Falabella" 
                      className="w-7 h-7 object-contain"
                      title="Falabella"
                    />
                  )}
                  {item.source === 'exito' && (
                    <img 
                      src="/icons/exito.png" 
                      alt="Éxito" 
                      className="w-7 h-7 object-contain"
                      title="Éxito"
                    />
                  )}
                  {item.source === 'olimpica' && (
                    <img 
                      src="/icons/olimpica.png" 
                      alt="Olímpica" 
                      className="w-7 h-7 object-contain"
                      title="Olímpica"
                    />
                  )}
                  {item.source === 'homecenter' && (
                    <img 
                      src="/icons/homecenter.png" 
                      alt="Homecenter" 
                      className="w-7 h-7 object-contain"
                      title="Homecenter"
                    />
                  )}
                </div>

                {(item.image || item.thumbnail) && (
                  <img
                    src={item.image || item.thumbnail}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                    {item.title}
                  </h3>
                  
                  {/* Badge de tienda */}
                  <span className={`inline-block text-xs font-medium tracking-wide uppercase px-2 py-1 rounded mb-2 ${
                    (item.store === 'mercadolibre' || item.source === 'mercadolibre') ? 'bg-yellow-100 text-yellow-800' :
                    (item.store === 'falabella' || item.source === 'falabella') ? 'bg-green-100 text-green-800' :
                    item.source === 'exito' ? 'bg-red-100 text-red-800' :
                    item.source === 'olimpica' ? 'bg-purple-100 text-purple-800' :
                    item.source === 'homecenter' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {item.store || item.source}
                  </span>
                  
                  <p className="text-2xl font-bold text-indigo-600 mb-3">
                    {formatPrice(item.price, item.currency)}
                  </p>
                  <div className="flex items-center justify-between">
                    <a
                      href={item.url || item.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                    >
                      Ver detalles →
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-zinc-600">Cargando...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
