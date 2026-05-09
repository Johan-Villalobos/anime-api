# 🍙 Anime API

REST API para la Anime App construida con **Node.js puro** (sin frameworks).  
Conecta a **Supabase** y está lista para desplegar en **Render**.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Ping a Supabase + uptime |
| `GET` | `/api/series` | Metadatos de todas las series |
| `GET` | `/api/one-piece?name=<query>` | Buscar personaje (parcial, sin importar mayúsculas) |
| `GET` | `/api/one-piece/all` | Todos los personajes de One Piece |
| `GET` | `/api/saint-seiya?name=<query>` | Buscar personaje en Saint Seiya |
| `GET` | `/api/saint-seiya/all` | Todos los personajes de Saint Seiya |
| `GET` | `/api/hunter-x-hunter?name=<query>` | Buscar personaje en HxH |
| `GET` | `/api/hunter-x-hunter/all` | Todos los personajes de HxH |

### Respuesta exitosa
```json
{
  "success": true,
  "data": {
    "id": 1,
    "series_slug": "one_piece",
    "series_name": "One Piece",
    "name": "Monkey D. Luffy",
    "age": "19",
    "category": "Capitán — Piratas Sombrero de Paja",
    "power": "Fruta del Diablo: Gomu Gomu no Mi…",
    "technique": "Gear Fifth / Gomu Gomu no Gigant",
    "description": "El futuro Rey de los Piratas…",
    "images": []
  }
}
```

### Respuesta de error
```json
{
  "success": false,
  "error": "No character matching \"xyz\" was found in this series."
}
```

---

## Desarrollo local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

El `.env` ya viene configurado con las credenciales del proyecto Supabase.  
Si necesitas recrearlo:

```env
SUPABASE_URL=https://ndeansvxxtqupjygiotb.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZWFuc3Z4eHRxdXBqeWdpb3RiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE5NDU3MiwiZXhwIjoyMDkzNzcwNTcyfQ.07TWwBJaB3kh17jDwj5k8JzeGMr8hnEHNHlH-UEo7N0
PORT=3000
ALLOWED_ORIGINS=*
```

### 3. Levantar el servidor

```bash
npm run dev    # con hot-reload (Node 18+)
npm start      # producción
```

Servidor disponible en `http://localhost:3000`.

### 4. Conectar la app Expo (frontend local)

En `constants/anime.ts` de tu app Expo:

```ts
// Mismo equipo
export const API_BASE_URL = 'http://localhost:3000';

// Dispositivo físico o emulador Android → usa tu IP local
export const API_BASE_URL = 'http://192.168.1.X:3000';
```

> Ejecuta `ipconfig` (Windows) o `ifconfig` (Mac/Linux) para ver tu IP local.

---

## Despliegue en Render

1. Sube el código a GitHub — el `.env` está en `.gitignore`, **no se sube**.

2. Render → **New → Web Service** → conecta el repo.

3. Configuración del servicio:

   | Campo | Valor |
   |-------|-------|
   | Environment | `Node` |
   | Build Command | `npm install` |
   | Start Command | `npm start` |

4. **Environment Variables** en el dashboard de Render:

   | Clave | Valor |
   |-------|-------|
   | `SUPABASE_URL` | `https://ndeansvxxtqupjygiotb.supabase.co` |
   | `SUPABASE_SERVICE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…` (valor completo) |
   | `ALLOWED_ORIGINS` | `*` |

   > `PORT` lo inyecta Render automáticamente.

5. Click **Create Web Service** → espera el build.

6. Verifica: `https://<tu-servicio>.onrender.com/health`

7. Actualiza la app Expo:
   ```ts
   export const API_BASE_URL = 'https://<tu-servicio>.onrender.com';
   ```

---

## Estructura del proyecto

```
anime-api/
├── src/
│   ├── server.js              ← Entry point: HTTP, routing, graceful shutdown
│   ├── db/
│   │   ├── supabase.js        ← Cliente Supabase singleton
│   │   └── characters.js      ← Queries reutilizables
│   ├── routes/
│   │   ├── anime.js           ← Handlers /api/* con validación
│   │   └── health.js          ← Handler /health
│   ├── middleware/
│   │   ├── cors.js            ← CORS + preflight OPTIONS
│   │   └── logger.js          ← Log de requests
│   └── utils/
│       └── response.js        ← Helpers JSON: ok / notFound / badRequest / serverError
├── .env                       ← Credenciales reales (NO subir a Git)
├── .env.example               ← Plantilla de referencia
├── .gitignore
├── package.json
└── README.md
```
