import crypto from "node:crypto";
import { Socket, Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  sendChatMessageSchema,
  ChatMessage,
  CHAT_REACTIONS,
} from "@impostor/shared";
import { globalRoomStore } from "../store/room-store.js";
import { socketMessageLimiter } from "../middleware/rate-limiter.js";

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerChatHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on("chat:send", (rawPayload, callback) => {
    try {
      const roomCode = socket.data.roomCode;
      const playerId = socket.data.playerId;
      if (!roomCode || !playerId) return callback({ success: false, error: "No estás en una sala" });

      if (!socketMessageLimiter.isAllowed(socket.id)) {
        return callback({ success: false, error: "Estás enviando mensajes demasiado rápido" });
      }

      const room = globalRoomStore.getRoomByCode(roomCode);
      if (!room) return callback({ success: false, error: "La sala no existe" });

      const parsed = sendChatMessageSchema.safeParse(rawPayload);
      if (!parsed.success) {
        return callback({ success: false, error: parsed.error.issues[0]?.message || "Mensaje inválido" });
      }

      const player = room.players.get(playerId) || room.spectators.get(playerId);
      if (!player) return callback({ success: false, error: "Jugador no encontrado" });

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        playerId: player.id,
        nickname: player.nickname,
        avatar: player.avatar,
        text: parsed.data.text,
        timestamp: Date.now(),
        isSpectator: player.isSpectator || player.isEliminated,
        reaction: parsed.data.reaction,
      };

      // Broadcast message to everyone in the room
      io.to(room.code).emit("chat:message", message);
      callback({ success: true });
    } catch (err) {
      console.error("[chat:send] Error:", err);
      callback({ success: false, error: "Error al enviar mensaje" });
    }
  });
}
