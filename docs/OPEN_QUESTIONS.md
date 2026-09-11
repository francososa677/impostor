# Preguntas Abiertas y Roadmap Futuro — Impostor

Este documento registra los puntos de diseño y funcionalidades opcionales planteadas para futuras iteraciones que no bloquean el MVP actual (Sección 120).

---

## 1. Moderación Avanzada del Chat
- **Estado actual**: Implementado rate limiting por socket, límite de longitud (200 caracteres) y sanitización contra inyección HTML.
- **Futuro**: Integrar lista negra de términos ofensivos personalizable por sala.

## 2. Packs de Categorías Creadas por la Comunidad
- **Estado actual**: 6 categorías oficiales de alta calidad validadas automáticamente.
- **Futuro**: Permitir a usuarios logueados importar datasets en formato JSON o crear sus propios mazos de palabras.

## 3. Cuentas de Usuario y Estadísticas Globales
- **Estado actual**: Sesiones efímeras con tabla de puntuaciones persistida dentro de la sala durante toda la sesión de revanchas.
- **Futuro**: Autenticación opcional con OAuth (Google/Discord), historial de partidas y ranking global.

## 4. Chat de Voz Integrado
- **Estado actual**: Modalidad virtual con chat de texto en tiempo real y reacciones emoji.
- **Futuro**: Integración con WebRTC para audio espacial o canales de voz por sala.
