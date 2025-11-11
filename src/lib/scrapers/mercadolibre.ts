import axios from 'axios';
import * as cheerio from 'cheerio';

interface MercadoLibreProduct {
  title: string;
  price: number;
  currency: string;
  url: string;
  image: string;
  store: string;
}

export async function fetchMercadoLibre(query: string): Promise<MercadoLibreProduct[]> {
  const url = `https://listado.mercadolibre.com.co/${query.replace(/ /g, '-')}`;
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-CO,es;q=0.9',
    'Referer': 'https://www.mercadolibre.com.co/'
  };

  try {
    console.log(`[MercadoLibre] Buscando: ${query}`);
    const response = await axios.get(url, { headers, timeout: 15000 });
    
    if (response.status !== 200) {
      console.error(`[MercadoLibre] Error ${response.status}`);
      return [];
    }

    // Debug: verificar tamaño del HTML
    const htmlSize = response.data.length;
    console.log(`[MercadoLibre] HTML recibido: ${htmlSize} bytes`);
    
    if (htmlSize < 50000) {
      console.log('[MercadoLibre] HTML muy pequeño, posible bloqueo');
      return [];
    }
    
    const $ = cheerio.load(response.data);
    const items: MercadoLibreProduct[] = [];

    const allLi = $('li');
    console.log(`[MercadoLibre] Total <li> en página: ${allLi.length}`);
    
    let productCount = 0;
    allLi.each((_, el) => {
      const $el = $(el);
      const cls = $el.attr('class') || '';
      
      if (!cls.includes('ui-search-layout__item') || cls.includes('intervention')) {
        return;
      }
      
      if (productCount >= 10) return;
      
      try {
        let link = $el.find('a[href*="mercadolibre"]').first();
        if (!link.length) {
          link = $el.find('a[href]').first();
        }
        
        if (!link.length) return;

        let titulo = link.text().trim();
        if (!titulo || titulo.length < 10) {
          titulo = $el.find('h2').text().trim();
        }
        if (!titulo || titulo.length < 10) return;

        const url = link.attr('href') || '';
        if (!url) return;

        const precioElem = $el.find('span[class*="andes-money-amount__fraction"]').first();
        let precio = 0;
        if (precioElem.length) {
          const precioText = precioElem.text().trim().replace(/\./g, '').replace(/,/g, '.');
          precio = parseFloat(precioText.replace(/[^\d.]/g, ''));
        }

        if (precio === 0) return;

        const imgElem = $el.find('img').first();
        const imagen = imgElem.attr('data-src') || imgElem.attr('src') || '';

        items.push({
          title: titulo,
          price: precio,
          currency: 'COP',
          url: url,
          image: imagen,
          store: 'mercadolibre'
        });
        
        productCount++;
      } catch (err) {
        console.warn('[MercadoLibre] Error parseando producto:', err);
      }
    });

    console.log(`[MercadoLibre] Productos encontrados: ${items.length}`);
    return items;

  } catch (error) {
    console.error('[MercadoLibre] Error en scraping:', error);
    return [];
  }
}
