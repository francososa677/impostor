import { Server, Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  GAME_LIMITS,
} from "@impostor/shared";
import { registerRoomHandlers } from "./room-handler.js";
import { registerGameHandlers } from "./game-handler.js";
import { registerChatHandlers } from "./chat-handler.js";
import { globalRoomStore } from "../store/room-store.js";
import { TimerService } from "../services/timer-service.js";

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function initSocketServer(io: TypedServer) {
  io.on("connection", (socket: TypedSocket) => {
    // Register domain handlers
    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerChatHandlers(io, socket);

    // Handle Disconnection
    socket.on("disconnect", (reason) => {
      const socketInfo = globalRoomStore.getPlayerBySocket(socket.id);
      if (!socketInfo) return;

      const { playerId, roomCode } = socketInfo;
      globalRoomStore.unregisterSocket(socket.id);

      const room = globalRoomStore.getRoomByCode(roomCode);
      if (!room) return;

      const isMatchActive = room.game !== null && room.game.phase !== "GAME_OVER";
      const player = room.players.get(playerId) || room.spectators.get(playerId);

      if (player) {
        player.isConnected = false;
        TimerService.broadcastRoomUpdates(io, room);

        if (!isMatchActive) {
          // In lobby, set brief timer before cleaning up
          setTimeout(() => {
            const currentRoom = globalRoomStore.getRoomByCode(roomCode);
            if (!currentRoom) return;

            const p = currentRoom.players.get(playerId) || currentRoom.spectators.get(playerId);
            if (p && !p.isConnected) {
              currentRoom.players.delete(playerId);
              currentRoom.spectators.delete(playerId);

              if (currentRoom.players.size === 0 && currentRoom.spectators.size === 0) {
                globalRoomStore.deleteRoom(currentRoom.id);
              } else if (currentRoom.hostId === playerId) {
                const nextHost = Array.from(currentRoom.players.values())[0];
                if (nextHost) {
                  currentRoom.hostId = nextHost.id;
                  nextHost.isHost = true;
                }
              }

              TimerService.broadcastRoomUpdates(io, currentRoom);
              io.to("lobby").emit("lobby:update", globalRoomStore.listPublicRooms());
            }
          }, GAME_LIMITS.LOBBY_DISCONNECT_GRACE_MS);
        } else {
          // In game, grace period 30 seconds
          setTimeout(() => {
            const currentRoom = globalRoomStore.getRoomByCode(roomCode);
            if (!currentRoom || !currentRoom.game) return;

            const p = currentRoom.players.get(playerId);
            if (p && !p.isConnected && !p.isEliminated) {
              // Mark as eliminated if player didn't reconnect
              p.isEliminated = true;
              TimerService.broadcastRoomUpdates(io, currentRoom);
            }
          }, GAME_LIMITS.RECONNECT_GRACE_PERIOD_MS);
        }
      }
    });
  });
}
