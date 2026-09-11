# PROMPT MAESTRO — IMPOSTOR

> **IMPORTANTE:** Las secciones 99 en adelante contienen las decisiones de producto más recientes y tienen prioridad sobre cualquier recomendación anterior que contradiga esas decisiones. Todo el desarrollo debe realizarse en el repositorio oficial indicado en la sección 113.


## 0. Rol de la IA programadora

Actuá como un **Senior Full-Stack Engineer + Game/Realtime Engineer + UI/UX Designer + Security Engineer**.

Tu trabajo es **construir la aplicación completa y funcional**, no solamente proponer arquitectura ni dar fragmentos de código.

Debés:
- Crear el proyecto desde cero.
- Implementar frontend, backend, comunicación realtime, lógica completa del juego, validaciones, manejo de errores, responsive design y seguridad.
- Entregar una aplicación ejecutable localmente y preparada para producción.
- Crear todos los archivos necesarios.
- Mantener el código organizado, modular, tipado y documentado cuando sea útil.
- Evitar soluciones “mock” o botones que no hagan nada.
- Si alguna decisión menor no está especificada, elegí una opción razonable y continuá sin bloquear el desarrollo.
- No preguntes cosas que no sean realmente necesarias para poder construir la aplicación.
- Priorizá un MVP completo, jugable y estable antes que funcionalidades secundarias.

---

# 1. Concepto del producto

La aplicación se llama **Impostor**.

Es un juego social inspirado en el concepto del “Impostor”:

1. Todos los jugadores reciben una misma palabra secreta.
2. Una cantidad determinada de jugadores son impostores.
3. Los impostores no reciben la palabra secreta.
4. Opcionalmente, un impostor puede recibir una pista.
5. Por turnos, cada jugador debe decir una palabra o pista relacionada con el término secreto sin revelarlo directamente.
6. Los impostores deben disimular y, al mismo tiempo, intentar descubrir la palabra secreta.
7. Al terminar la ronda de pistas, todos votan a quién eliminar.
8. El jugador con más votos queda eliminado.
9. Se continúa jugando hasta que se cumpla una condición de victoria.
10. Si hay varios impostores, todos los impostores comparten la victoria.

El producto debe sentirse como una aplicación social moderna, rápida, oscura y ligeramente tenebrosa, pero divertida.

---

# 2. Stack tecnológico

## Frontend
Usar:

- React
- TypeScript
- Vite
- React Router
- Socket.IO Client
- CSS moderno o Tailwind CSS
- Componentes reutilizables
- Diseño responsive mobile-first

## Backend
Usar:

- Node.js
- TypeScript
- Express
- Socket.IO
- Zod o una alternativa equivalente para validar payloads
- UUID o identificadores seguros para jugadores/salas cuando sea necesario
- Logger estructurado

## Organización recomendada

Preferentemente crear un monorepo:

```text
/
├── apps/
│   ├── web/
│   └── server/
├── packages/
│   ├── shared/
│   └── game-engine/
├── data/
│   └── words/
├── tests/
├── docs/
├── .env.example
├── package.json
├── README.md
└── ...
```

La lógica de reglas del juego debe estar separada de Socket.IO para poder testearla sin conexión de red.

---

# 3. Arquitectura de despliegue

## Recomendación principal

Separar:

### Frontend
Deploy en **Vercel**.

### Backend realtime
Deploy como servidor Node.js persistente en un servicio adecuado para procesos realtime, por ejemplo:
- Railway
- Render
- Fly.io
- u otro proveedor equivalente.

No usar una arquitectura que dependa de que una función serverless mantenga indefinidamente el estado del juego en memoria.

## Motivo

A septiembre de 2026 Vercel tiene soporte público en beta para WebSockets y contempla también librerías de más alto nivel como Socket.IO, pero una aplicación realtime de este tipo sigue necesitando considerar reconexiones, duración de conexiones y coordinación del estado entre instancias. Para este proyecto, que explícitamente quiere evitar una base de datos inicialmente, es más simple y predecible tener un proceso Node persistente que sea la autoridad del juego.

Fuente de referencia:
- https://vercel.com/changelog/websocket-support-is-now-in-public-beta
- https://vercel.com/i/websocket-vs-server-sent-events

## Regla de arquitectura

El servidor será la **única fuente de verdad**.

Nunca confiar en información enviada por el cliente para:
- decidir quién es impostor,
- decidir quién recibe una palabra,
- validar votos,
- decidir quién ganó,
- iniciar rondas,
- eliminar jugadores,
- asignar palabras.

El cliente solamente solicita acciones.

---

# 4. Persistencia

No usar base de datos en la primera versión.

Todo el estado de las salas y partidas activas debe vivir en memoria del servidor Node.js.

Esto incluye:

- salas activas;
- jugadores conectados;
- configuración de cada sala;
- estado de la partida;
- palabra secreta;
- impostores;
- votos;
- orden de turnos;
- historial mínimo necesario de la partida;
- mensajes del chat mientras la sala exista.

Al cerrar/eliminar/reiniciar el servidor, las partidas pueden perderse.

Esto es intencional.

## Preparar para una futura migración

Diseñar interfaces como:

```ts
RoomStore
GameStore
```

de forma que luego pueda agregarse:
- Redis
- PostgreSQL
- otra solución de persistencia

sin reescribir toda la lógica.

---

# 5. Modos de juego

Al crear una sala debe existir:

## Modalidad principal

### Virtual
Cada jugador juega desde su propio dispositivo.

Características:
- Cada jugador ve solamente su información privada.
- Chat realtime obligatorio.
- La sala funciona completamente online.
- Debe existir indicador de jugadores conectados.

### Presencial
Todos están físicamente juntos.

El creador debe poder elegir:

#### Presencial — un dispositivo
Todos juegan utilizando un único celular/PC.

El dispositivo se pasa de jugador en jugador.

Es obligatorio implementar un sistema para que:
- el jugador vea su información privada;
- el resto de los jugadores no pueda verla;
- exista una pantalla clara de “pasá el dispositivo”;
- haya una acción para revelar la información solamente al jugador actual;
- después se oculte antes de pasar el dispositivo.

#### Presencial — múltiples dispositivos
Cada jugador utiliza su propio teléfono.

La experiencia es prácticamente igual al modo virtual, pero el chat puede ser opcional.

---

# 6. Creación de sala

Un jugador puede:

- Crear una sala.
- Elegir nombre/apodo.
- Elegir modalidad.
- Configurar reglas.
- Elegir categorías.
- Elegir número máximo de jugadores.
- Elegir número de impostores.
- Elegir reglas de pistas.
- Elegir si los impostores se conocen entre sí.
- Elegir si después de eliminar a alguien se revela si era impostor.
- Crear una sala pública o privada.

Después de crearla, mostrar:

- código de sala;
- botón copiar código;
- QR;
- enlace compartible;
- información de privacidad;
- lista de jugadores;
- estado de la sala.

---

# 7. Lobby

Debe existir una pantalla de lobby similar a las salas de juegos online.

Mostrar salas activas separadas visualmente entre:

- Públicas
- Privadas

Para cada sala mostrar como mínimo:

- código/nombre identificable;
- cantidad actual de jugadores;
- máximo de jugadores;
- estado;
- modalidad;
- indicadores de reglas relevantes;
- si requiere contraseña para acceso manual.

Ejemplo:

```text
SALAS PÚBLICAS

Sala de Franco
4 / 8 jugadores
Virtual
Sin contraseña

Sala de los pibes
7 / 10 jugadores
Presencial
2 impostores
```

Y:

```text
SALAS PRIVADAS

Sala secreta
5 / 10
🔒 Privada
```

Debe existir:

- actualizar lobby en realtime;
- entrada mediante clic;
- búsqueda por código;
- unión mediante QR;
- unión mediante enlace profundo.

---

# 8. Privacidad de las salas

Una sala puede ser:

### Pública
Puede aparecer en el lobby.

### Privada
No debe aparecer públicamente o debe aparecer dentro de una sección diferenciada según diseño.

Sin embargo:

## Regla importante

Si alguien entra a una sala privada mediante:

- código exacto;
- QR;
- enlace directo;

**NO pedir contraseña**.

