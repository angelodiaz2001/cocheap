# backend/main.py
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import os, asyncio, httpx, logging, json, pathlib, time, re
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from fetch_exito import fetch_exito
from fetch_falabella import fetch_falabella
from fetch_olimpica import fetch_olimpica
from fetch_alkosto import fetch_alkosto
from fetch_homecenter import fetch_homecenter

load_dotenv()
logger = logging.getLogger("uvicorn.error")

# --- variables y helpers OAuth MercadoLibre
MELI_CLIENT_ID = os.getenv("MELI_CLIENT_ID", "")
MELI_CLIENT_SECRET = os.getenv("MELI_CLIENT_SECRET", "")
MELI_REDIRECT_URI = os.getenv("MELI_REDIRECT_URI", "")  # << debe ser HTTPS del túnel

TOKEN_PATH = pathlib.Path("backend/.meli_token.json")
MELI_TOKEN_MEM = {"access_token": "", "expires_at": 0, "refresh_token": ""}

def load_meli_token():
    if TOKEN_PATH.exists():
        MELI_TOKEN_MEM.update(json.loads(TOKEN_PATH.read_text()))

def save_meli_token(data):
    TOKEN_PATH.write_text(json.dumps(data, indent=2))
    MELI_TOKEN_MEM.update(data)

load_meli_token()

