import httpx
from typing import List, Dict

async def fetch_olimpica(q: str) -> List[Dict]:
    """
    Obtiene productos desde la API pública VTEX de Olímpica Colombia
    
    Args:
        q: Término de búsqueda
        
    Returns:
        Lista de productos con formato estandarizado
    """
    url = f"https://www.olimpica.com/api/catalog_system/pub/products/search?ft={q}"
    
    headers = {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "es-CO,es;q=0.9",
        "Referer": "https://www.olimpica.com/"
    }
    
    try:
        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            
            # Olímpica puede devolver 206 (Partial Content) como Éxito
            if response.status_code not in (200, 206):
                print(f"[Olímpica] Error {response.status_code}")
                return []
            
            data = response.json()
            
            if not isinstance(data, list):
                print(f"[Olímpica] Respuesta no es un array")
                return []
            
            products = []
            
            for item in data[:10]:  # Limitar a 10 productos
                try:
                    # Extraer datos del producto
                    product_name = item.get("productName", "")
                    link_text = item.get("linkText", "")
                    
                    if not product_name or not link_text:
                        continue
                    
                    # FILTRO: Excluir accesorios genéricos
                    product_lower = product_name.lower()
                    accesorios_excluidos = [
                        'cable', 'cargador', 'funda', 'estuche', 'protector',
                        'vidrio', 'mica', 'soporte', 'control remoto', 'teclado mouse',
                        'mini teclado', 'holder', 'base',
                        'mesa tv', 'mueble para tv', 'rack tv'
                    ]
                    
                    if any(acc in product_lower for acc in accesorios_excluidos):
                        # Verificar si la búsqueda es específicamente por el accesorio
                        query_lower = q.lower()
                        if not any(acc in query_lower for acc in accesorios_excluidos):
                            print(f"[Olímpica] Accesorio excluido: {product_name[:50]}")
                            continue
                    
                    # Construir URL del producto
                    permalink = f"https://www.olimpica.com/{link_text}/p"
                    
                    # Extraer precio del primer seller
                    items_list = item.get("items", [])
                    if not items_list:
                        continue
                    
                    first_item = items_list[0]
                    sellers = first_item.get("sellers", [])
                    if not sellers:
                        continue
                    
                    commercial_offer = sellers[0].get("commertialOffer", {})
                    price = commercial_offer.get("Price", 0)
                    
                    # Verificar disponibilidad
                    available_quantity = commercial_offer.get("AvailableQuantity", 0)
                    if price == 0 or available_quantity == 0:
                        continue
                    
                    # Extraer imagen
                    images = first_item.get("images", [])
                    thumbnail = images[0].get("imageUrl", "") if images else ""
                    
                    products.append({
                        "title": product_name,
                        "price": float(price),
                        "currency": "COP",
                        "url": permalink,
                        "thumbnail": thumbnail,
                        "source": "Olímpica"
                    })
                    
                except (KeyError, IndexError, TypeError) as e:
                    print(f"[Olímpica] Error parseando producto: {e}")
                    continue
            
            print(f"[Olímpica] Productos encontrados: {len(products)}")
            return products
            
    except httpx.TimeoutException:
        print("[Olímpica] Timeout en la solicitud")
        return []
    except httpx.HTTPError as e:
        print(f"[Olímpica] Error HTTP: {e}")
        return []
    except Exception as e:
        print(f"[Olímpica] Error inesperado: {e}")
        return []
