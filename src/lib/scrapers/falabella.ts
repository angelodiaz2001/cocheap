import axios from 'axios';

interface FalabellaProduct {
  title: string;
  price: number;
  currency: string;
  url: string;
  image: string;
  store: string;
}

export async function fetchFalabella(query: string): Promise<FalabellaProduct[]> {
  const url = `https://www.falabella.com.co/falabella-co/search?Ntt=${encodeURIComponent(query)}`;
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-CO,es;q=0.9',
    'Referer': 'https://www.falabella.com.co/'
  };

  try {
    console.log(`[Falabella] Buscando: ${query}`);
    const response = await axios.get(url, { headers, timeout: 15000 });
    
    if (response.status !== 200) {
      console.error(`[Falabella] Error ${response.status}`);
      return [];
    }

    const htmlSize = response.data.length;
    console.log(`[Falabella] HTML recibido: ${htmlSize} bytes`);
    
    if (htmlSize < 50000) {
      console.log('[Falabella] HTML muy pequeño, posible bloqueo');
      return [];
    }

    // Extraer __NEXT_DATA__ que contiene información precisa de disponibilidad
    const html = response.data;
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    
    if (!nextDataMatch) {
      console.error('[Falabella] No se encontró __NEXT_DATA__');
      return [];
    }

    const nextData = JSON.parse(nextDataMatch[1]);
    const productos = nextData?.props?.pageProps?.results || [];
    
    console.log(`[Falabella] Productos encontrados en JSON: ${productos.length}`);
    const items: FalabellaProduct[] = [];

    for (const product of productos) {
      try {
        // Limitar a 10 productos válidos
        if (items.length >= 10) break;
        
        // Título
        const titulo = product.displayName || '';
        if (!titulo || titulo.length < 10) continue;

        // FILTRO 1: Verificar disponibilidad real usando variants
        // Un producto está disponible si tiene al menos una variante comprable
        const variants = product.variants || [];
        let tieneVarianteDisponible = false;
        
        for (const variant of variants) {
          const options = variant.options || [];
          for (const option of options) {
            // Verificar si es comprable
            if (option.isPurchaseable === true) {
              tieneVarianteDisponible = true;
              break;
            }
            // O si tiene al menos una talla disponible
            const sizes = option.sizes || [];
            if (sizes.some((size: any) => size.available === true)) {
              tieneVarianteDisponible = true;
              break;
            }
          }
          if (tieneVarianteDisponible) break;
        }
        
        if (!tieneVarianteDisponible) {
          console.log(`[Falabella] Producto omitido (sin stock): ${titulo.substring(0, 50)}`);
          continue;
        }

        // FILTRO 2: Excluir modelos futuros/ficticios
        const tituloLower = titulo.toLowerCase();
        const modelosFuturos = [
          'iphone 17', 'iphone air', 'iphone 16e',
          'iphone 18', 'iphone 19', 'iphone 20'
        ];
        
        if (modelosFuturos.some(modelo => tituloLower.includes(modelo))) {
          console.log(`[Falabella] Producto omitido (modelo futuro): ${titulo.substring(0, 50)}`);
          continue;
        }

        // URL
        const productUrl = product.url || '';
        if (!productUrl) continue;

        // Precio - del array de precios
        const prices = product.prices || [];
        const mainPrice = prices.find((p: any) => p.type === 'internetPrice') || prices[0];
        if (!mainPrice || !mainPrice.price || !mainPrice.price[0]) continue;
        
        const precioText = mainPrice.price[0]
          .replace(/\$/g, '')
          .replace(/\./g, '')
          .replace(/,/g, '');
        const precio = parseFloat(precioText);
        
        if (precio === 0 || isNaN(precio)) continue;

        // Imagen - del array de mediaUrls
        const mediaUrls = product.mediaUrls || [];
        let imagen = mediaUrls[0] || '';
        if (imagen && !imagen.startsWith('http')) {
          imagen = `https://media.falabella.com.co${imagen}`;
        }

        items.push({
          title: titulo,
          price: precio,
          currency: 'COP',
          url: productUrl,
          image: imagen,
          store: 'falabella'
        });
      } catch (err) {
        console.warn('[Falabella] Error parseando producto:', err);
      }
    }

    console.log(`[Falabella] Productos encontrados: ${items.length}`);
    return items;

  } catch (error: any) {
    console.error('[Falabella] Error en scraping:', error.message);
    return [];
  }
}