async def get_valid_meli_token():
    # usa token si no está por expirar
    if MELI_TOKEN_MEM.get("access_token") and time.time() < MELI_TOKEN_MEM.get("expires_at", 0) - 60:
        return MELI_TOKEN_MEM["access_token"]
    # refresca si hay refresh_token
    if MELI_TOKEN_MEM.get("refresh_token"):
        async with httpx.AsyncClient(timeout=12) as client:
            r = await client.post(
                "https://api.mercadolibre.com/oauth/token",
                data={
                    "grant_type": "refresh_token",
                    "client_id": MELI_CLIENT_ID,
                    "client_secret": MELI_CLIENT_SECRET,
                    "refresh_token": MELI_TOKEN_MEM["refresh_token"],
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            r.raise_for_status()
            tok = r.json()
            save_meli_token({
                "access_token": tok["access_token"],
                "refresh_token": tok.get("refresh_token", MELI_TOKEN_MEM.get("refresh_token", "")),
                "expires_at": time.time() + int(tok.get("expires_in", 21600)),
            })
            return MELI_TOKEN_MEM["access_token"]
    return ""

app = FastAPI(title="Comparador de precios")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # en prod: ["https://tu-frontend.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BESTBUY_KEY = os.getenv("BESTBUY_API_KEY", "")
EBAY_TOKEN  = os.getenv("EBAY_OAUTH_TOKEN", "")
MELI_TOKEN  = os.getenv("MERCADOLIBRE_TOKEN", "")  # <<< NUEVO

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Accept-Language": "es-CO,es;q=0.9",
    "Referer": "https://www.mercadolibre.com.co/"
}

# -----------------------------
# 1) MERCADO LIBRE (MCO/Colombia)
# -----------------------------
async def fetch_mercadolibre(q: str):
    # La API de MercadoLibre bloquea requests, usamos scraping de la web pública
    url = f"https://listado.mercadolibre.com.co/{q.replace(' ', '-')}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-CO,es;q=0.9",
        "Referer": "https://www.mercadolibre.com.co/"
    }
    
    try:
        async with httpx.AsyncClient(timeout=15, headers=headers, follow_redirects=True) as client:
            r = await client.get(url)
            logger.info(f"[ML MCO] Status: {r.status_code}")
            if r.status_code != 200:
                logger.error(f"[ML MCO] Error {r.status_code}")
                return []
            
            soup = BeautifulSoup(r.text, 'html.parser')
            items = []
            
            # Buscar productos en el HTML (excluir intervenciones/anuncios)
            todos = soup.find_all('li', class_=lambda x: x and 'ui-search-layout__item' in x)
            productos = [p for p in todos if 'intervention' not in ' '.join(p.get('class', []))]
            logger.info(f"[ML MCO] Productos encontrados: {len(productos)} (total: {len(todos)})")
            productos = productos[:10]
            
            for prod in productos:
                try:
                    # Buscar enlace principal del producto
                    link = prod.find('a', href=True)
                    if not link:
                        continue
                    
                    # Título (del texto del enlace)
                    titulo = link.get_text(strip=True)
                    if not titulo or len(titulo) < 10:
                        continue
                    
                    # FILTRO: Excluir accesorios genéricos
                    titulo_lower = titulo.lower()
                    accesorios_excluidos = [
                        'cable', 'cargador', 'funda', 'estuche', 'protector',
                        'vidrio', 'mica', 'auricular', 'audífono',
                        'soporte', 'holder', 'base', 'tripode',
                        'batería externa', 'power bank', 'adaptador'
                    ]
                    
                    # Si el título menciona un accesorio Y NO menciona el producto principal
                    query_words = q.lower().split()
                    main_keyword = query_words[0] if query_words else ""
                    
                    es_accesorio = any(acc in titulo_lower for acc in accesorios_excluidos)
                    menciona_producto = main_keyword in titulo_lower if main_keyword else True
                    
                    # Si es accesorio y el título SOLO menciona el producto como compatibilidad, excluir
                    if es_accesorio and not any(word in titulo_lower[:30] for word in query_words if len(word) > 3):
                        logger.info(f"[ML MCO] Accesorio excluido: {titulo[:50]}")
                        continue
                    
                    # URL
                    url_producto = link['href']
                    
                    # Precio
                    precio_elem = prod.find('span', class_=lambda x: x and 'andes-money-amount__fraction' in x)
                    precio = 0.0
                    if precio_elem:
                        precio_text = precio_elem.get_text(strip=True).replace('.', '').replace(',', '.')
                        precio = float(re.sub(r'[^\d.]', '', precio_text))
                    
                    # Imagen
                    img_elem = prod.find('img')
                    imagen = img_elem.get('data-src') or img_elem.get('src') if img_elem else ""
                    
                    if titulo and precio > 0:
                        items.append({
                            "title": titulo,
                            "price": precio,
                            "currency": "COP",
                            "source": "MercadoLibre",
                            "url": url_producto,
                            "thumbnail": imagen
                        })
                except Exception as e:
                    logger.warning(f"[ML MCO] Error parseando producto: {e}")
                    continue
            
            logger.info(f"[ML MCO] resultados: {len(items)}")
            return items
            
    except Exception as e:
        logger.error(f"[ML MCO] Error en scraping: {e}")
        return []

# -----------------------------
# 2) BEST BUY (opcional con API key)
# -----------------------------
async def fetch_bestbuy(q: str):
    if not BESTBUY_KEY:
        logger.info("[BestBuy] sin API key, se omite")
        return []
    url = f"https://api.bestbuy.com/v1/products((search={q}))"
    params = {"apiKey": BESTBUY_KEY, "format": "json", "pageSize": 10}
    async with httpx.AsyncClient(timeout=12, headers=HEADERS) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        data = r.json()
        items = []
        for it in data.get("products", []):
            price = it.get("salePrice") or it.get("regularPrice") or 0
            items.append({
                "title": it.get("name"),
                "price": float(price or 0),
                "currency": "USD",
                "store": "bestbuy",
                "url": it.get("url"),
                "image": it.get("image")
            })
        logger.info(f"[BestBuy] resultados: {len(items)}")
        return items

