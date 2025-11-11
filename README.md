# 🛒 Comparador de Precios Colombia

Aplicación web moderna para comparar precios de productos entre **MercadoLibre** y **Falabella** en Colombia.

## ✨ Características

- 🔍 **Búsqueda simultánea** en múltiples tiendas online
- 💰 **Destacado del mejor precio** automático
- 🏪 **Logos visuales** por tienda (MercadoLibre / Falabella)
- 📱 **Diseño responsive** (móvil, tablet, desktop)
- ⚡ **Next.js 16** con TypeScript
- 🎨 **Tailwind CSS** + shadcn/ui components
- 🌐 **Scraping inteligente** con Cheerio y Axios

## 🚀 Inicio Rápido

### Instalación

```bash
npm install
```

### Configuración

Crea un archivo `.env.local` con las credenciales de MercadoLibre (opcional para OAuth):

```env
MELI_CLIENT_ID=tu_client_id
MELI_CLIENT_SECRET=tu_client_secret
MELI_REDIRECT_URI=https://tu-dominio.com/ml/callback
```

### Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Producción

```bash
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
comparador-web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── search/        # Endpoint principal de búsqueda
│   │   │   ├── debug/         # Endpoints de debug
│   │   │   └── ml/            # OAuth MercadoLibre
│   │   ├── page.tsx           # Frontend principal
│   │   └── layout.tsx
│   ├── lib/
│   │   └── scrapers/
│   │       ├── mercadolibre.ts  # Scraper de MercadoLibre
│   │       └── falabella.ts     # Scraper de Falabella
│   └── components/ui/         # Componentes shadcn/ui
├── public/icons/              # Logos de tiendas
└── .env.local                 # Variables de entorno
```

## 🔌 API Endpoints

### Búsqueda de productos
```http
GET /api/search?q=iphone
```

**Respuesta:**
```json
{
  "items": [...],
  "cheapest": {...},
  "stats": {
    "total": 20,
    "mercadolibre": 10,
    "falabella": 10
  }
}
```

### Debug Falabella
```http
GET /api/debug/falabella?q=laptop
```

## 🛠️ Tecnologías

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Scraping**: Cheerio (HTML parsing), Axios (HTTP requests)
- **UI**: shadcn/ui, Lucide Icons
- **Deploy**: Vercel (recomendado)

## 📝 Próximas Funcionalidades

- [ ] Agregar más tiendas (Éxito, Alkosto, Linio)
- [ ] Historial de precios con gráficas
- [ ] Alertas de precio
- [ ] Filtros avanzados (marca, categoría, precio)
- [ ] Comparación lado a lado
- [ ] Base de datos SQLite para métricas

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor abre un issue primero para discutir cambios mayores.

## 📄 Licencia

MIT

---

**Hecho con ❤️ en Colombia**
# cocheap
# cocheap
