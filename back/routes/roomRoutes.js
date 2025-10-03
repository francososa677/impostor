import express from "express";
import {
  createRoom,
  getRooms,
  getRoom,
  joinRoom,
  startRoom,
  addWord,
  readyAndNextTurn,
  endVotingAndNextRound,
} from "../services/roomService.js";

const router = express.Router(); // 🔹 Debe ir primero

// Crear sala
router.post("/", (req, res) => {
  try {
    const room = createRoom(req.body);
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Listar salas
router.get("/", (req, res) => {
  res.json(getRooms());
});

// Unirse a sala
router.post("/join", (req, res) => {
  try {
    const { roomName, nickname, password } = req.body;
    const room = joinRoom(roomName, nickname, password);
    res.json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Obtener detalles de la sala
router.get("/:roomName", (req, res) => {
  try {
    const { roomName } = req.params;
    const room = getRoom(roomName);
    if (!room) return res.status(404).json({ error: "Sala no encontrada" });
    const { turnTimeout, ...roomSafe } = room;
    res.json(roomSafe);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Iniciar partida
router.post("/:roomName/start", async (req, res) => {
  try {
    const { roomName } = req.params;
    const { nickname } = req.body;
    const room = await startRoom(roomName, nickname);
    const { turnTimeout, ...roomSafe } = room;
    res.json({ message: "La partida ha comenzado", room: roomSafe });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Marcar jugador como listo y avanzar turno (modo presencial)
router.post("/:roomName/ready", (req, res) => {
  try {
    const { roomName } = req.params;
    const { nickname } = req.body;
    const room = readyAndNextTurn(roomName, nickname);
    const { turnTimeout, ...roomSafe } = room;
    res.json(roomSafe);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Agregar palabra de jugador (modo online)
router.post("/:roomName/word", (req, res) => {
  try {
    const { roomName } = req.params;
    const { nickname, word } = req.body;
    const words = addWord(roomName, nickname, word);
    res.json(words);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Marcar voto de un jugador
router.post("/:roomName/vote", (req, res) => {
  try {
    const { roomName } = req.params;
    const { voter, voted } = req.body;
    const room = getRoom(roomName);
    if (!room) throw new Error("Sala no existe");

    if (!room.votes) room.votes = {};
    if (room.votes[voter]) throw new Error("Ya votaste esta ronda");

    room.votes[voter] = voted;

    // Si todos votaron, calcular eliminado
    if (Object.keys(room.votes).length === room.players.length) {
      endVotingAndNextRound(room);
    }

    res.json({ votes: room.votes, eliminated: room.eliminated || null });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Finalizar votación manual o timer 120s
router.post("/:roomName/endVoting", (req, res) => {
  try {
    const { roomName } = req.params;
    const room = getRoom(roomName);
    if (!room) throw new Error("Sala no existe");

    endVotingAndNextRound(room);

    res.json({ votes: room.votes, eliminated: room.eliminated });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
