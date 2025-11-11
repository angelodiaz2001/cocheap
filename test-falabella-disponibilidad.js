const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  const url = 'https://www.falabella.com.co/falabella-co/search?Ntt=iphone';
  const response = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    timeout: 10000
  });
  
  const $ = cheerio.load(response.data);
  const pods = $('.pod').slice(0, 8);
  
  console.log('=== ANÁLISIS DE DISPONIBILIDAD ===\n');
  
  pods.each((i, pod) => {
    const $pod = $(pod);
    const titulo = $pod.find('b.subTitle-rebrand').text().trim().substring(0, 50);
    
    // Buscar indicadores de no disponibilidad
    const hasPrice = $pod.find('.copy10').length > 0;
    const precioText = $pod.find('.copy10').text().trim();
    
    // Buscar botón o link
    const hasButton = $pod.find('button').length > 0;
    
    // Ver si hay algún indicador visual de no disponible
    const htmlText = $pod.text().toLowerCase();
    const containsOutOfStock = htmlText.includes('agotado') || 
                               htmlText.includes('no disponible') ||
                               htmlText.includes('sin stock') ||
                               htmlText.includes('próximamente');
    
    // Verificar atributos data-*
    const dataSponsored = $pod.attr('data-sponsored');
    
    console.log(`Producto ${i}: ${titulo}`);
    console.log(`  - Tiene precio: ${hasPrice} (${precioText})`);
    console.log(`  - Tiene botón: ${hasButton}`);
    console.log(`  - Texto indica no disponible: ${containsOutOfStock}`);
    console.log(`  - data-sponsored: ${dataSponsored}`);
    
    // Ver clases del pod
    const classes = $pod.attr('class');
    console.log(`  - Clases: ${classes}`);
    console.log('');
  });
})();
