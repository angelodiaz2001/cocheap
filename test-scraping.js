const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  try {
    const url = 'https://listado.mercadolibre.com.co/iphone';
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-CO,es;q=0.9'
    };
    
    console.log('Descargando página...');
    const response = await axios.get(url, { headers, timeout: 10000 });
    console.log('Status:', response.status);
    console.log('Tamaño HTML:', response.data.length, 'bytes\n');
    
    const $ = cheerio.load(response.data);
    
    // Probar diferentes selectores
    console.log('=== ESTADÍSTICAS DE SELECTORES ===');
    console.log('Todos los <li>:', $('li').length);
    
    const conUiSearch = $('li').filter((_, el) => {
      const cls = $(el).attr('class') || '';
      return cls.includes('ui-search-layout__item');
    });
    console.log('Con "ui-search-layout__item":', conUiSearch.length);
    
    console.log('Con clase parcial [class*="ui-search"]:', $('li[class*="ui-search"]').length);
    console.log('Divs con ui-search-result:', $('.ui-search-result').length);
    
    // Ver primer producto
    console.log('\n=== PRIMER ELEMENTO ===');
    const firstLi = conUiSearch.first();
    if (firstLi.length) {
      console.log('Class:', firstLi.attr('class'));
      console.log('Tiene enlace <a>:', firstLi.find('a').length > 0);
      console.log('Tiene <h2>:', firstLi.find('h2').length > 0);
      
      const link = firstLi.find('a').first();
      if (link.length) {
        console.log('Texto del enlace:', link.text().trim().substring(0, 100));
        console.log('href:', link.attr('href')?.substring(0, 80));
      }
      
      const precio = firstLi.find('span[class*="andes-money-amount__fraction"]').first();
      if (precio.length) {
        console.log('Precio:', precio.text().trim());
      }
    } else {
      console.log('NO SE ENCONTRARON PRODUCTOS');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
