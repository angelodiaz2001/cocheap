import httpx
import re
from typing import List, Dict
from bs4 import BeautifulSoup

async def fetch_homecenter(q: str) -> List[Dict]:
    """
    Obtiene productos desde Homecenter Colombia usando scraping HTML
    
    Args:
        q: Término de búsqueda
        
    Returns:
        Lista de productos con formato estandarizado
    """
    url = f"https://www.homecenter.com.co/homecenter-co/search?Ntt={q}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-CO,es;q=0.9",
        "Referer": "https://www.homecenter.com.co/"
    }
    
    try:
        print(f"[Homecenter] Buscando: {q}")
        
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code != 200:
                print(f"[Homecenter] Error {response.status_code}")
                return []
            
            html = response.text
            soup = BeautifulSoup(html, 'html.parser')
            
            print(f"[Homecenter] HTML recibido: {len(html)} bytes")
            
            products = []
            
            # Homecenter usa selectores similares a Falabella (parte del mismo grupo)
            # Buscar productos en grid
            product_items = soup.select('.product-item, .product-card, .ProductCard, [data-test="product-card"]')
            
            if not product_items:
                # Intentar con otros selectores comunes
                product_items = soup.select('.item, .product, article[data-product]')
            
            print(f"[Homecenter] Elementos de producto encontrados: {len(product_items)}")
            
            for item in product_items[:10]:  # Limitar a 10
                try:
                    # Extraer título
                    title_elem = item.select_one('.product-name, .ProductCard__title, h3, h2, .title, a.name')
                    titulo = title_elem.get_text(strip=True) if title_elem else ""
                    
                    if not titulo or len(titulo) < 5:
                        continue
                    
                    # FILTRO: Verificar que el título contenga la búsqueda principal
                    titulo_lower = titulo.lower()
                    query_lower = q.lower()
                    
                    # Verificar que al menos una palabra clave de la búsqueda esté en el título
                    query_words = query_lower.split()
                    main_keyword = query_words[0] if query_words else ""
                    
                    if main_keyword and main_keyword not in titulo_lower:
                        continue
                    
                    # FILTRO: Excluir accesorios genéricos que no son el producto principal
                    accesorios_excluidos = [
                        'micrófono', 'microfono', 'soporte', 'cable', 'cargador',
                        'funda', 'estuche', 'protector', 'vidrio', 'mica',
                        'radio carro', 'radio para', 'pantalla carro',
                        'adaptador', 'auricular genérico', 'manos libres',
                        'holder', 'base', 'stand', 'tripode'
                    ]
                    
                    if any(accesorio in titulo_lower for accesorio in accesorios_excluidos):
                        print(f"[Homecenter] Accesorio excluido: {titulo[:50]}")
                        continue
                    
                    # Extraer URL
                    link_elem = item.select_one('a[href*="/product/"], a[href*="/p/"]')
                    if not link_elem:
                        link_elem = item.find('a')
                    
                    product_url = ""
                    if link_elem and link_elem.get('href'):
                        href = link_elem['href']
                        if href.startswith('http'):
                            product_url = href
                        elif href.startswith('/'):
                            product_url = f"https://www.homecenter.com.co{href}"
                    
                    if not product_url:
                        continue
                    
                    # Extraer precio
                    price_elem = item.select_one('.price, .ProductCard__price, [data-test="price"], .valor, span[class*="price"]')
                    if not price_elem:
                        # Buscar por texto que contenga $
                        price_text = item.get_text()
                        price_match = re.search(r'\$\s*([0-9.,]+)', price_text)
                        if price_match:
                            precio_str = price_match.group(1)
                        else:
                            continue
                    else:
                        precio_str = price_elem.get_text(strip=True)
                    
                    # Limpiar precio
                    precio_str = precio_str.replace('$', '').replace('.', '').replace(',', '').strip()
                    precio_str = ''.join(filter(str.isdigit, precio_str))
                    
                    if not precio_str:
                        continue
                    
                    precio = float(precio_str)
                    if precio == 0:
                        continue
                    
                    # Extraer imagen (intentar múltiples atributos)
                    img_elem = item.select_one('img')
                    imagen = ""
                    if img_elem:
                        # Intentar múltiples atributos comunes
                        imagen = (img_elem.get('src') or 
                                 img_elem.get('data-src') or 
                                 img_elem.get('data-lazy-src') or
                                 img_elem.get('data-original') or "")
                        if imagen and not imagen.startswith('http'):
                            if imagen.startswith('//'):
                                imagen = f"https:{imagen}"
                            elif imagen.startswith('/'):
                                imagen = f"https://www.homecenter.com.co{imagen}"
                    
                    products.append({
                        "title": titulo,
                        "price": precio,
                        "currency": "COP",
                        "url": product_url,
                        "thumbnail": imagen,
                        "source": "Homecenter"
                    })
                    
                except (KeyError, IndexError, TypeError, ValueError, AttributeError) as e:
                    print(f"[Homecenter] Error parseando producto: {e}")
                    continue
            
            print(f"[Homecenter] Productos válidos encontrados: {len(products)}")
            return products
            
    except httpx.TimeoutException:
        print("[Homecenter] Timeout en la solicitud")
        return []
    except httpx.HTTPError as e:
        print(f"[Homecenter] Error HTTP: {e}")
        return []
    except Exception as e:
        print(f"[Homecenter] Error inesperado: {e}")
        return []
