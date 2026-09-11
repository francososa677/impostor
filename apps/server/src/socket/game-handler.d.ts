import { Socket, Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from "@impostor/shared";
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export declare function registerGameHandlers(io: TypedServer, socket: TypedSocket): void;
export {};
//# sourceMappingURL=game-handler.d.ts.map