El código/QR/enlace actúa como método de acceso.

La contraseña, si existe, solamente debe utilizarse para el ingreso manual cuando corresponda.

---

# 9. Contraseñas

Si una sala tiene contraseña:

- jamás transmitir la contraseña en texto plano a otros jugadores;
- nunca mostrarla en el lobby;
- comparar mediante hash en backend;
- evitar logs que puedan exponerla.

Como el proyecto no tiene DB, el hash solamente vivirá mientras exista la sala.

---

# 10. Sistema de jugadores

Cada jugador debe tener:

- `playerId`
- `socketId`
- `nickname`
- `avatar` opcional
- estado de conexión
- estado activo/eliminado
- orden original en la partida

El nickname:
- debe tener longitud mínima/máxima;
- no permitir HTML;
- no permitir scripts;
- ser sanitizado/validado;
- evitar duplicados dentro de la misma sala.

No hace falta autenticación con cuenta en esta versión.

---

# 11. Código de sala

Crear códigos cortos, fáciles de comunicar oralmente.

Ejemplo:

```text
K7F9Q
```

Evitar:
- caracteres ambiguos;
- `0/O`;
- `1/I`;
- secuencias difíciles de leer.

El código debe tener suficiente entropía para evitar enumeración trivial.

Aplicar rate limiting a intentos de unión por código.

---

# 12. QR

En la sala debe haber un QR.

Al escanearlo debe abrir una URL como:

```text
https://impostor.example/join/K7F9Q
```

o equivalente.

El usuario debe llegar directamente a la pantalla de ingreso.

---

# 13. Configuración de jugadores

Permitir elegir:

- mínimo de jugadores;
- máximo de jugadores.

Definir límites razonables.

Recomendación inicial:

```text
Mínimo: 3
Máximo: 20
```

Pero diseñar el sistema para aumentar el máximo posteriormente.

No permitir iniciar una partida si no se alcanza el mínimo.

---

# 14. Regla de impostores

El creador puede seleccionar el número de impostores, pero la UI debe impedir configuraciones absurdas.

Regla recomendada:

- siempre deben existir al menos 2 jugadores no impostores;
- impostores >= 1;
- impostores < jugadores;
- el número máximo de impostores será:

```text
floor((cantidadDeJugadores - 1) / 2)
```

Sin embargo, para partidas pequeñas aplicar además un límite práctico:

```text
3 jugadores -> 1 impostor
4-5 jugadores -> 1 impostor
6-7 jugadores -> hasta 2 impostores
8-10 jugadores -> hasta 3 impostores
11-14 jugadores -> hasta 4 impostores
15-20 jugadores -> hasta 5 impostores
```

La lógica final debe quedar centralizada en el backend.

La UI debe mostrar solamente opciones válidas.

---

# 15. Victoria de los impostores

Los impostores ganan cuando los jugadores no impostores quedan en una cantidad que ya no permite expulsar a todos los impostores.

Regla recomendada:

```text
si impostores >= noImpostores:
    ganan los impostores
```

Ejemplo:

```text
2 impostores
2 jugadores normales

=> ganan los impostores
```

Si quedan:

```text
2 impostores
3 jugadores normales
```

el juego continúa.

Si hay varios impostores, todos comparten la victoria.

---

# 16. Victoria de los jugadores normales

Los jugadores normales ganan cuando:

```text
impostores restantes === 0
```

Todos los impostores fueron eliminados.

---

# 17. Elección del primer jugador

Al comenzar la partida:

- elegir aleatoriamente quién inicia.

Guardar ese jugador/índice.

Durante toda la partida, mantener un orden de turnos consistente.

Si un jugador es eliminado:
- simplemente se lo elimina de la secuencia activa;
- mantener el orden relativo de los demás.

Ejemplo inicial:

```text
A -> B -> C -> D -> E
```

Si C es eliminado:

```text
A -> B -> D -> E
```

Si A inicia la partida, el siguiente ciclo debe respetar el orden correspondiente.

La lógica no debe volver a sortear el primer jugador en cada ronda.

---

# 18. Flujo de cada ronda

Una ronda debe seguir aproximadamente este estado:

```text
ROUND_START
↓
SECRET_ASSIGNMENT
↓
TURN_ORDER
↓
CLUES
↓
VOTING
↓
VOTE_RESULT
↓
REVEAL_RESULT
↓
CHECK_WINNER
↓
NEXT_ROUND
```

No comenzar otra ronda si la partida ya terminó.

---

# 19. Información privada

La palabra secreta debe ser enviada exclusivamente a:

```text
jugadores normales
```

Los impostores deben recibir:

```text
IMPOSTOR
```

Nunca enviar al cliente información privada de otros jugadores.

MUY IMPORTANTE:

No mandar al frontend un objeto como:

```ts
{
  secretWord,
  impostors: [...]
}
```

para después ocultarlo con CSS.

Eso sería una vulnerabilidad.

El backend solamente debe enviar a cada cliente aquello que ese cliente tiene derecho a conocer.

---

# 20. Variante: impostor con pista

Al crear la sala:

```text
¿Los impostores reciben una pista?
Sí / No
```

Si no:

```text
IMPOSTOR
```

Si sí:

```text
IMPOSTOR
Pista: ...
```

---

# 21. Sistema de pistas

No llamar a las pistas:

- “fácil”
- “difícil”

Usar nombres más elegantes.

Por ejemplo:

### Pista de categoría
Una pista general que indica el tipo de elemento.

### Pista contextual
Una pista relacionada indirectamente con la palabra.

Ejemplo:

Categoría:

```text
Jugadores de fútbol
```

Palabra:

```text
Lionel Messi
```

Pista contextual:

```text
Argentina
```

Otro ejemplo:

Palabra:

```text
Kylian Mbappé
```

Pista:

```text
Francia
```

Otro:

Palabra:

```text
Cristiano Ronaldo
```

Pista:

```text
Portugal
```

---

# 22. Selección de pistas

Si el usuario selecciona UNA sola categoría:

- si activó pistas, el impostor recibe obligatoriamente una pista contextual.

Si selecciona DOS O MÁS categorías:

mostrar:

```text
Tipo de pista

○ Solo pista contextual
○ Solo categoría
○ Categoría + pista contextual
```

También puede implementarse una opción equivalente llamada:

```text
Pista general
Pista contextual
Ambas
```

La elección debe quedar registrada en la configuración de la sala.

---

# 23. Dataset de palabras

Los datasets deben estar separados del código de lógica.

Estructura sugerida:

```text
data/
  words/
    objects.json
    food.json
    football_players.json
    football_teams.json
    national_teams.json
    movies.json
    series.json
    videogames.json
    animals.json
    places.json
    professions.json
    brands.json
    celebrities.json
    vehicles.json
    countries.json
    cities.json
    technology.json
    sports.json
    instruments.json
    etc.json
```

---

# 24. Cantidad de palabras

Objetivo:

## Categorías grandes
Al menos 1000 entradas reales y útiles.

Por ejemplo:

- objetos;
- comida;
- jugadores de fútbol;
- películas;
- series;
- videojuegos;
- animales;
- lugares;
- marcas;
- profesiones;
- vehículos;
- ciudades;
- tecnología;
- deportes;
- instrumentos.

Si razonablemente pueden existir más de 1000 elementos de calidad, agregar más.

## Categorías naturalmente limitadas

No forzar artificialmente 1000 elementos en categorías donde no tiene sentido.

Ejemplo:

- selecciones nacionales;
- países;
- algunas competiciones;
- ciertos conjuntos finitos.

En esas categorías utilizar la mayor cantidad razonable posible.

---

# 25. Formato de los datasets

Ejemplo:

```json
[
  {
    "word": "Lionel Messi",
    "category": "football_players",
    "contextClue": "Argentina"
  }
]
```

Para objetos:

```json
[
  {
    "word": "Martillo",
    "category": "objects",
    "contextClue": "Herramienta"
  }
]
```

Para películas:

```json
[
  {
    "word": "Titanic",
    "category": "movies",
    "contextClue": "Romance"
  }
]
```

Para series:

```json
[
  {
    "word": "Breaking Bad",
    "category": "series",
    "contextClue": "Química"
  }
]
```

