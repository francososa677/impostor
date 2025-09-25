📌 Resumen Técnico – Juego “Impostor Fútbol”
🎮 Concepto del Juego

Variante del juego “impostor”, pero con jugadores/equipos de fútbol.

Participan varios jugadores en una sala.

A todos se les asigna un jugador/equipo, excepto al impostor que no recibe información.

En cada ronda:

Los jugadores dicen una palabra relacionada con su asignación.

Se vota quién parece ser el impostor.

Se elimina un jugador y se revisan condiciones de victoria.

Dos modos de juego en la misma app:

Online → las palabras se escriben en la app.

Presencial → las palabras se dicen en persona, pero la votación se hace en la app.

🏗️ Arquitectura General

Frontend: React + TailwindCSS (UI rápida y limpia).

Backend: Node.js + Express + Socket.IO (para tiempo real).

Base de datos (mínima): MySQL + Sequelize (solo lista de jugadores/equipos).

Estado de las partidas: en memoria (se borra al terminar la sala).

📊 Base de Datos (mínima)

Solo se guarda la lista de opciones de asignación:

CREATE TABLE Entities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('player', 'team') NOT NULL
);


Ejemplo de datos: "Messi", "Boca Juniors", "Cristiano Ronaldo".

El backend toma al azar una opción para asignar.

🧠 Backend – Lógica
Estructura de una sala en memoria
{
  code: "ABC123",
  state: "lobby", // lobby | assigning | words | voting | results | finished
  round: 1,
  players: [
    { 
      id: "socketId1", 
      nickname: "Franco", 
      role: "impostor" | "player", 
      assigned: "Messi" | null, 
      alive: true, 
      mode: "online" | "presencial"
    },
    ...
  ]
}

Endpoints principales

POST /room → crear sala (genera código único).

POST /room/:code/join → unirse con nickname + modo.

POST /room/:code/start → asigna roles + jugador/equipo.

Eventos Socket.IO

playerJoined → un jugador entra al lobby.

rolesAssigned → notifica a cada jugador su rol.

sendWord → jugador online envía palabra.

startVoting → pasa a fase de votación.

votePlayer → alguien vota.

roundResult → resultado de la votación (quién fue eliminado).

gameOver → mensaje de fin de partida (ganadores).

🎨 Frontend – Pantallas

Inicio → nickname + código de sala.

Selector de modo → elegir “Online” o “Presencial”.

Lobby → lista de jugadores conectados.

Asignación →

Si sos jugador → muestra el jugador/equipo.

Si sos impostor → cartel “sos el impostor”.

Juego:

Online → input para mandar palabra.

Presencial → cartel “decí tu palabra en persona”.

Votación → lista de jugadores vivos para elegir uno.

Resultado → quién fue eliminado y estado del juego.

Fin del juego → muestra ganadores (impostores o jugadores).

🔄 Flujo de una partida

Lobby → jugadores se conectan y el host inicia.

Asignación → backend reparte roles.

Ronda de palabras →

Online → jugadores escriben palabra en app.

Presencial → jugadores hablan en persona, la app espera.

Votación → todos votan en la app.

Resultado → se elimina alguien.

Condiciones de victoria:

Si impostores eliminados → ganan jugadores.

Si impostores ≥ jugadores → ganan impostores.

Si no, iniciar siguiente ronda.

Fin → pantalla con ganadores.

🚀 Extras a futuro

Ranking de victorias/derrotas (requiere DB).

Chat integrado (para modo online).

Opción para elegir si se juega con jugadores o equipos antes de cada partida.

Posibilidad de mezclar modos (unos online, otros presencial).