# -----------------------------
# 3) EBAY (opcional con OAuth token)
# -----------------------------
async def fetch_ebay(q: str):
    if not EBAY_TOKEN:
        logger.info("[eBay] sin token OAuth, se omite")
        return []
    url = "https://api.ebay.com/buy/browse/v1/item_summary/search"
    params = {"q": q, "limit": "10"}
    headers = {
        **HEADERS,
        "Authorization": f"Bearer {EBAY_TOKEN}",
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
    }
    async with httpx.AsyncClient(timeout=12, headers=headers) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        data = r.json()
        items = []
        for it in data.get("itemSummaries", []):
            p = it.get("price") or {}
            items.append({
                "title": it.get("title"),
                "price": float(p.get("value") or 0),
                "currency": p.get("currency", "USD"),
                "store": "ebay",
                "url": it.get("itemWebUrl"),
                "image": (it.get("image") or {}).get("imageUrl")
            })
        logger.info(f"[eBay] resultados: {len(items)}")
        return items

# -----------------------------
# Endpoints
# -----------------------------
@app.get("/")
def root():
    return {"ok": True, "message": "Comparador de precios backend"}

def calculate_match_score(title: str, query: str) -> int:
    """
    Calcula qué tan bien coincide el producto con la búsqueda.
    Retorna un puntaje de 0-100.
    """
    title_lower = title.lower()
    query_lower = query.lower()
    
    # Extraer palabras clave (ignorar palabras comunes)
    stop_words = ['el', 'la', 'de', 'para', 'con', 'en', 'y', 'un', 'una']
    query_words = [w for w in query_lower.split() if w not in stop_words and len(w) > 2]
    
    if not query_words:
        return 50
    
    score = 0
    
    # 1. Coincidencia exacta completa = +50 puntos
    if query_lower in title_lower:
        score += 50
    
    # 2. Todas las palabras clave presentes = +30 puntos
    words_in_title = sum(1 for word in query_words if word in title_lower)
    score += (words_in_title / len(query_words)) * 30
    
    # 3. Palabras al inicio del título = +20 puntos (más importante)
    first_50_chars = title_lower[:50]
    words_at_start = sum(1 for word in query_words if word in first_50_chars)
    score += (words_at_start / len(query_words)) * 20
    
    # PENALIZACIONES (muy importante para filtrar)
    
    # 4. Penalizar accesorios si no se buscan explícitamente
    accesorios = ['cable', 'cargador', 'funda', 'estuche', 'protector', 'vidrio', 
                  'mica', 'auricular', 'audífono', 'holder', 'soporte', 'base']
    if not any(acc in query_lower for acc in accesorios):
        if any(acc in title_lower for acc in accesorios):
            score -= 40  # Penalización fuerte
    
    # 5. Penalizar "reacondicionado" si no se busca
    if 'reacondicionado' not in query_lower and 'reacondicionado' in title_lower:
        score -= 20
    
    # 6. Penalizar si el título es muy corto (posible spam)
    if len(title) < 15:
        score -= 15
    
    return max(0, min(100, score))

@app.get("/search")
async def search(q: str = Query(..., min_length=1)):
    """
    Endpoint unificado. Busca en 6 tiendas colombianas:
    - MercadoLibre (scraping)
    - Falabella (scraping JSON)
    - Éxito (API VTEX)
    - Olímpica (API VTEX)
    - Alkosto (scraping)
    - Homecenter (scraping)
    
    Filtra automáticamente accesorios y productos irrelevantes.
    """
    results = await asyncio.gather(
        fetch_mercadolibre(q),
        fetch_falabella(q),
        fetch_exito(q),
        fetch_olimpica(q),
        fetch_alkosto(q),
        fetch_homecenter(q),
        return_exceptions=True  # Evitar que una tienda falle todo
    )
    
    # Filtrar excepciones y combinar resultados
    all_items = []
    for result in results:
        if isinstance(result, list):
            all_items.extend(result)
        elif isinstance(result, Exception):
            print(f"[Search] Error en tienda: {result}")
    
    # Filtrar items válidos (con precio)
    items = [i for i in all_items if (i.get("price") or 0) > 0]
    
    # Calcular score de relevancia para cada producto
    for item in items:
        item["match_score"] = calculate_match_score(item.get("title", ""), q)
    
    # FILTRAR: Solo productos con score >= 30 (relevantes)
    items = [i for i in items if i["match_score"] >= 30]
    
    # Ordenar por relevancia primero, luego por precio
    items.sort(key=lambda x: (-x["match_score"], x["price"]))
    
    # El más barato entre los relevantes
    cheapest = min(items, key=lambda x: x["price"]) if items else None
    
    logger.info(f"[Search] '{q}' → {len(items)} productos relevantes")
    
    return {"items": items, "cheapest": cheapest}

