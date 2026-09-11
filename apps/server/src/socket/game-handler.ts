import { Socket, Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  submitClueSchema,
  submitVoteSchema,
  lastChanceGuessSchema,
} from "@impostor/shared";
import { GameEngine } from "@impostor/game-engine";
import { globalRoomStore } from "../store/room-store.js";
import { WordDataLoader } from "../store/data-loader.js";
import { TimerService } from "../services/timer-service.js";

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerGameHandlers(io: TypedServer, socket: TypedSocket) {
  // 1. Start Game (Host only)
  socket.on("game:start", (callback) => {
    try {
      const roomCode = socket.data.roomCode;
      const hostId = socket.data.playerId;
      if (!roomCode || !hostId) return callback({ success: false, error: "No autorizado" });

      const room = globalRoomStore.getRoomByCode(roomCode);
      if (!room || room.hostId !== hostId) {
        return callback({ success: false, error: "Solo el anfitrión puede iniciar la partida" });
      }

      const wordsByCategory = WordDataLoader.getWordsByCategory();
      const result = GameEngine.startMatch(room, wordsByCategory);

      if (!result.success) {
        return callback({ success: false, error: result.error });
      }

      TimerService.broadcastRoomUpdates(io, room);
      io.to("lobby").emit("lobby:update", globalRoomStore.listPublicRooms());

      // Start clue timer if configured
      if (room.settings.clueTimerSeconds > 0) {
        TimerService.startTimer(
          io,
          room,
          "clue",
          room.settings.clueTimerSeconds,
          () => {
            handleTurnTimeout(io, room.code);
          }
        );
      }

      callback({ success: true });
    } catch (err) {
      console.error("[game:start] Error:", err);
      callback({ success: false, error: "Error al iniciar la partida" });
    }
  });

  // 2. Submit Clue
  socket.on("game:clue-submit", (rawPayload, callback) => {
    try {
      const roomCode = socket.data.roomCode;
      const playerId = socket.data.playerId;
      if (!roomCode || !playerId) return callback({ success: false, error: "No estás en una sala" });

      const room = globalRoomStore.getRoomByCode(roomCode);
      if (!room || !room.game) return callback({ success: false, error: "Partida no activa" });

      const parsed = submitClueSchema.safeParse(rawPayload);
      if (!parsed.success) {
        return callback({ success: false, error: parsed.error.issues[0]?.message || "Pista inválida" });
      }

      const result = GameEngine.submitClue(room, playerId, parsed.data.text);
      if (!result.success) {
        return callback({ success: false, error: result.error });
      }

      // Handle phase transitions
      if (result.advanceToPhase === "DISCUSSION") {
        TimerService.clearTimer(room.code);
        TimerService.broadcastRoomUpdates(io, room);

        if (room.settings.discussionTimerSeconds > 0) {
          TimerService.startTimer(
            io,
            room,
            "discussion",
            room.settings.discussionTimerSeconds,
            () => {
              handleDiscussionTimeout(io, room.code);
            }
          );
        }
      } else if (result.advanceToPhase === "VOTING") {
        TimerService.clearTimer(room.code);
        GameEngine.startVoting(room);
        TimerService.broadcastRoomUpdates(io, room);

        if (room.settings.voteTimerSeconds > 0) {
          TimerService.startTimer(
            io,
            room,
            "vote",
            room.settings.voteTimerSeconds,
            () => {
              handleVoteTimeout(io, room.code);
            }
          );
        }
      } else {
        // Next turn in CLUE_PHASE
        TimerService.broadcastRoomUpdates(io, room);
        if (room.settings.clueTimerSeconds > 0) {
          TimerService.startTimer(
            io,
            room,
            "clue",
            room.settings.clueTimerSeconds,
            () => {
              handleTurnTimeout(io, room.code);
            }
          );
        }
      }

      callback({ success: true });
    } catch (err) {
      console.error("[game:clue-submit] Error:", err);
      callback({ success: false, error: "Error al enviar la pista" });
    }
  });

  // 3. Skip Turn (e.g., player passes)
  socket.on("game:skip-turn", (callback) => {
    try {
      const roomCode = socket.data.roomCode;
      const playerId = socket.data.playerId;
      if (!roomCode || !playerId) return callback({ success: false, error: "No autorizado" });

      const room = globalRoomStore.getRoomByCode(roomCode);
      if (!room || !room.game) return callback({ success: false, error: "Partida no activa" });

      const currentTurnId = room.game.turnOrder[room.game.currentTurnIndex];
      if (currentTurnId !== playerId && room.hostId !== playerId) {
        return callback({ success: false, error: "No es tu turno de omitir" });
      }

      const result = GameEngine.submitClue(room, currentTurnId, "Pasa el turno");
      if (!result.success) {
        return callback({ success: false, error: result.error });
      }

      TimerService.broadcastRoomUpdates(io, room);
      callback({ success: true });
    } catch (err) {
      console.error("[game:skip-turn] Error:", err);
      callback({ success: false, error: "Error al saltar turno" });
    }
  });

  // 3b. Skip Discussion Phase (Host only)
  socket.on("game:skip-discussion", (callback) => {
    try {
      const roomCode = socket.data.roomCode;
      const hostId = socket.data.playerId;
      if (!roomCode || !hostId) return callback({ success: false, error: "No autorizado" });

      const room = globalRoomStore.getRoomByCode(roomCode);
      if (!room || !room.game) return callback({ success: false, error: "Partida no activa" });

      if (room.hostId !== hostId) {
        return callback({ success: false, error: "Solo el anfitrión puede omitir la fase de discusión" });
      }

      if (room.game.phase !== "DISCUSSION") {
        return callback({ success: false, error: "No estás en fase de discusión" });
      }

      // Clear the discussion timer
      TimerService.clearTimer(room.code);

      // Advance directly to voting
      GameEngine.startVoting(room);
      TimerService.broadcastRoomUpdates(io, room);

      if (room.settings.voteTimerSeconds > 0) {
        TimerService.startTimer(
          io,
          room,
          "vote",
          room.settings.voteTimerSeconds,
          () => {
            handleVoteTimeout(io, room.code);
          }
        );
      }

      callback({ success: true });
    } catch (err) {
      console.error("[game:skip-discussion] Error:", err);
      callback({ success: false, error: "Error al omitir la discusión" });
    }
  });

  // 3c. Vote to change word in Round 1
  socket.on("game:vote-change-word", (callback) => {
    try {
      const roomCode = socket.data.roomCode;
      const playerId = socket.data.playerId;
      if (!roomCode || !playerId) return callback({ success: false, error: "No autorizado" });

      const room = globalRoomStore.getRoomByCode(roomCode);
      if (!room || !room.game) return callback({ success: false, error: "Partida no activa" });

      const wordsByCategory = WordDataLoader.getWordsByCategory();
      const result = GameEngine.voteChangeWord(room, playerId, wordsByCategory);

      if (!result.success) {
        return callback({ success: false, error: result.error });
      }

      if (result.wordChanged) {
        // Reset turn timer if enabled
        if (room.settings.clueTimerSeconds > 0) {
          TimerService.clearTimer(room.code);
          TimerService.startTimer(
            io,
            room,
            "clue",
            room.settings.clueTimerSeconds,
            () => {
              handleTurnTimeout(io, room.code);
            }
          );
        }
        io.to(room.code).emit("notification:system", "🔄 ¡Palabra cambiada por votación del grupo!");
      }

      TimerService.broadcastRoomUpdates(io, room);
      callback({ success: true, wordChanged: result.wordChanged });
    } catch (err) {
      console.error("[game:vote-change-word] Error:", err);
      callback({ success: false, error: "Error al votar cambio de palabra" });
    }
  });

  // 4. Submit Vote
  socket.on("game:vote-submit", (rawPayload, callback) => {
    try {
      const roomCode = socket.data.roomCode;
      const voterId = socket.data.playerId;
      if (!roomCode || !voterId) return callback({ success: false, error: "No autorizado" });

      const room = globalRoomStore.getRoomByCode(roomCode);
      if (!room || !room.game) return callback({ success: false, error: "Partida no activa" });

      const parsed = submitVoteSchema.safeParse(rawPayload);
      if (!parsed.success) {
        return callback({ success: false, error: parsed.error.issues[0]?.message || "Voto inválido" });
      }

      const result = GameEngine.submitVote(room, voterId, parsed.data.targetPlayerId);
      if (!result.success) {
        return callback({ success: false, error: result.error });
      }

      TimerService.broadcastRoomUpdates(io, room);

      // If all alive players have voted, immediately resolve!
      if (result.allVoted) {
        TimerService.clearTimer(room.code);
        resolveVotingAndAdvance(io, room);
      }

      callback({ success: true });
    } catch (err) {
      console.error("[game:vote-submit] Error:", err);
      callback({ success: false, error: "Error al emitir el voto" });
    }
  });

  // 5. Last Chance Guess
  socket.on("game:last-chance-guess", (rawPayload, callback) => {
    try {
      const roomCode = socket.data.roomCode;
      const playerId = socket.data.playerId;
      if (!roomCode || !playerId) return callback({ success: false, error: "No autorizado" });

      const room = globalRoomStore.getRoomByCode(roomCode);
      if (!room || !room.game || room.game.phase !== "LAST_CHANCE") {
        return callback({ success: false, error: "No es momento de última oportunidad" });
      }

      const parsed = lastChanceGuessSchema.safeParse(rawPayload);
      if (!parsed.success) {
        return callback({ success: false, error: parsed.error.issues[0]?.message || "Palabra inválida" });
      }

      const result = GameEngine.handleLastChanceGuess(room, playerId, parsed.data.guess);
      TimerService.broadcastRoomUpdates(io, room);
      io.to("lobby").emit("lobby:update", globalRoomStore.listPublicRooms());

      callback({
        success: true,
        isCorrect: result.isCorrect,
      });

      // If game is not over, schedule transition to next round after short reveal
      const currentPhase = room.game.phase as string;
      if (!result.isGameOver && currentPhase === "REVEAL_ELIMINATED") {
        setTimeout(() => {
          if (room.game && (room.game.phase as string) === "REVEAL_ELIMINATED") {
            GameEngine.startNextRound(room);
            TimerService.broadcastRoomUpdates(io, room);
            if (room.settings.clueTimerSeconds > 0) {
              TimerService.startTimer(
                io,
                room,
                "clue",
                room.settings.clueTimerSeconds,
                () => {
                  handleTurnTimeout(io, room.code);
                }
              );
            }
          }
        }, 4000);
      }
    } catch (err) {
      console.error("[game:last-chance-guess] Error:", err);
      callback({ success: false, error: "Error al procesar la respuesta" });
    }
  });

  // 6. Rematch
  socket.on("game:rematch", ({ resetScores }, callback) => {
    try {
      const roomCode = socket.data.roomCode;
      const hostId = socket.data.playerId;
      if (!roomCode || !hostId) return callback({ success: false, error: "No autorizado" });

      const room = globalRoomStore.getRoomByCode(roomCode);
      if (!room || room.hostId !== hostId) {
        return callback({ success: false, error: "Solo el anfitrión puede iniciar la revancha" });
      }

      const wordsByCategory = WordDataLoader.getWordsByCategory();
      const result = GameEngine.rematch(room, wordsByCategory, Boolean(resetScores));

      if (!result.success) {
        return callback({ success: false, error: result.error });
      }

      TimerService.broadcastRoomUpdates(io, room);
      io.to("lobby").emit("lobby:update", globalRoomStore.listPublicRooms());

      if (room.settings.clueTimerSeconds > 0) {
        TimerService.startTimer(
          io,
          room,
          "clue",
          room.settings.clueTimerSeconds,
          () => {
            handleTurnTimeout(io, room.code);
          }
        );
      }

      callback({ success: true });
    } catch (err) {
      console.error("[game:rematch] Error:", err);
      callback({ success: false, error: "Error al iniciar la revancha" });
    }
  });
}

