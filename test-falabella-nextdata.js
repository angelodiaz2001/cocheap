const axios = require('axios');
const fs = require('fs');

(async () => {
  const url = 'https://www.falabella.com.co/falabella-co/search?Ntt=buso';
  const response = await axios.get(url, {
    headers: { 
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    },
    timeout: 10000
  });
  
  const html = response.data;
  
  // Extraer __NEXT_DATA__
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
  
  if (match) {
    try {
      const data = JSON.parse(match[1]);
      const results = data.props?.pageProps?.results;
      
      if (results && Array.isArray(results)) {
        console.log(`\n✅ Encontrados ${results.length} productos en __NEXT_DATA__\n`);
        
        // Analizar primeros 3 productos
        results.slice(0, 3).forEach((product, i) => {
          console.log(`\n📦 Producto ${i}: ${product.displayName?.substring(0, 60)}`);
          console.log(`   SKU: ${product.skuId}`);
          console.log(`   Product ID: ${product.productId}`);
          console.log(`   Tipo: ${product.productType}`);
          console.log(`   URL: ${product.url?.substring(0, 80)}`);
          
          // Buscar campos relacionados con disponibilidad
          console.log('\n   Campos de disponibilidad:');
          console.log(`   - available: ${product.available}`);
          console.log(`   - inStock: ${product.inStock}`);
          console.log(`   - stock: ${product.stock}`);
          console.log(`   - isAvailable: ${product.isAvailable}`);
          console.log(`   - status: ${product.status}`);
          console.log(`   - sellable: ${product.sellable}`);
          
          // Ver todas las claves del objeto
          console.log('\n   Todas las claves del producto:');
          console.log('   ', Object.keys(product).join(', '));
          
          console.log('\n' + '='.repeat(70));
        });
        
        // Guardar JSON completo para análisis
        fs.writeFileSync('falabella-nextdata-sample.json', JSON.stringify(results[0], null, 2));
        console.log('\n💾 JSON completo del primer producto guardado en: falabella-nextdata-sample.json\n');
        
      } else {
        console.log('No se encontraron resultados en __NEXT_DATA__');
      }
    } catch (e) {
      console.log('Error parseando __NEXT_DATA__:', e.message);
    }
  } else {
    console.log('No se encontró __NEXT_DATA__');
  }
})();