La pista debe ayudar, pero NO revelar directamente la palabra.

---

# 26. Reglas de calidad del dataset

Crear un validador automático que compruebe:

- cantidad mínima;
- duplicados;
- strings vacíos;
- pistas vacías cuando son obligatorias;
- palabras iguales en una misma categoría;
- estructuras JSON inválidas.

Ejecutar este validador durante el desarrollo.

---

# 27. Categorías iniciales recomendadas

Además de las categorías solicitadas, incorporar:

### Básicas
- Objetos
- Comida
- Animales
- Lugares
- Profesiones

### Fútbol
- Jugadores de fútbol
- Equipos de fútbol
- Selecciones de fútbol
- Estadios
- Competencias de fútbol
- Técnicos

### Entretenimiento
- Películas
- Series
- Videojuegos
- Personajes ficticios
- Anime

### Cultura
- Celebridades
- Músicos
- Instrumentos
- Libros
- Marcas

### Tecnología
- Tecnología
- Apps
- Dispositivos

### Geografía
- Países
- Ciudades
- Capitales
- Monumentos

### Vehículos
- Autos
- Motos
- Medios de transporte

### Deportes
- Deportistas
- Equipos
- Disciplinas

---

# 28. Selección de categorías

La pantalla debe permitir:

- seleccionar una;
- seleccionar múltiples;
- seleccionar todas;
- buscar categorías;
- mostrar contador.

Ejemplo:

```text
Categorías seleccionadas: 4
```

Cuando hay múltiples categorías, seleccionar aleatoriamente primero una categoría y luego una palabra dentro de esa categoría, o definir un mecanismo explícito configurable.

Recomendación:
- sortear uniformemente entre las categorías seleccionadas;
- después sortear uniformemente una palabra dentro de esa categoría.

Evitar sesgos derivados de categorías con distinta cantidad de palabras.

---

# 29. Reutilización de palabras

Dentro de una misma partida:

- no repetir la palabra secreta.

Idealmente, mientras exista una sala activa:
- evitar repetir palabras recientes.

No es necesario guardar un historial permanente.

---

# 30. Chat realtime

En modalidad virtual debe existir chat utilizando Socket.IO.

Características:

- mensajes en tiempo real;
- nickname;
- timestamp;
- autoscroll;
- indicador de mensajes no leídos;
- límite de longitud;
- rate limiting;
- anti-spam;
- sanitización.

No usar HTML enviado por el usuario.

Renderizar mensajes como texto.

---

# 31. Eventos Socket.IO

Diseñar eventos explícitos y tipados.

Ejemplos:

```text
room:create
room:list
room:join
room:leave
room:update
room:start
room:kick
room:settings-update

game:start
game:state
game:private-info
game:turn-start
game:clue-submit
game:round-start
game:voting-start
game:vote-submit
game:vote-result
game:elimination
game:reveal
game:win
game:next-round

chat:send
chat:message

player:connected
player:disconnected
player:reconnected
```

No aceptar eventos arbitrarios.

---

# 32. Máquina de estados

Implementar una máquina de estados clara.

Por ejemplo:

```ts
type GamePhase =
  | "LOBBY"
  | "ASSIGNING"
  | "CLUE_PHASE"
  | "VOTING"
  | "ROUND_RESULT"
  | "GAME_OVER";
```

El servidor debe rechazar operaciones incompatibles con la fase.

Ejemplo:

Si la partida está en:

```text
VOTING
```

un cliente no puede enviar una pista.

---

# 33. Votación

Al final de cada ronda:

- cada jugador elegible vota;
- los jugadores eliminados no pueden votar;
- un jugador no puede votar a sí mismo, salvo que se configure explícitamente lo contrario;
- el servidor valida todos los votos;
- un jugador debe votar una única vez.

Mostrar:

```text
¿Quién creés que es el impostor?
```

Al cerrar la votación:

- contar votos;
- determinar eliminado;
- resolver empates.

---

# 34. Empates de votación

Debe existir una regla determinista.

Recomendación:

### Primera instancia
Si hay empate:

```text
VOTACIÓN DE DESEMPATE
```

Solamente los jugadores restantes vuelven a votar entre los empatados.

Si vuelve a existir empate:

- no se elimina a nadie;
- comenzar siguiente ronda.

Dejar esta regla implementada y documentada.

---

# 35. Revelación del eliminado

Configurable:

```text
¿Revelar si el eliminado era impostor?
Sí / No
```

### Sí

Mostrar:

```text
Franco fue eliminado.

Era el IMPOSTOR.
```

o:

```text
Franco fue eliminado.

NO era el impostor.
```

### No

Mostrar solamente:

```text
Franco fue eliminado.
```

---

# 36. Impostores que se conocen

Configurar:

```text
¿Los impostores saben quiénes son entre sí?
Sí / No
```

## Sí

Cada impostor recibe:

```text
IMPOSTOR

Tus compañeros:
- Franco
- Juan
```

## No

Cada impostor recibe únicamente:

```text
IMPOSTOR
```

o su pista, si corresponde.

No filtrar esta información al cliente de jugadores normales.

---

# 37. Presencial — un único dispositivo

Crear UX específica.

Ejemplo:

```text
Turno de:

FRANCO

No mires, resto del grupo.

[ VER MI PALABRA ]
```

Después:

```text
Tu palabra es:

MARTILLO

[ OCULTAR Y PASAR ]
```

Antes de pasar al siguiente:

```text
Pasale el teléfono al próximo jugador.

[ CONTINUAR ]
```

El frontend debe minimizar la posibilidad accidental de mostrar la información privada.

---

# 38. UX de partida

La aplicación debe mostrar claramente:

- ronda;
- jugadores restantes;
- turno actual;
- quién ya dio su pista;
- tiempo restante si existe temporizador;
- fase actual;
- estado de conexión;
- chat cuando corresponda.

---

# 39. Temporizador

Agregar en la configuración:

```text
Límite de tiempo por pista
```

Opciones sugeridas:

```text
Sin límite
15 segundos
30 segundos
45 segundos
60 segundos
```

El servidor debe ser la autoridad del temporizador.

No confiar solamente en `setTimeout` del frontend.

Si un jugador se queda sin tiempo:
- marcarlo automáticamente como omitido;
- pasar al siguiente.

---

# 40. Reglas de abandono

Si un jugador se desconecta:

## En lobby
Eliminarlo después de un pequeño grace period.

## En partida
Dar un margen de reconexión.

Ejemplo:

```text
30 segundos
```

Si vuelve:
- recuperar su identidad de jugador;
- conservar su lugar;
- continuar normalmente.

Si no vuelve:
- marcarlo como abandonado;
- resolver la partida de acuerdo con reglas seguras.

---

# 41. Reconexión

Implementar:

- reconnect automático Socket.IO;
- sesión temporal del jugador;
- room code;
- playerId;
- token temporal firmado o mecanismo equivalente.

Nunca permitir que un usuario pueda tomar la identidad de otro simplemente enviando su `playerId`.

---

# 42. Host / creador

El creador de la sala será el host.

Debe poder:

- modificar configuración antes de empezar;
- iniciar partida;
- expulsar jugadores;
- cerrar sala.

Si el host se desconecta:

Implementar transferencia automática al siguiente jugador activo.

Ejemplo:

```text
host -> siguiente jugador conectado en orden de entrada
```

---

# 43. Expulsar jugadores

El host puede expulsar jugadores solamente durante:

```text
LOBBY
```

Opcionalmente permitir expulsión durante partida únicamente bajo una acción claramente definida.

El host no puede:
- asignar impostores manualmente;
- revelar palabras;
- manipular votos;
- modificar resultados.

---

# 44. Seguridad OWASP

Aunque el juego tenga una superficie relativamente pequeña, implementar buenas prácticas.

## Validación de entrada
Validar todo payload del cliente.

Usar esquemas.

## XSS
- escapar contenido;
- no usar `dangerouslySetInnerHTML`;
- sanitizar mensajes.

## Injection
Nunca construir queries/commands con strings del usuario.

## Rate limiting
Aplicar límites para:
- crear salas;
- unirse;
- enviar mensajes;
- votar;
- emitir pistas;
- acciones de juego.