# (Opcional) Endpoint de debug para inspeccionar la respuesta cruda de ML
@app.get("/debug/ml")
async def debug_ml(q: str):
    url = "https://api.mercadolibre.com/sites/MCO/search"
    params = {"q": q, "limit": 2}
    async with httpx.AsyncClient(timeout=12, headers=HEADERS) as client:
        r = await client.get(url, params=params)
        return {"status": r.status_code, "sample": r.json()}

# -----------------------------
# OAuth MercadoLibre
# -----------------------------
@app.get("/ml/login")
def meli_login():
    if not (MELI_CLIENT_ID and MELI_REDIRECT_URI):
        return {"error": "Configura MELI_CLIENT_ID y MELI_REDIRECT_URI en backend/.env"}
    # redirige a la autorización de Mercado Libre (CO)
    url = (
        "https://auth.mercadolibre.com.co/authorization"
        f"?response_type=code&client_id={MELI_CLIENT_ID}"
        f"&redirect_uri={MELI_REDIRECT_URI}"
    )
    return RedirectResponse(url)

@app.get("/ml/callback")
async def meli_callback(code: str = ""):
    if not code:
        # si entras directo a esta URL sin code, que no reviente
        return {"ok": False, "message": "Falta 'code' en el callback"}
    async with httpx.AsyncClient(timeout=12) as client:
        r = await client.post(
            "https://api.mercadolibre.com/oauth/token",
            data={
                "grant_type": "authorization_code",
                "client_id": MELI_CLIENT_ID,
                "client_secret": MELI_CLIENT_SECRET,
                "code": code,
                "redirect_uri": MELI_REDIRECT_URI,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        r.raise_for_status()
        tok = r.json()
        save_meli_token({
            "access_token": tok["access_token"],
            "refresh_token": tok.get("refresh_token", ""),
            "expires_at": time.time() + int(tok.get("expires_in", 21600)),
        })
        return {"ok": True}

@app.post("/ml/notifications")
async def meli_notifications(request: dict):
    """Endpoint para recibir notificaciones de MercadoLibre"""
    logger.info(f"[ML] Notificación recibida: {request}")
    # Aquí puedes procesar las notificaciones de cambios en órdenes, mensajes, etc.
    return {"ok": True}

@app.get("/debug/exito")
async def debug_exito(q: str):
    """Endpoint de debug para verificar la integración con Éxito Colombia"""
    data = await fetch_exito(q)
    return {"source": "exito", "count": len(data), "items": data}

@app.get("/debug/falabella")
async def debug_falabella(q: str):
    """Endpoint de debug para verificar la integración con Falabella Colombia"""
    data = await fetch_falabella(q)
    return {"source": "falabella", "count": len(data), "items": data}

@app.get("/debug/olimpica")
async def debug_olimpica(q: str):
    """Endpoint de debug para verificar la integración con Olímpica Colombia"""
    data = await fetch_olimpica(q)
    return {"source": "olimpica", "count": len(data), "items": data}

@app.get("/debug/alkosto")
async def debug_alkosto(q: str):
    """Endpoint de debug para verificar la integración con Alkosto Colombia"""
    data = await fetch_alkosto(q)
    return {"source": "alkosto", "count": len(data), "items": data}

@app.get("/debug/homecenter")
async def debug_homecenter(q: str):
    """Endpoint de debug para verificar la integración con Homecenter Colombia"""
    data = await fetch_homecenter(q)
    return {"source": "homecenter", "count": len(data), "items": data}
