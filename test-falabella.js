const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  try {
    const url = 'https://www.falabella.com.co/falabella-co/search?Ntt=iphone';
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    };
    
    console.log('Descargando página de Falabella...');
    const response = await axios.get(url, { headers, timeout: 10000 });
    console.log('Status:', response.status);
    console.log('Tamaño HTML:', response.data.length, 'bytes\n');
    
    const $ = cheerio.load(response.data);
    
    // Buscar diferentes selectores posibles
    console.log('=== SELECTORES ===');
    console.log('.pod:', $('.pod').length);
    console.log('.pod-details:', $('.pod-details').length);
    console.log('.product-card:', $('.product-card').length);
    console.log('[data-testid="pod"]:', $('[data-testid="pod"]').length);
    console.log('[class*="product"]:', $('[class*="product"]').length);
    
    // Ver el primer producto que encuentre
    console.log('\n=== PRIMER ELEMENTO .pod ===');
    const firstPod = $('.pod').first();
    if (firstPod.length) {
      console.log('Classes:', firstPod.attr('class'));
      console.log('HTML (primeros 500 chars):');
      console.log(firstPod.html()?.substring(0, 500));
      
      // Buscar título
      console.log('\n=== Búsqueda de título ===');
      console.log('.pod-subTitle:', firstPod.find('.pod-subTitle').text().trim());
      console.log('b.subTitle-rebrand:', firstPod.find('b.subTitle-rebrand').text().trim());
      console.log('a[title]:', firstPod.find('a[title]').attr('title'));
      
      // Buscar URL
      console.log('\n=== Búsqueda de URL ===');
      const primerA = firstPod.find('a').first();
      console.log('Primer <a> href:', primerA.attr('href'));
      console.log('Primer <a> class:', primerA.attr('class'));
      console.log('Total <a> en pod:', firstPod.find('a').length);
      firstPod.find('a').each((i, a) => {
        const href = $(a).attr('href');
        if (href && href.includes('/product/')) {
          console.log(`  a[${i}] con /product/: ${href.substring(0, 80)}`);
        }
      });
      
      // Buscar precio
      console.log('\n=== Búsqueda de precio ===');
      console.log('.prices-main-price:', firstPod.find('.prices-main-price').text().trim());
      console.log('.copy10:', firstPod.find('.copy10').text().trim());
      console.log('[class*="price"]:', firstPod.find('[class*="price"]').first().text().trim());
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