## Brute force
Limitar intentos de:
- códigos;
- contraseñas.

## CSRF
Si existen endpoints HTTP con cookies/sesiones, implementar protección adecuada.

## CORS
Configurar whitelist de dominios.

Nunca:

```text
Access-Control-Allow-Origin: *
```

en producción para endpoints sensibles.

## Secrets
Nunca poner:
- claves;
- secretos;
- tokens privados

en el frontend.

Usar `.env`.

Crear `.env.example`.

## Headers
Utilizar:
- Helmet;
- Content Security Policy apropiada;
- X-Content-Type-Options;
- Referrer-Policy;
- etc.

## Dependencias
Mantener dependencias actualizadas y ejecutar auditorías.

## Socket.IO
Validar todos los eventos y limitar tamaño máximo de payload.

## Logging
Nunca loguear:
- palabra secreta;
- lista privada de impostores;
- contraseñas;
- tokens.

---

# 45. Prevención de información accidental

Este punto es crítico.

El frontend NO debe recibir:

```text
secretWord
impostors
private clues of other players
```

salvo cuando sea explícitamente necesario para ese jugador.

Pensar siempre:

> “¿Podría abrir DevTools y descubrir la palabra secreta mirando el estado de React?”

La respuesta debe ser NO.

La palabra secreta debe estar solamente en la memoria del backend y ser enviada de forma privada al jugador correspondiente cuando corresponda.

---

# 46. Diseño visual

Nombre:

# IMPOSTOR

Estética:

- rojo oscuro;
- negro;
- bordó;
- transparencias;
- glassmorphism;
- blur;
- sombras profundas;
- bordes suaves;
- sensación de misterio;
- estética tenebrosa;
- moderna;
- premium;
- gamer/social sin parecer una copia de Among Us.

Evitar:
- interfaz infantil;
- exceso de neón;
- demasiados colores;
- aspecto genérico de dashboard.

---

# 47. Paleta visual sugerida

No hace falta obedecer exactamente estos valores, pero utilizar una dirección similar:

```text
Background:
#09090B

Surface:
rgba(255,255,255,0.05)

Glass:
rgba(255,255,255,0.07)

Primary:
rojo oscuro / rojo carmesí

Danger:
rojo intenso

Text:
blanco / gris frío

Muted:
gris oscuro
```

Agregar:
- gradientes sutiles;
- glow rojo muy moderado;
- blur;
- overlays.

---

# 48. Responsive

La app debe ser realmente usable desde:

- iPhone;
- Android;
- tablet;
- notebook;
- desktop.

No hacer simplemente “desktop que se encoge”.

Diseñar mobile-first.

En especial:

- botones grandes;
- área táctil suficiente;
- input cómodos;
- modal correctamente adaptado;
- chat usable con teclado móvil;
- pantalla de palabra secreta clara;
- evitar scroll horizontal.

---

# 49. Accesibilidad

Implementar:

- contraste adecuado;
- labels;
- foco visible;
- navegación por teclado;
- aria-labels donde correspondan;
- botones accesibles;
- feedback visual;
- no depender exclusivamente del color.

---

# 50. Pantallas mínimas

Crear al menos:

### Home
- logo IMPOSTOR
- Crear sala
- Unirse a sala
- Lobby

### Crear sala
- nickname
- modalidad
- privacidad
- contraseña si corresponde
- cantidad de jugadores
- impostores
- categorías
- pistas
- si los impostores se conocen
- revelación de rol del eliminado
- temporizador
- crear

### Lobby
- lista de salas
- filtros
- búsqueda
- unirse
- salas públicas/privadas

### Sala
- jugadores
- configuración
- código
- QR
- host
- botón iniciar
- chat si corresponde

### Pantalla de información privada
- palabra / impostor / pista

### Turnos
- jugador actual
- pista enviada
- tiempo

### Votación
- lista de jugadores
- selección
- confirmar

### Resultado de voto
- eliminado
- revelación según configuración

### Victoria
- quién ganó
- estadísticas de la partida
- jugar otra vez
- volver al lobby

---

# 51. Estadísticas de partida

Al finalizar, mostrar información divertida:

- número de rondas;
- cantidad de pistas;
- impostores;
- ganador;
- jugadores eliminados;
- duración.

Opcionalmente:
- quién recibió más votos;
- quién sobrevivió más;
- jugador con más votos.

No hace falta guardar estas estadísticas después de cerrar la sala.

---

# 52. Animaciones

Usar animaciones sutiles:

- entrada de cartas;
- reveal de palabra;
- transición de fase;
- countdown;
- eliminación;
- victoria.

No abusar.

La prioridad es:
1. legibilidad;
2. velocidad;
3. funcionalidad.

---

# 53. Sonidos

Preparar arquitectura para sonido, aunque puede ser opcional en el MVP.

Posibles sonidos:
- inicio de turno;
- último segundo;
- voto;
- eliminación;
- victoria.

Agregar switch:

```text
Sonido: ON/OFF
```

---

# 54. Ideas adicionales que recomiendo incorporar

Implementar como parte del MVP cuando no compliquen demasiado:

## A. Modo espectador para eliminados
Un jugador eliminado puede:
- ver la partida;
- no votar;
- no dar pistas;
- opcionalmente mantener el chat.

## B. Revancha
Al finalizar:
```text
Jugar otra vez
```

manteniendo jugadores de la sala pero sorteando:
- nueva palabra;
- nuevos impostores;
- mismo host/configuración.

## C. Filtro de categorías favoritas
En la creación de sala:

```text
Mis categorías
```

pero sin cuentas todavía.

## D. Confirmación antes de iniciar
Mostrar resumen:

```text
8 jugadores
2 impostores
4 categorías
Pista contextual
Impostores se conocen
Revelación activada
```

## E. Estado de conexión
Mostrar:
- conectado;
- reconectando;
- desconectado.

## F. Copiar invitación
Botón:

```text
Copiar invitación
```

con:

```text
¡Entrá a mi sala de Impostor!
Código: K7F9Q
```

---

# 55. Ideas futuras — NO son obligatorias para el MVP

Preparar arquitectura para poder agregar después:

- cuentas;
- login con Google/Discord;
- perfiles;
- estadísticas globales;
- rankings;
- amigos;
- historial;
- skins;
- sonidos personalizados;
- packs de categorías;
- categorías creadas por usuarios;
- partidas privadas persistentes;
- moderación;
- reportes;
- chat de voz;
- emojis/reacciones;
- power-ups;
- modo “todos impostores”;
- modo “uno contra todos”;
- eventos especiales.

No desarrollar estas funcionalidades en el MVP salvo que no agreguen complejidad relevante.

---

# 56. Reglas para categorías y palabras personalizadas en el futuro

Diseñar interfaces que permitan eventualmente:

```ts
Category {
  id
  name
  description
  words[]
}
```

y:

```ts
WordEntry {
  word
  contextClue
  aliases?
  metadata?
}
```

No hardcodear toda la lógica en componentes React.

---

# 57. API HTTP

Implementar solamente endpoints necesarios.

Por ejemplo:

```text
GET /health
GET /api/categories
GET /api/rooms
POST /api/rooms
POST /api/rooms/:code/join
```

Pero la sincronización principal de una sala debe ser realtime mediante Socket.IO.

No hacer polling constante.

---

# 58. Realtime como fuente principal

Cuando ocurra algo importante:

- jugador entra;
- jugador sale;
- host cambia configuración;
- comienza partida;
- comienza turno;
- termina turno;
- votación;
- eliminación;
- victoria;

emitir evento realtime.

---

# 59. Estado del servidor

Crear una estructura fuerte y tipada.

Ejemplo conceptual:

```ts
interface Room {
  id: string;
  code: string;
  visibility: "public" | "private";
  passwordHash?: string;
  mode: "virtual" | "single-device" | "multi-device";
  hostId: string;
  players: Map<string, Player>;
  settings: RoomSettings;
  game?: GameState;
  createdAt: number;
}
```

Y:

```ts
interface GameState {
  phase: GamePhase;
  round: number;
  secretWord: WordEntry;
  secretCategory: string;
  impostorIds: Set<string>;
  currentTurnIndex: number;
  turnOrder: string[];
  clues: Map<string, string>;
  votes: Map<string, string>;
  eliminatedPlayerIds: Set<string>;
}
```

Los campos sensibles jamás deben serializarse accidentalmente hacia todos los clientes.

Crear serializers separados:

```text
toPublicRoomState()
toPlayerPrivateState()
toHostState()
```

---

# 60. Testing

Crear tests automáticos para:

## Game engine
- asignación de impostores;
- reglas de cantidad;
- selección de palabras;
- generación de pistas;
- turnos;
- eliminación;
- empates;
- condiciones de victoria;
- múltiples impostores;
- reconexión.

## Security
- payload inválido;
- voto inválido;
- intento de votar dos veces;
- votar siendo eliminado;
- modificar estado sin autorización;
- acceso a información privada.

## API / Socket
Tests de integración para:
- crear sala;
- unirse;
- comenzar;
- jugar ronda;
- votar;
- finalizar.

---

# 61. Lint / formatting / calidad

Configurar:

- ESLint
- Prettier
- TypeScript strict
- scripts npm:

```text
npm run dev
npm run build
npm run test
npm run lint
npm run typecheck
npm run validate-data
```

Idealmente:

```text
npm run check
```

que ejecute todos los checks.

---

# 62. Variables de entorno

Crear:

```text
.env.example
```

con variables como:

```text
NODE_ENV=
PORT=
CLIENT_URL=
PUBLIC_APP_URL=
CORS_ORIGIN=
```

Nunca incluir secretos reales.

---

# 63. README

Crear documentación que explique:

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Test

```bash
npm run test
```

## Build

```bash
npm run build
```

## Variables de entorno

Explicar cada variable.

## Deploy

Explicar:

### Frontend
Vercel.

### Backend
Railway/Render/Fly o equivalente.

Indicar cómo configurar:
- URL del frontend;
- CORS;
- Socket.IO;
- variables de entorno.

---

# 64. Escalabilidad futura

La primera versión puede utilizar:

```text
1 instancia Node
+
memoria RAM
```

Si posteriormente se escala horizontalmente, la arquitectura debe poder migrar a:

```text
Frontend
   ↓
Load Balancer
   ↓
Node Server 1
Node Server 2
Node Server 3
   ↓
Redis
```

Redis debería utilizarse para:
- estado compartido;
- Socket.IO adapter;
- pub/sub;
- locks si fueran necesarios.

No implementar Redis todavía salvo que simplifique algo.

---

# 65. Manejo de errores

Nunca mostrar stack traces al usuario.

Mostrar mensajes como:

```text
No pudimos conectarte a la sala.
```

o:

```text
La sala ya no existe.
```

o:

```text
La partida ya comenzó.
```

En desarrollo sí se pueden mostrar errores técnicos en logs.

---

# 66. Estados de sala

Usar estados claros:

```text
WAITING
STARTING
IN_GAME
FINISHED
CLOSED
```

No permitir ingresar a salas cerradas.

No permitir cambiar configuración una vez iniciada la partida.

---

# 67. Reglas de inicio

Una partida solamente puede comenzar si:

- host es válido;
- cantidad de jugadores >= mínimo;
- cantidad de impostores es válida;
- existe al menos una categoría;
- los jugadores requeridos están conectados;
- configuración válida.

Al iniciar:
1. congelar configuración;
2. congelar jugadores activos;
3. sortear palabra;
4. sortear impostores;
5. generar pistas necesarias;
6. generar orden;
7. enviar información privada;
8. comenzar primer turno.

---

# 68. Aleatoriedad

Usar una fuente de aleatoriedad adecuada del servidor.

No confiar en:

```js
Math.random()
```

para decisiones críticas si puede evitarse.

Usar APIs criptográficas de Node.js para las decisiones relevantes.

---

# 69. No filtrar información en logs

Nunca imprimir:

```text
secretWord
impostorIds
private clues
room password
session token
```

en producción.

---

# 70. UX para conexión perdida

Si se cae la conexión:

Mostrar:

```text
Reconectando...
```

Si reconecta:

```text
Conexión restaurada
```

Si falla definitivamente:

```text
No pudimos reconectarte
```

y permitir volver a entrar mediante el enlace/código.

---

# 71. Estados privados del impostor

Ejemplo:

```text
┌────────────────────┐
│      IMPOSTOR      │
│                    │
│ No recibiste       │
│ la palabra.        │
│                    │
│ Pista contextual:  │
│ Argentina          │
└────────────────────┘
```

Si los impostores se conocen:

```text
Tus compañeros:

• Juan
• Pedro
```

Esto debe ser una respuesta privada del backend.

---

# 72. Experiencia de una ronda

Ejemplo:

```text
RONDA 2

Turno de:
FRANCO

Palabra secreta:
MARTILLO

Franco dice:
"Construcción"

↓

Turno de:
JUAN

...

↓

VOTACIÓN

¿Quién es el impostor?
```

El impostor debe poder leer las pistas anteriores y utilizar el chat/flujo para inferir la palabra.

---

# 73. Importante sobre la palabra secreta

No revelar la palabra secreta:
- en URLs;
- en query strings;
- en localStorage;
- en sessionStorage;
- en Redux/Zustand global enviado innecesariamente;
- en HTML inicial;
- en datos públicos de la sala;
- en eventos globales.

---

# 74. LocalStorage

Se puede utilizar solamente para datos no sensibles, por ejemplo:

```text
nickname
preferencias de sonido
preferencias visuales
```

No almacenar:
- palabra;
- rol;
- impostores;
- tokens sensibles innecesarios.

---

# 75. Protección frente a manipulación del cliente

Suposición:

> El cliente es hostil.

Por lo tanto:
- el cliente puede falsificar requests;
- el cliente puede modificar JavaScript;
- el cliente puede usar DevTools;
- el cliente puede emitir eventos directamente.

El backend debe rechazar acciones inválidas.

---

# 76. Seguridad de Socket.IO

Configurar:

- origin restrictions;
- transports adecuados;
- max payload;
- middleware de autenticación/identidad temporal;
- límites por IP/room;
- rate limit.

No confiar en:

```js
socket.handshake.auth.playerId
```

como prueba única de identidad.

Validar sesión/token firmado.

---

# 77. Moderación básica del chat

Sin construir un sistema enorme, implementar:

- límite de longitud;
- rate limit;
- cooldown;
- bloqueo temporal por spam;
- sanitización;
- mensajes del sistema distinguibles.

---

# 78. Sonido y vibración móvil

Para ciertos eventos, cuando el navegador lo permita:

- vibración al recibir turno;
- vibración en cuenta regresiva;
- sonido de votación.

Respetar políticas de autoplay del navegador.

---

# 79. PWA

Dejar el proyecto preparado para poder transformarse en PWA.

Puede ser útil especialmente en teléfonos.

Como mínimo:
- manifest;
- iconos;
- mobile viewport;
- estructura compatible.

Service worker offline completo no es prioritario porque el juego requiere realtime.

---

# 80. Acceso mediante URL

Soportar:

```text
/join/:roomCode
```

Al abrir:

1. detectar código;
2. cargar sala;
3. mostrar formulario de nickname;
4. si corresponde, pedir contraseña;
5. conectarse;
6. entrar.

---

# 81. Lobby en realtime

Cuando una sala se:
- crea;
- llena;
- elimina;
- cierra;
- comienza;

el lobby debe actualizarse.

Evitar actualizar por polling cada pocos segundos.

---

# 82. Evitar fugas por el lobby

El listado público nunca debe incluir:

- palabra secreta;
- impostores;
- configuración privada sensible;
- password hash.

---

# 83. Diseño de componentes

Crear componentes pequeños y mantenibles.

Ejemplos:

```text
Button
GlassCard
Modal
Input
Select
Toggle
PlayerAvatar
PlayerList
RoomCard
QRCodeCard
ChatPanel
GamePhaseBanner
PrivateRoleCard
VotePanel
Timer
ConnectionStatus
```

---

# 84. Diseño de datos compartidos

Compartir tipos mediante:

```text
packages/shared
```

Ejemplos:

