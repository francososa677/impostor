// Obtener todas las salas
function getRooms() {
  return rooms;
}
import { v4 as uuidv4 } from "uuid";
import { Player, Club } from "../models/index.js";
import sequelize from "../config/db.js";

let rooms = [];

// Crear sala
function createRoom({ roomName, password, maxPlayers, impostors, turnTime, mode, type, host }) {
  if (!roomName || !host) throw new Error("Faltan datos requeridos");
  if (typeof roomName !== "string" || !roomName.trim() || /[^a-zA-Z0-9_-]/.test(roomName)) {
    throw new Error("El nombre de la sala es inválido. Usa solo letras, números, guiones y guión bajo.");
  }
  if (rooms.find(r => r.roomName === roomName)) throw new Error("Ya existe una sala con ese nombre");

  const newRoom = {
    id: uuidv4(),
    roomName,
    password: password || null,
    maxPlayers: parseInt(maxPlayers) || 5,
    impostors: parseInt(impostors) || 1,
    turnTime: parseInt(turnTime) || 30,
    mode: mode || "online",
    type: type || "jugadores",
    host,
    players: [host],
    started: false,
    roles: {},
    impostorsAssigned: [],
    assigned: null,
    words: {},
    turnOrder: [],
    turnIndex: 0,
    turnTimeout: null,
    readyPlayers: {},
    votes: {},
    eliminated: null,
    gameOver: false,
    impostorWin: false,
  };

  rooms.push(newRoom);
  return newRoom;
}

// Avanzar turno en modo online con temporizador
function nextTurn(room) {
  clearTimeout(room.turnTimeout);
  // Avanzar al siguiente jugador no eliminado
  do {
    room.turnIndex++;
    const currentPlayer = room.turnOrder[room.turnIndex];
    if (
      room.turnIndex < room.turnOrder.length &&
      room.words[currentPlayer] && room.words[currentPlayer].includes("ELIMINADO")
    ) {
      // Saltar eliminados
      continue;
    } else {
      break;
    }
  } while (room.turnIndex < room.turnOrder.length);

  if (room.turnIndex < room.turnOrder.length) {
    room.turnTimeout = setTimeout(() => {
      const missedPlayer = room.turnOrder[room.turnIndex];
      if (!room.words[missedPlayer]) room.words[missedPlayer] = [];
      room.words[missedPlayer].push("NO ESCRIBIO SU PALABRA");
      nextTurn(room);
    }, room.turnTime * 1000);
  } else {
    room.turnTimeout = null;
  }
}

// Agregar palabra de jugador
function addWord(roomName, nickname, word) {
  const room = rooms.find(r => r.roomName === roomName);
  if (!room) throw new Error("La sala no existe");
  if (room.mode !== "online") throw new Error("Solo disponible en modo online");

  const currentPlayer = room.turnOrder[room.turnIndex];
  if (nickname !== currentPlayer) throw new Error("No es tu turno");

  if (!room.words[nickname]) room.words[nickname] = [];
  room.words[nickname].push(word);

  nextTurn(room);
  return room.words;
}

// Obtener sala
function getRoom(roomName) {
  if (!roomName || typeof roomName !== "string" || !roomName.trim() || /[^a-zA-Z0-9_-]/.test(roomName)) {
    return null;
  }
  return rooms.find(r => r.roomName === roomName) || null;
}

// Unirse a sala
function joinRoom(roomName, nickname, password) {
  const room = rooms.find(r => r.roomName === roomName);
  if (!room) throw new Error("La sala no existe");

  if (room.password && room.password !== password) throw new Error("Contraseña incorrecta");
  if (room.players.includes(nickname)) throw new Error("El jugador ya está en la sala");
  if (room.players.length >= room.maxPlayers) throw new Error("La sala está llena");

  room.players.push(nickname);
  return room;
}

// Marcar listo y avanzar turno modo presencial
function readyAndNextTurn(roomName, nickname) {
  const room = rooms.find(r => r.roomName === roomName);
  if (!room) throw new Error("La sala no existe");
  if (room.mode !== "presencial") throw new Error("Solo disponible en modo presencial");

  let currentPlayer = room.turnOrder[room.turnIndex];
  // Si el jugador actual está eliminado, avanzar turno automáticamente
  while (
    room.turnIndex < room.turnOrder.length &&
    room.words[currentPlayer] && room.words[currentPlayer].includes("ELIMINADO")
  ) {
    room.turnIndex++;
    currentPlayer = room.turnOrder[room.turnIndex];
  }
  if (nickname !== currentPlayer) throw new Error("No es tu turno");

  room.readyPlayers[nickname] = true;

  // Avanzar al siguiente jugador no eliminado
  do {
    room.turnIndex++;
    currentPlayer = room.turnOrder[room.turnIndex];
  } while (
    room.turnIndex < room.turnOrder.length &&
    room.words[currentPlayer] && room.words[currentPlayer].includes("ELIMINADO")
  );
  if (room.turnIndex >= room.turnOrder.length) room.turnTimeout = null;

  return room;
}

