const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  const url = 'https://www.falabella.com.co/falabella-co/search?Ntt=iphone';
  const response = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    timeout: 10000
  });
  
  const $ = cheerio.load(response.data);
  const pods = $('.pod').slice(0, 10);
  
  console.log('=== BUSCAR INDICADORES DE NO DISPONIBILIDAD ===\n');
  
  pods.each((i, pod) => {
    const $pod = $(pod);
    const titulo = $pod.find('b.subTitle-rebrand').text().trim();
    
    // Buscar todos los textos dentro del pod
    const todoElTexto = $pod.text();
    
    // Buscar palabras clave
    const proximamente = todoElTexto.toLowerCase().includes('próximamente');
    const preventa = todoElTexto.toLowerCase().includes('pre-venta') || todoElTexto.toLowerCase().includes('preventa');
    const noDisponible = todoElTexto.toLowerCase().includes('no disponible');
    const agotado = todoElTexto.toLowerCase().includes('agotado');
    
    if (proximamente || preventa || noDisponible || agotado) {
      console.log(`❌ Producto ${i}: ${titulo.substring(0, 50)}`);
      console.log(`   Razón: ${proximamente ? 'Próximamente' : preventa ? 'Pre-venta' : noDisponible ? 'No disponible' : 'Agotado'}`);
      console.log('');
    } else {
      console.log(`✅ Producto ${i}: ${titulo.substring(0, 50)}`);
    }
  });
})();
