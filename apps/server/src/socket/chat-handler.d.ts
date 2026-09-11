import { Socket, Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from "@impostor/shared";
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export declare function registerChatHandlers(io: TypedServer, socket: TypedSocket): void;
export {};
//# sourceMappingURL=chat-handler.d.ts.map