function handleTurnTimeout(io: TypedServer, roomCode: string) {
  const room = globalRoomStore.getRoomByCode(roomCode);
  if (!room || !room.game || room.game.phase !== "CLUE_PHASE") return;

  const currentTurnId = room.game.turnOrder[room.game.currentTurnIndex];
  const player = room.players.get(currentTurnId);
  const nickname = player ? player.nickname : "Jugador";

  GameEngine.submitClue(room, currentTurnId, `[Tiempo agotado de ${nickname}]`);
  TimerService.broadcastRoomUpdates(io, room);

  // If next phase is still clue phase, re-arm timer
  const currentPhase = room.game.phase as string;
  if (currentPhase === "CLUE_PHASE" && room.settings.clueTimerSeconds > 0) {
    TimerService.startTimer(
      io,
      room,
      "clue",
      room.settings.clueTimerSeconds,
      () => {
        handleTurnTimeout(io, room.code);
      }
    );
  } else if (currentPhase === "DISCUSSION" && room.settings.discussionTimerSeconds > 0) {
    TimerService.startTimer(
      io,
      room,
      "discussion",
      room.settings.discussionTimerSeconds,
      () => {
        handleDiscussionTimeout(io, room.code);
      }
    );
  } else if (currentPhase === "VOTING" && room.settings.voteTimerSeconds > 0) {
    TimerService.startTimer(
      io,
      room,
      "vote",
      room.settings.voteTimerSeconds,
      () => {
        handleVoteTimeout(io, room.code);
      }
    );
  }
}

