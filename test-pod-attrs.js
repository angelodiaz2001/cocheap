const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  const url = 'https://www.falabella.com.co/falabella-co/search?Ntt=iphone';
  const response = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    timeout: 10000
  });
  
  const $ = cheerio.load(response.data);
  const firstPod = $('.pod').first();
  
  console.log('=== ATRIBUTOS DEL POD ===');
  const attrs = firstPod.get(0).attribs;
  for (const [key, value] of Object.entries(attrs)) {
    console.log(`  ${key}: ${value.substring(0, 150)}`);
  }
  
  console.log('\n=== DATA ATTRIBUTES ===');
  const dataAttrs = Object.keys(attrs).filter(k => k.startsWith('data-'));
  if (dataAttrs.length === 0) {
    console.log('  No hay data-* attributes');
  } else {
    dataAttrs.forEach(attr => {
      console.log(`  ${attr}: ${attrs[attr]}`);
    });
  }
  
  // Intentar construir URL desde el SKU o ID
  console.log('\n=== POSIBLES IDs/SKUs ===');
  const podId = firstPod.attr('id');
  console.log('  id:', podId);
  
  // Buscar en el HTML si hay algún link relativo
  const htmlContent = firstPod.html();
  const linkMatches = htmlContent.match(/\/falabella-co\/product\/[^"'\s]+/g);
  if (linkMatches) {
    console.log('\n=== LINKS ENCONTRADOS EN HTML ===');
    linkMatches.slice(0, 3).forEach(link => {
      console.log(`  ${link}`);
    });
  }
})();
