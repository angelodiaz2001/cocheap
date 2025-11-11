const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  const url = 'https://www.falabella.com.co/falabella-co/search?Ntt=buso';
  const response = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    timeout: 10000
  });
  
  const $ = cheerio.load(response.data);
  const pods = $('.pod').slice(0, 5);
  
  console.log('=== ANÁLISIS PROFUNDO DE DISPONIBILIDAD ===\n');
  
  pods.each((i, pod) => {
    const $pod = $(pod);
    const titulo = $pod.find('b.subTitle-rebrand').text().trim().substring(0, 60);
    const sku = $pod.attr('id')?.match(/(\d+)$/)?.[1];
    
    console.log(`\n📦 Producto ${i}: ${titulo}`);
    console.log(`   SKU: ${sku}`);
    
    // Buscar todos los atributos data-*
    console.log('\n   Data attributes:');
    const attrs = $pod.get(0).attribs;
    Object.keys(attrs).filter(k => k.startsWith('data-')).forEach(key => {
      console.log(`     ${key}: ${attrs[key]}`);
    });
    
    // Buscar clases relacionadas con stock
    const classes = $pod.attr('class');
    console.log(`\n   Clases: ${classes}`);
    
    // Buscar elementos relacionados con stock/disponibilidad
    console.log('\n   Elementos de disponibilidad:');
    const stockInfo = $pod.find('[class*="stock"], [class*="disponib"], [class*="available"]');
    if (stockInfo.length > 0) {
      stockInfo.each((j, el) => {
        console.log(`     - ${$(el).attr('class')}: "${$(el).text().trim()}"`);
      });
    } else {
      console.log('     (No se encontraron elementos de stock)');
    }
    
    // Ver si hay algún span o div oculto con info de disponibilidad
    const todosLosSpans = $pod.find('span, div').filter((_, el) => {
      const text = $(el).text().toLowerCase();
      return text.includes('disponib') || text.includes('agotado') || text.includes('stock');
    });
    
    if (todosLosSpans.length > 0) {
      console.log('\n   Textos relacionados con disponibilidad:');
      todosLosSpans.each((j, el) => {
        console.log(`     - "${$(el).text().trim()}"`);
      });
    }
    
    console.log('\n' + '='.repeat(70));
  });
})();