```ts
RoomSettings
Player
RoomSummary
GamePhase
ChatMessage
WordEntry
```

Así se evita duplicar tipos frontend/backend.

---

# 85. No crear una base de datos “por las dudas”

No agregar:
- MongoDB;
- PostgreSQL;
- MySQL;
- Firebase;

solo porque “es lo normal”.

En esta versión se requiere deliberadamente:

```text
sin DB
```

El objetivo es que las partidas sean efímeras.

---

# 86. Preparación para producción

Antes de considerar terminado:

- `npm run build` funciona;
- `npm run typecheck` funciona;
- `npm run lint` funciona;
- tests pasan;
- dataset validado;
- no hay secretos commiteados;
- CORS configurado;
- errores manejados;
- reconnect probado;
- múltiples celulares probados;
- modo un dispositivo probado;
- QR probado;
- lobby probado;
- sala privada probada;
- empate de votos probado;
- varios impostores probados;
- condiciones de victoria probadas.

---

# 87. Criterios de aceptación

La app se considera funcional únicamente cuando una persona puede:

### Flujo 1
1. Abrir la web.
2. Crear sala.
3. Compartir código/QR.
4. Entrar desde varios celulares.
5. Ver jugadores.
6. Iniciar.
7. Recibir su información privada.
8. Dar pistas.
9. Votar.
10. Ver resultado.
11. Seguir rondas.
12. Ganar/perder correctamente.

### Flujo 2
Jugar toda una partida utilizando un único teléfono y pasándolo entre jugadores.

### Flujo 3
Crear sala privada.
Entrar mediante:
- lobby/código;
- QR;
- enlace.

Verificar que:
- el acceso mediante código/QR no solicite contraseña según las reglas indicadas.

### Flujo 4
Partida con:
- 2 o más impostores;
- impostores que se conocen;
- impostores que no se conocen.

### Flujo 5
Partida con:
- revelación del rol;
- sin revelación del rol.

### Flujo 6
Desconectar un jugador y reconectarlo.

---

# 88. Prioridades

Orden de prioridad:

## P0 — obligatorio
- salas;
- lobby;
- Socket.IO;
- juego;
- impostores;
- votación;
- victoria;
- modos;
- QR;
- responsive;
- seguridad básica;
- datasets;
- tests.

## P1 — muy recomendable
- reconexión;
- chat robusto;
- timers;
- host transfer;
- revancha;
- espectador.

## P2 — futuro
- cuentas;
- ranking;
- estadísticas globales;
- amigos;
- monetización;
- contenido premium.

No permitir que una funcionalidad P2 bloquee P0.

---

# 89. Preguntas que quedan como decisiones de producto

El proyecto debe poder desarrollarse sin esperar necesariamente estas respuestas, usando los defaults recomendados.

## Pregunta 1 — ¿Los jugadores pueden ver las pistas anteriores?
**Recomendación:** sí.

Hace el juego más interesante y permite que el impostor deduzca la palabra.

## Pregunta 2 — ¿El jugador eliminado puede seguir mirando?
**Recomendación:** sí, modo espectador.

## Pregunta 3 — ¿Los eliminados pueden usar el chat?
**Recomendación:** sí, pero con una etiqueta de espectador.

## Pregunta 4 — ¿Se puede cambiar de host?
**Recomendación:** automático cuando el host abandona.

## Pregunta 5 — ¿Votación secreta?
**Recomendación:** sí.

Nadie debe conocer el voto de los demás antes del resultado.

## Pregunta 6 — ¿Se puede no votar?
**Recomendación:** no.

Todos los jugadores elegibles deben votar, salvo desconexión/time-out.

## Pregunta 7 — ¿Qué pasa si un jugador se desconecta durante su turno?
**Recomendación:** esperar un breve tiempo y luego saltarlo.

## Pregunta 8 — ¿Se permite repetir pistas?
**Recomendación:** técnicamente sí, pero mostrar advertencia si se quiere evitar.

## Pregunta 9 — ¿Se pueden usar frases o solamente una palabra?
**Recomendación:** permitir una pista corta/frase breve, pero limitar longitud.

---

# 90. Mejoras de diseño que considero especialmente importantes

Implementar estas mejoras si no complican el MVP:

### A. “No mires”
En el modo de un dispositivo, utilizar una pantalla de transición y requerir una acción clara antes de revelar información.

### B. Confirmación antes de revelar
Reducir al máximo el riesgo de que un jugador vea accidentalmente la información del anterior.

### C. Información de fase siempre visible
El jugador siempre debe saber si está:
- esperando;
- dando pista;
- votando;
- viendo resultado.

### D. Animación de tensión
Usar pequeños movimientos/glows durante la votación y victoria.

### E. Acciones peligrosas con confirmación
Ejemplo:
- abandonar sala;
- cerrar sala;
- reiniciar.

---

# 91. SEO y metadata

Aunque el producto sea una app realtime:

Configurar:

- title;
- description;
- Open Graph;
- Twitter/X cards si corresponde;
- favicon;
- theme color.

Título:

```text
Impostor — El juego de descubrir al impostor
```

---

# 92. Objetivo final

Quiero una aplicación que se sienta como un **producto real listo para publicar**, no como una demo técnica.

La experiencia debería ser:

```text
Entrar
↓
Crear o buscar sala
↓
Compartir
↓
Jugar
↓
Acusar
↓
Eliminar
↓
Descubrir
↓
Ganar
↓
Revancha
```

La interfaz debe ser rápida, intuitiva, atractiva y especialmente buena en celular.

---

# 93. Regla final para la IA programadora

No limites la implementación a cumplir literalmente los puntos anteriores.

Cuando encuentres un problema de UX, seguridad, arquitectura o gameplay:

1. detectalo;
2. elegí una solución razonable;
3. implementala;
4. documentá brevemente la decisión;
5. continuá.

No me pidas permiso para cada decisión técnica menor.

Si existe una contradicción entre:
- facilidad de uso;
- seguridad;
- consistencia del juego;

priorizá:

```text
1. integridad del juego
2. seguridad
3. experiencia de usuario
4. simplicidad del código
```

Y si una decisión de producto realmente requiere una respuesta humana, dejala documentada en:

```text
docs/OPEN_QUESTIONS.md
```

sin bloquear el resto de la implementación.

---

# 94. Entregables obligatorios

Al finalizar, entregar:

1. Código completo.
2. Frontend completo.
3. Backend completo.
4. Game engine.
5. Socket.IO.
6. Datasets.
7. Validador de datasets.
8. Tests.
9. README.
10. `.env.example`.
11. Instrucciones de desarrollo local.
12. Instrucciones de deploy.
13. Documentación de arquitectura.
14. Documento de decisiones técnicas.
15. Documento con preguntas abiertas.
16. Build funcional.

---

# 95. Importante sobre los datasets

No generar datos obviamente inventados como relleno únicamente para llegar al número 1000.

Es preferible:

```text
900 entradas buenas
```

antes que:

```text
1000 entradas falsas o repetidas
```

Sin embargo, en categorías donde razonablemente sea posible conseguir/generar 1000+ elementos de buena calidad, superar las 1000 entradas.

Para categorías de entidades reales (por ejemplo personas, equipos, películas, series, etc.), priorizar nombres conocidos y correctos.

No generar información biográfica específica falsa para crear pistas.

Las pistas deben ser:
- simples;
- útiles;
- verificables;
- relacionadas;
- no excesivamente reveladoras.

---

# 96. Arquitectura final recomendada

```text
                    ┌──────────────────────┐
                    │       VERCEL         │
                    │      React App       │
                    └──────────┬───────────┘
                               │
                               │ HTTPS / Socket.IO
                               ▼
                    ┌──────────────────────┐
                    │   NODE.JS SERVER     │
                    │     Express + IO     │
                    ├──────────────────────┤
                    │ Game Engine          │
                    │ Room Manager         │
                    │ Session Manager      │
                    │ Validation           │
                    │ Rate Limiting        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     IN-MEMORY        │
                    │   ACTIVE ROOMS/GAMES │
                    └──────────────────────┘
```

Futuro:

```text
Node.js
   ↓
Redis
   ↓
multiple server instances
```

---

# 97. Primera tarea al comenzar el desarrollo