// Iniciar partida
async function startRoom(roomName, nickname) {
  const room = rooms.find((r) => r.roomName === roomName);
  if (!room) throw new Error("Sala no existe");
  if (room.host !== nickname) throw new Error("Solo el host puede iniciar la partida");
  if (room.started) throw new Error("La partida ya comenzó");

  room.started = true;
  room.turnOrder = [...room.players].sort(() => Math.random() - 0.5);
  room.turnIndex = 0;

  if (room.mode === "online") {
    room.turnTimeout = setTimeout(() => {
      const missedPlayer = room.turnOrder[room.turnIndex];
      if (!room.words[missedPlayer]) room.words[missedPlayer] = [];
      room.words[missedPlayer].push("NO ESCRIBIO SU PALABRA");
      nextTurn(room);
    }, room.turnTime * 1000);
  }

  // Asignar roles
  const impostorCount = room.impostors;
  const playersCopy = [...room.players];
  const impostors = [];
  while (impostors.length < impostorCount) {
    const index = Math.floor(Math.random() * playersCopy.length);
    const selected = playersCopy.splice(index, 1)[0];
    impostors.push(selected);
  }
  room.impostorsAssigned = impostors;
  room.roles = {};
  room.assigned = {};
  // Asignar jugador/equipo a cada no impostor según el tipo de sala
  let assignedValue = null;
  if (room.type === "club") {
    // Seleccionar club aleatorio
    const club = await Club.findOne({ order: sequelize.random() });
    assignedValue = club ? { name: club.name } : { name: "Club" };
  } else {
    // Seleccionar jugador aleatorio
    const player = await Player.findOne({ order: sequelize.random() });
    assignedValue = player ? { name: player.name } : { name: "Jugador" };
  }
  room.players.forEach(p => {
    if (impostors.includes(p)) {
      room.roles[p] = "impostor";
      room.assigned[p] = null;
    } else {
      room.roles[p] = "jugador";
      room.assigned[p] = assignedValue;
    }
  });

  return room;
}

// Reset votos
function resetVotes(room) {
  room.votes = {};
  room.eliminated = null;
}

// Finalizar votación y pasar a la siguiente ronda
function endVotingAndNextRound(room) {
  // Contar votos
  const counts = {};
  Object.values(room.votes || {}).forEach(p => counts[p] = (counts[p] || 0) + 1);

  let maxVotes = 0;
  let eliminated = [];
  for (const player in counts) {
    if (counts[player] > maxVotes) {
      maxVotes = counts[player];
      eliminated = [player];
    } else if (counts[player] === maxVotes) {
      eliminated.push(player);
    }
  }

  room.eliminated = eliminated.length === 1 ? eliminated[0] : null;

  if (room.eliminated) {
    if (!room.words[room.eliminated]) room.words[room.eliminated] = [];
    room.words[room.eliminated].push("ELIMINADO");
  }

  // Determinar jugadores vivos
  const alivePlayers = room.players.filter(p => !room.words[p]?.includes("ELIMINADO"));
  const aliveNonImpostors = alivePlayers.filter(p => room.roles[p] !== "impostor");
  const aliveImpostors = alivePlayers.filter(p => room.roles[p] === "impostor");

  let gameOver = false;
  let impostorWin = false;

  if (aliveImpostors.length === 1 && aliveNonImpostors.length < 2) {
    gameOver = true;
    impostorWin = true;
  }
  if (aliveImpostors.length === 2 && aliveNonImpostors.length < 3) {
    gameOver = true;
    impostorWin = true;
  }
  if (aliveImpostors.length === 0) gameOver = true;

  if (!gameOver) {
    // Verificar si el impostor fue eliminado en esta ronda
    const impostorEliminado = room.eliminated && room.roles[room.eliminated] === "impostor";
    if (impostorEliminado) {
      room.gameOver = true;
      room.impostorWin = false;
      return room;
    }
    // Reiniciar ronda y saltar eliminados al inicio
    room.turnIndex = 0;
    // Saltar eliminados al principio de la ronda
    while (
      room.turnIndex < room.turnOrder.length &&
      room.words[room.turnOrder[room.turnIndex]] && room.words[room.turnOrder[room.turnIndex]].includes("ELIMINADO")
    ) {
      room.turnIndex++;
    }
    room.votes = {};
    // room.eliminated NO se resetea aquí, para que el frontend lo muestre
    room.readyPlayers = {};
    room.gameOver = false;
    room.impostorWin = false;
    room.votingStart = Date.now(); // Nuevo timestamp de inicio de votación
  } else {
    room.gameOver = true;
    room.impostorWin = impostorWin;
  }

  return room;
}

export {
  createRoom,
  getRooms,
  getRoom,
  joinRoom,
  startRoom,
  addWord,
  readyAndNextTurn,
  resetVotes,
  endVotingAndNextRound,
};

