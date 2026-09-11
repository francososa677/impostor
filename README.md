# 🕵️‍♂️ Impostor — Juego Social en Tiempo Real

**Impostor** es un juego social de deducción, pistas y engaño en tiempo real. Todos los jugadores reciben una misma palabra secreta... excepto los impostores. ¿Podrás descubrir quién miente antes de que sea demasiado tarde?

---

## 🚀 Inicio Rápido (Desarrollo Local)

### 1. Instalar dependencias
```bash
npm install
```

### 2. Generar y validar datasets de palabras
```bash
npm run validate-data
```

### 3. Iniciar el entorno de desarrollo (Frontend + Backend concurrentes)
```bash
npm run dev
```

- **Frontend (Web)**: [http://localhost:5173](http://localhost:5173)
- **Backend (API & Socket.IO)**: [http://localhost:3001](http://localhost:3001)

---

## 🧪 Comandos y Verificación de Calidad

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia simultáneamente el servidor backend y el frontend con recarga en vivo |
| `npm run test` | Ejecuta la suite completa de tests unitarios, de seguridad e integración con Vitest |
| `npm run validate-data` | Valida la integridad, campos y calidad de todos los datasets de palabras |
| `npm run typecheck` | Comprueba tipos de TypeScript en todos los paquetes y aplicaciones |
| `npm run build` | Compila todos los paquetes y bundles de producción de frontend y backend |
| `npm run check` | Ejecuta validación de datos, typecheck, tests y build en un solo paso |

---

## 📁 Estructura del Monorepo

```text
impostor/
├── apps/
│   ├── web/                     # Frontend SPA React 18 + Vite + Tailwind + Web Audio
│   └── server/                  # Backend Node.js + Express + Socket.IO + Helmet
├── packages/
│   ├── shared/                  # Tipos TypeScript, esquemas Zod, DTOs y serializadores seguros
│   └── game-engine/             # Máquina de estados pura del juego, turnos y reglas
├── data/
│   └── words/                   # Datasets de categorías: Objetos, Comida, Fútbol, Películas, Series, Videojuegos
├── scripts/
│   ├── validate-data.ts         # Script de validación de calidad de palabras
│   └── generate-datasets.ts     # Generador de datasets de palabras
├── tests/                       # Suite de pruebas unitarias, de seguridad e integración
└── docs/                        # Documentación de arquitectura, decisiones y roadmap
```

---

## ⚙️ Variables de Entorno

Copia el archivo de ejemplo para configurar tus variables locales:

```bash
cp .env.example .env
```

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `NODE_ENV` | Entorno de ejecución (`development` / `production`) | `development` |
| `PORT` | Puerto HTTP para el servidor backend | `3001` |
| `CLIENT_URL` | URL del frontend para CORS y redirecciones | `http://localhost:5173` |
| `PUBLIC_APP_URL` | URL pública utilizada en generación de códigos QR | `http://localhost:5173` |
| `SESSION_SECRET` | Clave secreta para firmas de sesión efímeras | *(definida en `.env.example`)* |

---

## 🌐 Guía de Despliegue en Producción

### Frontend (Vercel)
1. Conecta el repositorio a Vercel.
2. Root Directory: `apps/web` (o configurar Build Command en la raíz: `npm run build -w @impostor/web`).
3. Output Directory: `dist`.
4. Variables de entorno:
   - Configurar la URL de tu servidor backend en producción.

### Backend (Railway / Render / Fly.io)
1. Despliega como servicio Node.js persistente (con soporte nativo de WebSockets).
2. Build Command: `npm install && npm run build -w @impostor/shared && npm run build -w @impostor/game-engine && npm run build -w @impostor/server`.
3. Start Command: `node apps/server/dist/server.js`.
4. Configurar variables `CLIENT_URL` y `CORS_ORIGIN` con el dominio de Vercel.

---

## 🔒 Seguridad y Privacidad (Zero Data Leakage)
- **Cero fugas al cliente**: La palabra secreta jamás se envía en estados públicos ni a los impostores. DevTools no puede revelar información oculta.
- **Validación con Zod**: Todos los payloads de entrada son validados y sanitizados contra ataques XSS e inyecciones.
- **Rate limiting**: Protección contra spam en chat, creación de salas y votación.
