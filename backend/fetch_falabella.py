import httpx
import json
import re
from typing import List, Dict

async def fetch_falabella(q: str) -> List[Dict]:
    """
    Obtiene productos desde Falabella Colombia usando scraping del JSON embebido
    
    Args:
        q: Término de búsqueda
        
    Returns:
        Lista de productos con formato estandarizado
    """
    url = f"https://www.falabella.com.co/falabella-co/search?Ntt={q}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-CO,es;q=0.9",
        "Referer": "https://www.falabella.com.co/"
    }
    
    try:
        print(f"[Falabella] Buscando: {q}")
        
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code != 200:
                print(f"[Falabella] Error {response.status_code}")
                return []
            
            html = response.text
            html_size = len(html)
            print(f"[Falabella] HTML recibido: {html_size} bytes")
            
            if html_size < 50000:
                print("[Falabella] HTML muy pequeño, posible bloqueo")
                return []
            
            # Extraer __NEXT_DATA__ que contiene información precisa de disponibilidad
            next_data_match = re.search(
                r'<script id="__NEXT_DATA__" type="application/json">([\s\S]*?)</script>',
                html
            )
            
            if not next_data_match:
                print("[Falabella] No se encontró __NEXT_DATA__")
                return []
            
            next_data = json.loads(next_data_match.group(1))
            productos = next_data.get("props", {}).get("pageProps", {}).get("results", [])
            
            print(f"[Falabella] Productos encontrados en JSON: {len(productos)}")
            
            items = []
            modelos_futuros = [
                'iphone 17', 'iphone air', 'iphone 16e',
                'iphone 18', 'iphone 19', 'iphone 20'
            ]
            
            for product in productos:
                try:
                    # Limitar a 10 productos válidos
                    if len(items) >= 10:
                        break
                    
                    # Título
                    titulo = product.get("displayName", "")
                    if not titulo or len(titulo) < 10:
                        continue
        
                    # FILTRO 0: Excluir accesorios genéricos si no son parte de la búsqueda
                    titulo_lower = titulo.lower()
                    query_lower = q.lower()
                    accesorios_excluidos = [
                        'cable', 'cargador', 'funda', 'estuche', 'protector',
                        'vidrio templado', 'mica', 'soporte', 'holder', 'base'
                    ]
        
                    es_accesorio = any(acc in titulo_lower for acc in accesorios_excluidos)
                    busca_accesorio = any(acc in query_lower for acc in accesorios_excluidos)
        
                    if es_accesorio and not busca_accesorio:
                        print(f"[Falabella] Accesorio excluido: {titulo[:50]}")
                        continue

                    # FILTRO 1: Verificar disponibilidad real usando variants
                    variants = product.get("variants", [])
                    tiene_variante_disponible = False
                    
                    for variant in variants:
                        options = variant.get("options", [])
                        for option in options:
                            # Verificar si es comprable
                            if option.get("isPurchaseable") is True:
                                tiene_variante_disponible = True
                                break
                            # O si tiene al menos una talla disponible
                            sizes = option.get("sizes", [])
                            if any(size.get("available") is True for size in sizes):
                                tiene_variante_disponible = True
                                break
                        if tiene_variante_disponible:
                            break
                    
                    if not tiene_variante_disponible:
                        print(f"[Falabella] Producto omitido (sin stock): {titulo[:50]}")
                        continue
                    
                    # FILTRO 2: Excluir modelos futuros/ficticios
                    titulo_lower = titulo.lower()
                    if any(modelo in titulo_lower for modelo in modelos_futuros):
                        print(f"[Falabella] Producto omitido (modelo futuro): {titulo[:50]}")
                        continue
                    
                    # URL
                    product_url = product.get("url", "")
                    if not product_url:
                        continue
                    
                    # Precio - del array de precios
                    prices = product.get("prices", [])
                    main_price = None
                    for p in prices:
                        if p.get("type") == "internetPrice":
                            main_price = p
                            break
                    if not main_price and prices:
                        main_price = prices[0]
                    
                    if not main_price or not main_price.get("price"):
                        continue
                    
                    precio_text = main_price["price"][0] if isinstance(main_price["price"], list) else str(main_price["price"])
                    precio_text = precio_text.replace("$", "").replace(".", "").replace(",", "")
                    
                    try:
                        precio = float(precio_text)
                    except ValueError:
                        continue
                    
                    if precio == 0:
                        continue
                    
                    # Imagen - del array de mediaUrls
                    media_urls = product.get("mediaUrls", [])
                    imagen = media_urls[0] if media_urls else ""
                    if imagen and not imagen.startswith("http"):
                        imagen = f"https://media.falabella.com.co{imagen}"
                    
                    items.append({
                        "title": titulo,
                        "price": precio,
                        "currency": "COP",
                        "url": product_url,
                        "thumbnail": imagen,
                        "source": "Falabella"
                    })
                    
                except (KeyError, IndexError, TypeError, ValueError) as e:
                    print(f"[Falabella] Error parseando producto: {e}")
                    continue
            
            print(f"[Falabella] Productos encontrados: {len(items)}")
            return items
            
    except httpx.TimeoutException:
        print("[Falabella] Timeout en la solicitud")
        return []
    except httpx.HTTPError as e:
        print(f"[Falabella] Error HTTP: {e}")
        return []
    except Exception as e:
        print(f"[Falabella] Error inesperado: {e}")
        return []
