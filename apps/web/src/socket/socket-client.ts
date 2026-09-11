import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "@impostor/shared";

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socketInstance: GameSocket | null = null;

export function getSocket(): GameSocket {
  if (!socketInstance) {
    // Connects to explicit VITE_SERVER_URL or current origin
    const url = (import.meta.env.VITE_SERVER_URL as string) || window.location.origin;
    socketInstance = io(url, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
    });
  }
  return socketInstance;
}