function handleDiscussionTimeout(io: TypedServer, roomCode: string) {
  const room = globalRoomStore.getRoomByCode(roomCode);
  if (!room || !room.game || room.game.phase !== "DISCUSSION") return;

  GameEngine.startVoting(room);
  TimerService.broadcastRoomUpdates(io, room);

  if (room.settings.voteTimerSeconds > 0) {
    TimerService.startTimer(
      io,
      room,
      "vote",
      room.settings.voteTimerSeconds,
      () => {
        handleVoteTimeout(io, room.code);
      }
    );
  }
}

function handleVoteTimeout(io: TypedServer, roomCode: string) {
  const room = globalRoomStore.getRoomByCode(roomCode);
  if (!room || !room.game || (room.game.phase !== "VOTING" && room.game.phase !== "TIE_BREAKER")) return;

  resolveVotingAndAdvance(io, room);
}

function resolveVotingAndAdvance(io: TypedServer, room: any) {
  const outcome = GameEngine.resolveVoting(room);
  TimerService.broadcastRoomUpdates(io, room);
  io.to("lobby").emit("lobby:update", globalRoomStore.listPublicRooms());

  if (outcome.phase === "TIE_BREAKER") {
    // Start vote timer for tie-breaker
    if (room.settings.voteTimerSeconds > 0) {
      TimerService.startTimer(
        io,
        room,
        "vote",
        room.settings.voteTimerSeconds,
        () => {
          handleVoteTimeout(io, room.code);
        }
      );
    }
  } else if (outcome.phase === "REVEAL_ELIMINATED") {
    // After 4s dramatic reveal, advance to next round
    setTimeout(() => {
      if (room.game && room.game.phase === "REVEAL_ELIMINATED") {
        GameEngine.startNextRound(room);
        TimerService.broadcastRoomUpdates(io, room);
        if (room.settings.clueTimerSeconds > 0) {
          TimerService.startTimer(
            io,
            room,
            "clue",
            room.settings.clueTimerSeconds,
            () => {
              handleTurnTimeout(io, room.code);
            }
          );
        }
      }
    }, 4000);
  }
}