Antes de escribir una gran cantidad de código:

1. Crear la estructura del proyecto.
2. Definir tipos compartidos.
3. Definir el modelo de Room/Game.
4. Diseñar la máquina de estados.
5. Implementar el game engine.
6. Escribir tests del game engine.
7. Implementar Socket.IO.
8. Implementar lobby/salas.
9. Implementar UI.
10. Conectar frontend y backend.
11. Incorporar datasets.
12. Implementar seguridad.
13. Testear flujo completo.
14. Preparar deploy.

No construir primero pantallas bonitas y dejar la lógica para después.

La **máquina de estados y el game engine son la fuente de verdad del gameplay**.

---

# 98. Resultado esperado

Al ejecutar la aplicación en local debe poder hacerse:

```text
npm install
npm run dev
```

y tener:

- frontend funcionando;
- backend funcionando;
- Socket.IO funcionando;
- posibilidad de abrir múltiples navegadores/teléfonos;
- crear una sala;
- compartirla;
- jugar una partida completa.

Ese es el criterio mínimo de éxito.

# 99. DECISIONES DEFINITIVAS DEL PRODUCTO

Las decisiones de esta sección tienen prioridad sobre cualquier recomendación anterior que entre en conflicto con ellas.

## 99.1 Modos de juego

No crear modos artificialmente separados para “clásico”, “con pista”, etc. Existe un único juego base y sus reglas se configuran al crear la sala.

La configuración puede definir, entre otras cosas:

- cantidad de impostores;
- si los impostores se conocen entre sí;
- si reciben pista;
- tipo de pista;
- revelación del rol del eliminado;
- última oportunidad del impostor;
- votación anónima o pública;
- duración de discusión;
- duración de turnos;
- duración de votación;
- modalidad presencial/virtual;
- un dispositivo/múltiples dispositivos;
- pista oral/escrita en presencial.

## 99.2 Pistas

La pista contextual debe ser deliberadamente **poco obvia** y dar solamente una ayuda pequeña al impostor.

No implementar niveles de dificultad de palabras.

Usar estos conceptos:

- Pista de categoría.
- Pista contextual.
- Ambas.

Si se selecciona una sola categoría, cuando las pistas están activadas debe utilizarse la pista contextual.

Si se seleccionan dos o más categorías, permitir elegir entre:

- Solo pista de categoría.
- Solo pista contextual.
- Categoría + pista contextual.

## 99.3 Categorías

El usuario puede seleccionar varias categorías, pero al comenzar cada partida se debe sortear **una sola categoría** entre las seleccionadas y después **una sola palabra** dentro de esa categoría.

Ejemplo:

```text
Seleccionadas:
- Jugadores de fútbol
- Películas
- Comida

Categoría sorteada:
Jugadores de fútbol

Palabra:
Lionel Messi
```

La categoría sí es visible para los jugadores normales.

La pista de categoría para el impostor es una mecánica separada de esa información.

## 99.4 Categorías iniciales

Priorizar entre 4 y 6 categorías iniciales muy pulidas en lugar de muchas categorías mediocres.

Primera propuesta:

1. Objetos.
2. Comida.
3. Jugadores de fútbol.
4. Películas.
5. Series.
6. Videojuegos.

Luego podrán agregarse otras categorías.

No implementar categorías personalizadas por jugadores en el MVP.

## 99.5 Pistas de los jugadores

En modalidad presencial debe existir una configuración:

```text
¿Cómo se entregan las pistas?
○ Oralmente
○ Escribiendo en pantalla
```

### Presencial + oral

El jugador dice su pista en voz alta y presiona continuar.

No es necesario guardar el texto de la pista porque el sistema no lo recibe.

### Presencial + escrita

El jugador escribe la pista en el dispositivo.

Las pistas deben:

- aparecer siguiendo el orden de los turnos;
- quedar registradas;
- formar un historial consultable;
- conservarse durante todas las rondas de la partida actual.

## 99.6 Historial de pistas

El historial debe poder consultarse durante la partida cuando la fase lo permita.

Ejemplo:

```text
RONDA 2

FRANCO
“Construcción”

JUAN
“Pesado”

PEDRO
“Metal”
```

No conservar este historial después de destruir la sala.

# 100. ÚLTIMA OPORTUNIDAD DEL IMPOSTOR

Al crear la sala debe existir:

```text
¿El impostor puede intentar adivinar la palabra si es descubierto?
○ Sí
○ No
```

Si está activado, cuando corresponda el impostor debe recibir una interfaz privada para introducir una respuesta.

Ejemplo:

```text
TE DESCUBRIERON

Tenés una última oportunidad.

¿Cuál creés que era la palabra?

[________________]

[ ADIVINAR ]
```

Si acierta, los impostores ganan aunque el impostor ya haya sido identificado por votación.

Si falla, continúa la resolución normal de la partida.

La validación de la respuesta debe realizarse en el backend.

No confiar en el cliente.

# 101. REVELACIÓN DEL ROL

La creación de sala debe permitir:

```text
¿Cuándo revelar el rol del eliminado?
○ Inmediatamente después de la votación
○ Al finalizar la partida
○ Nunca
```

Esta configuración es independiente de la última oportunidad.

# 102. VOTACIÓN

La creación de sala debe permitir:

```text
¿Votación anónima?
○ Sí
○ No
```

Si es anónima, los jugadores no deben poder conocer el voto individual de otros jugadores antes de que se resuelva la votación.

No permitir votar al propio jugador.

Todos los jugadores elegibles deben votar.

## Empates

Si hay empate:

1. iniciar una segunda votación solamente entre los jugadores empatados;
2. si vuelve a empatar, no eliminar a nadie;
3. continuar a la siguiente ronda.

# 103. TIEMPOS

La creación de sala debe permitir configurar:

## Tiempo de pista

```text
Sin límite
15 segundos
30 segundos
45 segundos
60 segundos
```

## Tiempo de discusión

```text
Sin límite
30 segundos
60 segundos
90 segundos
120 segundos
```

## Tiempo de votación

```text
Sin límite
30 segundos
60 segundos
90 segundos
120 segundos
```

Los timers deben ser controlados por el servidor y no solamente por el frontend.

El juego no tiene un máximo de rondas. Termina exclusivamente cuando se cumple una condición de victoria.

# 104. PUNTUACIÓN Y SESIÓN

La puntuación no es global ni persistente.

La sala representa una **sesión** que puede contener varias partidas/revancha.

El sistema debe tener un sistema de puntuación de complejidad intermedia/alta.

Propuesta base:

### Jugador normal

- puntos por ganar;
- puntos por sobrevivir;
- puntos por identificar correctamente a un impostor.

### Impostor

- puntos por ganar;
- puntos por conseguir la eliminación de un inocente;
- puntos por sobrevivir una ronda;
- bonus por acertar la palabra en la última oportunidad.

Los valores deben estar centralizados en una configuración del game engine y ser fáciles de ajustar.

No crear ranking global ni guardar estadísticas después de que la sala desaparezca.

# 105. REVANCHA

Al finalizar una partida debe aparecer:

```text
REVANCHA
```

La sala permanece viva.

Se conservan:

- participantes;
- código de sala;
- enlace/QR;
- configuración actual;
- puntuaciones, si el host elige conservarlas.

Se vuelven a sortear:

- categoría;
- palabra;
- impostores;
- orden inicial.

El host puede cambiar la configuración antes de la nueva partida.

Debe existir:

```text
Puntuación
○ Mantener
○ Reiniciar
```

# 106. NUEVOS JUGADORES DURANTE UNA PARTIDA

Una persona puede entrar a una sala aunque exista una partida activa.

Si entra durante una partida:

- no se convierte en jugador de la partida actual;
- no recibe palabra ni rol;
- queda como espectador;
- podrá participar automáticamente en la siguiente partida si existe lugar.

Esto debe ser fácil y no requerir crear una nueva sala.

# 107. ABANDONO Y RECONEXIÓN

En lobby:
- salir elimina al jugador de la sala.

Durante partida:
- conservar temporalmente su lugar durante un grace period;
- si reconecta, recuperar su identidad y estado;
- si no reconecta, abandonar la partida de forma segura.

