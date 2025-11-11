const axios = require('axios');

(async () => {
  const url = 'https://www.falabella.com.co/falabella-co/search?Ntt=buso';
  const response = await axios.get(url, {
    headers: { 
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    timeout: 10000
  });
  
  const html = response.data;
  
  console.log('=== BUSCANDO DATOS JSON EMBEBIDOS ===\n');
  
  // Buscar scripts con JSON
  const scriptMatches = html.match(/<script[^>]*>(.*?)<\/script>/gs);
  
  if (scriptMatches) {
    scriptMatches.forEach((script, i) => {
      // Buscar JSON con información de productos
      if (script.includes('productData') || 
          script.includes('products') || 
          script.includes('items') ||
          script.includes('available') ||
          script.includes('stock')) {
        
        console.log(`\nScript ${i} (primeros 500 caracteres):`);
        console.log(script.substring(0, 500));
        console.log('\n' + '='.repeat(70));
      }
    });
  }
  
  // Buscar window.__NEXT_DATA__ o __INITIAL_STATE__
  const nextDataMatch = html.match(/window\.__NEXT_DATA__\s*=\s*({.*?})\s*<\/script>/s);
  if (nextDataMatch) {
    console.log('\n📦 Encontrado window.__NEXT_DATA__');
    try {
      const data = JSON.parse(nextDataMatch[1]);
      console.log('Claves principales:', Object.keys(data));
      console.log('\nEstructura (primeros niveles):', JSON.stringify(data, null, 2).substring(0, 1000));
    } catch (e) {
      console.log('Error parseando JSON');
    }
  }
  
  // Buscar __INITIAL_STATE__
  const initialStateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/s);
  if (initialStateMatch) {
    console.log('\n📦 Encontrado window.__INITIAL_STATE__');
    try {
      const data = JSON.parse(initialStateMatch[1]);
      console.log('Claves principales:', Object.keys(data));
    } catch (e) {
      console.log('Error parseando JSON');
    }
  }
})();
