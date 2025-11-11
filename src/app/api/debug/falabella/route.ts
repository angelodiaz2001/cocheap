import { NextRequest, NextResponse } from 'next/server';
import { fetchFalabella } from '@/lib/scrapers/falabella';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || 'iphone';

  console.log(`[Debug Falabella] Buscando: ${query}`);

  try {
    const items = await fetchFalabella(query);

    return NextResponse.json({
      query,
      total: items.length,
      items
    });

  } catch (error: any) {
    console.error('[Debug Falabella] Error:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