El abandono nunca debe romper la máquina de estados.

# 108. CHAT

Todos pueden usar el chat, incluidos espectadores y jugadores eliminados.

Debe existir:

- mensajes de texto;
- timestamp;
- nickname;
- mensajes del sistema;
- reacciones rápidas;
- rate limiting;
- límite de longitud;
- sanitización.

Reacciones sugeridas:

```text
😂 😱 👀 🤨 🔥
```

El chat puede configurarse opcionalmente durante la votación si esa opción resulta útil para el diseño final.

# 109. ESTADÍSTICAS DE PARTIDA

Al finalizar una partida mostrar al menos:

- ganador;
- cantidad de rondas;
- impostores;
- jugadores eliminados;
- duración;
- puntuaciones de la sesión.

Se pueden mostrar estadísticas adicionales, pero no guardar datos de forma permanente.

# 110. MULTIPLES PARTIDAS Y MULTIPLES SALAS SIMULTÁNEAS

La arquitectura debe soportar explícitamente:

```text
Servidor Node
│
├── Sala A
│   └── Partida 3
│
├── Sala B
│   └── Partida 1
│
├── Sala C
│   └── Lobby
│
└── Sala D
    └── Partida 5
```

Una sala es una sesión independiente.

Dentro de cada sala puede haber múltiples partidas consecutivas.

Nunca crear un único `currentGame`, `currentSecretWord` o `currentImpostors` global.

Usar algo equivalente a:

```ts
Map<RoomId, Room>
```

Cada `Room` contiene su propio estado, incluyendo:

```ts
Room {
  id
  code
  hostId
  players
  spectators
  settings
  score
  currentGame
}
```

Y cada `currentGame` contiene únicamente los datos de esa partida.

Por lo tanto, una sala puede estar votando mientras otra está dando pistas y otra permanece en lobby.

No hay ninguna limitación conceptual de “una partida por servidor”.

El límite real estará dado por CPU, RAM, número de sockets y límites del proveedor.

# 111. AISLAMIENTO ENTRE SALAS

Un jugador conectado a una sala jamás puede:

- escuchar eventos de otra sala;
- recibir el chat de otra sala;
- obtener la palabra secreta de otra sala;
- consultar los impostores de otra sala;
- votar en otra sala;
- modificar otra sala.

Usar rooms de Socket.IO y autorización server-side.

# 112. PREPARACIÓN PARA REDIS

Redis NO se utilizará en el MVP salvo que resulte técnicamente necesario.

El MVP almacenará el estado en memoria del servidor Node.

Sin embargo, abstraer el almacenamiento detrás de interfaces como:

```ts
RoomStore
SessionStore
```

para que hoy exista:

```text
RoomStore → RAM
```

y en el futuro pueda existir:

```text
RoomStore → Redis
```

La razón para esta preparación es permitir una futura arquitectura con múltiples instancias Node:

```text
                 ┌── Node #1 ──┐
Clientes ────────┤              ├── Redis
                 └── Node #2 ──┘
```

No instalar ni configurar Redis solamente por “cumplir una buena práctica”.

# 113. REPOSITORIO OBLIGATORIO

Todo el desarrollo debe realizarse dentro del siguiente repositorio:

```text
https://github.com/francososa677/impostor.git
```

El repositorio es la fuente de verdad del proyecto.

La IA programadora debe:

1. trabajar dentro del repositorio;
2. revisar primero el estado actual del repositorio;
3. conservar archivos útiles existentes salvo que exista una razón para reemplazarlos;
4. crear toda la estructura necesaria;
5. implementar frontend, backend, game engine, datasets, tests y documentación allí;
6. mantener el proyecto ejecutable desde ese repositorio;
7. dejar un README actualizado;
8. agregar `.env.example`;
9. no subir secretos ni credenciales;
10. usar commits claros si el entorno permite hacer commits;
11. no inventar otro repositorio ni mover el proyecto a otra ubicación.

Si el repositorio ya contiene código, primero analizarlo y reutilizar lo que sea compatible con esta especificación.

# 114. ESTRUCTURA DE REPOSITORIO RECOMENDADA

Preferentemente:

```text
impostor/
├── apps/
│   ├── web/
│   └── server/
├── packages/
│   ├── shared/
│   └── game-engine/
├── data/
│   └── words/
├── tests/
├── docs/
├── .env.example
├── README.md
├── package.json
└── ...
```

Si la estructura existente del repositorio es razonable y diferente, adaptarla en vez de destruirla innecesariamente.

# 115. CATEGORÍAS Y DATASET DEL MVP

Priorizar entre 4 y 6 categorías iniciales de alta calidad.

Cada categoría grande debe buscar al menos 1000 entradas reales y útiles cuando sea razonable.

No generar relleno artificial, duplicados o nombres falsos únicamente para alcanzar 1000.

Las categorías naturalmente limitadas pueden tener menos entradas.

Cada entrada debe tener como mínimo:

```json
{
  "word": "...",
  "category": "...",
  "contextClue": "..."
}
```

El dataset debe tener un validador automático que compruebe:

- JSON válido;
- duplicados;
- strings vacíos;
- campos faltantes;
- pistas faltantes;
- cantidades mínimas;
- valores inconsistentes.

# 116. RESTRICCIONES DE COMPLEJIDAD

NO implementar en el MVP:

- niveles de dificultad de palabras;
- cuentas de usuarios;
- ranking global;
- base de datos;
- categorías creadas por usuarios;
- monetización;
- funcionalidades sociales globales.

La arquitectura debe poder incorporar estas cosas en el futuro sin depender de ellas ahora.

# 117. CASOS DE PRUEBA OBLIGATORIOS

Probar como mínimo:

1. 6 jugadores / 1 impostor.
2. 8 jugadores / 2 impostores que se conocen.
3. 8 jugadores / 2 impostores que no se conocen.
4. Impostor descubierto y última oportunidad correcta.
5. Impostor descubierto y última oportunidad incorrecta.
6. Empate y segunda votación.
7. Nuevo empate después del desempate.
8. Desconexión y reconexión.
9. Nuevo jugador entrando durante una partida.
10. Nuevo jugador entrando automáticamente en la siguiente.
11. Sala A y Sala B jugando simultáneamente.
12. Dos salas con palabras diferentes y estados independientes.
13. Intento de acceso a información privada de otra sala.
14. Presencial con un solo dispositivo.
15. Presencial con pistas orales.
16. Presencial con pistas escritas e historial.
17. Votación anónima.
18. Votación pública.
19. Revancha manteniendo puntos.
20. Revancha reiniciando puntos.

# 118. OBJETIVO FINAL

El resultado debe sentirse como una aplicación real lista para publicar.

Flujo principal:

```text
Entrar
↓
Crear o buscar sala
↓
Compartir código/QR/enlace
↓
Esperar jugadores
↓
Configurar
↓
Jugar
↓
Dar pistas
↓
Discutir
↓
Votar
↓
Eliminar
↓
Última oportunidad (si está activada)
↓
Determinar ganador
↓
Actualizar puntuación
↓
Revancha o cerrar sesión
```

La aplicación debe estar especialmente optimizada para celulares, pero funcionar correctamente en PC.

# 119. CRITERIO DE ÉXITO TÉCNICO

Desde un clon limpio del repositorio debe ser posible instalar y ejecutar el proyecto con instrucciones claras del README.

Como mínimo:

```bash
npm install
npm run dev
```

debe permitir levantar la aplicación local y jugar una partida completa utilizando varios navegadores/dispositivos.

Además deben funcionar:

```bash
npm run build
npm run test
npm run lint
npm run typecheck
npm run validate-data
```

# 120. PRINCIPIO FINAL PARA LA IA PROGRAMADORA

No detener el trabajo para pedir confirmación ante decisiones técnicas menores.

Cuando falte un detalle no crítico:

1. elegir la opción más consistente con esta especificación;
2. documentarla;
3. implementarla;
4. continuar.

Cuando exista una verdadera decisión de producto no cubierta por el documento, registrar la cuestión en:

```text
docs/OPEN_QUESTIONS.md
```

La prioridad es entregar una aplicación completa, estable, segura, responsive y realmente jugable.
