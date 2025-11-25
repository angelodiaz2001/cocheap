import httpx
import json
import re
from typing import List, Dict

async def fetch_alkosto(q: str) -> List[Dict]:
    """
    Obtiene productos desde Alkosto Colombia usando scraping del JSON embebido
    
    Args:
        q: Término de búsqueda
        
    Returns:
        Lista de productos con formato estandarizado
    """
    # Alkosto usa parámetro de búsqueda
    url = f"https://www.alkosto.com/buscar?Ntt={q}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-CO,es;q=0.9",
        "Referer": "https://www.alkosto.com/"
    }
    
    try:
        print(f"[Alkosto] Buscando: {q}")
        
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code != 200:
                print(f"[Alkosto] Error {response.status_code}")
                return []
            
            html = response.text
            html_size = len(html)
            print(f"[Alkosto] HTML recibido: {html_size} bytes")
            
            if html_size < 10000:
                print("[Alkosto] HTML muy pequeño, posible bloqueo")
                return []
            
            # Buscar datos de productos en el HTML (Alkosto usa VTEX similar a Éxito)
            # Intentar encontrar __RUNTIME__ o datos JSON embebidos
            products_data = []
            
            # Patrón 1: Buscar window.__RUNTIME__ 
            runtime_match = re.search(r'window\.__RUNTIME__\s*=\s*({.*?});?\s*</script>', html, re.DOTALL)
            if runtime_match:
                try:
                    runtime_data = json.loads(runtime_match.group(1))
                    # Navegar por la estructura para encontrar productos
                    # La estructura varía, pero típicamente está en route.context o similar
                    print("[Alkosto] Encontrado __RUNTIME__, parseando...")
                    # Esto requeriría análisis más profundo de la estructura específica de Alkosto
                except json.JSONDecodeError:
                    pass
            
            # Patrón 2: Buscar __NEXT_DATA__ (si usan Next.js)
            next_data_match = re.search(
                r'<script id="__NEXT_DATA__" type="application/json">([\s\S]*?)</script>',
                html
            )
            
            if next_data_match:
                try:
                    next_data = json.loads(next_data_match.group(1))
                    productos = next_data.get("props", {}).get("pageProps", {}).get("products", [])
                    if not productos:
                        # Intentar otras rutas comunes
                        productos = next_data.get("props", {}).get("pageProps", {}).get("searchResult", {}).get("products", [])
                    products_data = productos
                    print(f"[Alkosto] Productos encontrados en __NEXT_DATA__: {len(products_data)}")
                except json.JSONDecodeError as e:
                    print(f"[Alkosto] Error parseando __NEXT_DATA__: {e}")
            
            if not products_data:
                print("[Alkosto] No se pudieron extraer productos del HTML")
                return []
            
            items = []
            
            for product in products_data[:10]:  # Limitar a 10
                try:
                    # Extraer título
                    titulo = product.get("productName") or product.get("name") or ""
                    if not titulo or len(titulo) < 5:
                        continue
                    
                    # Extraer precio
                    precio = 0
                    # Intentar múltiples ubicaciones comunes para el precio
                    if "items" in product and product["items"]:
                        first_item = product["items"][0]
                        if "sellers" in first_item and first_item["sellers"]:
                            offer = first_item["sellers"][0].get("commertialOffer", {})
                            precio = offer.get("Price", 0)
                    
                    if precio == 0 and "price" in product:
                        precio = product["price"]
                    
                    if precio == 0:
                        continue
                    
                    # Construir URL
                    link_text = product.get("linkText", "")
                    if link_text:
                        product_url = f"https://www.alkosto.com/{link_text}/p"
                    else:
                        product_id = product.get("productId") or product.get("id", "")
                        product_url = f"https://www.alkosto.com/p/{product_id}" if product_id else ""
                    
                    if not product_url:
                        continue
                    
                    # Extraer imagen
                    imagen = ""
                    if "items" in product and product["items"]:
                        images = product["items"][0].get("images", [])
                        if images:
                            imagen = images[0].get("imageUrl", "")
                    
                    if not imagen and "image" in product:
                        imagen = product["image"]
                    
                    items.append({
                        "title": titulo,
                        "price": float(precio),
                        "currency": "COP",
                        "url": product_url,
                        "thumbnail": imagen,
                        "source": "Alkosto"
                    })
                    
                except (KeyError, IndexError, TypeError, ValueError) as e:
                    print(f"[Alkosto] Error parseando producto: {e}")
                    continue
            
            print(f"[Alkosto] Productos válidos encontrados: {len(items)}")
            return items
            
    except httpx.TimeoutException:
        print("[Alkosto] Timeout en la solicitud")
        return []
    except httpx.HTTPError as e:
        print(f"[Alkosto] Error HTTP: {e}")
        return []
    except Exception as e:
        print(f"[Alkosto] Error inesperado: {e}")
        return []
