import { NextRequest, NextResponse } from 'next/server';
import { fetchMercadoLibre } from '@/lib/scrapers/mercadolibre';
import { fetchFalabella } from '@/lib/scrapers/falabella';

interface Product {
  title: string;
  price: number;
  currency: string;
  store: string;
  url: string;
  image: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json(
      { error: 'Parámetro "q" requerido' },
      { status: 400 }
    );
  }

  try {
    // Buscar en paralelo en MercadoLibre y Falabella
    const [mlItems, falabellaItems] = await Promise.all([
      fetchMercadoLibre(query),
      fetchFalabella(query)
    ]);

    // Combinar resultados
    const items = [...mlItems, ...falabellaItems];

    // Encontrar el más barato
    const cheapest = items.length > 0
      ? items.reduce((min, item) => item.price < min.price ? item : min)
      : null;

    return NextResponse.json({
      items,
      cheapest,
      stats: {
        total: items.length,
        mercadolibre: mlItems.length,
        falabella: falabellaItems.length
      }
    });

  } catch (error) {
    console.error('Error en búsqueda:', error);
    return NextResponse.json(
      { error: 'Error al buscar productos' },
      { status: 500 }
    );
  }
}
