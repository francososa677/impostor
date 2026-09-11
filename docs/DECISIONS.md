# Registro de Decisiones Técnicas — Impostor

Este documento registra las decisiones de diseño y arquitectura implementadas en base a las especificaciones del proyecto y las directivas de las secciones 99 en adelante.

---

## 1. Modos de Juego Unificados (Decisión 99.1)
- No se crearon modos separados artificialmente ("clásico", "con pistas"). Existe un único motor de juego donde el anfitrión configura los parámetros (impostores, pistas, revelación de rol, etc.) en la creación de la sala.

## 2. Manejo de Pistas y Categorías (Decisiones 99.2 y 99.3)
- Cuando el anfitrión selecciona múltiples categorías, al iniciar la partida se sortea **una única categoría** de manera uniforme y luego **una única palabra** dentro de esa categoría para evitar sesgos por tamaño de dataset.
- Si se activa la pista para el impostor:
  - Si hay 1 sola categoría: el impostor recibe la **pista contextual** (nunca obvia).
  - Si hay 2 o más categorías: el anfitrión elige si recibe solo categoría, solo pista contextual o ambas.

## 3. Última Oportunidad del Impostor (Decisión 100)
- Si el jugador más votado es un impostor y la regla `lastChanceGuess` está activa, la partida entra en la fase `LAST_CHANCE`.
- El backend procesa la respuesta normalizando mayúsculas, tildes y signos (`isGuessCorrect`). Si acierta, los impostores ganan automáticamente con bonificación de puntos.

## 4. Resolución de Empates en Votación (Decisión 102)
- Primer empate: Inicia una fase `TIE_BREAKER` donde los jugadores vivos solo pueden votar entre los candidatos empatados.
- Segundo empate: Nadie es eliminado y la partida avanza directamente a la siguiente ronda con `round + 1`.

## 5. Persistencia Efímera en Memoria con Preparación para Redis (Secciones 4 y 112)
- Todo el estado vive en memoria a través de la interfaz `RoomStore` (`InMemoryRoomStore`).
- Permite migración futura a Redis sin modificar la lógica del `GameEngine`.

## 6. Audio y Háptica sin Dependencias Externas de Archivos (Secciones 53 y 78)
- Los efectos de sonido se sintetizan en tiempo real mediante **Web Audio API** (tonos de turnos, ticks de reloj, revelación y fanfarria), garantizando carga instantánea sin requerir descargas pesadas de audio.
- Integración de `navigator.vibrate` para feedback táctil en dispositivos móviles.
