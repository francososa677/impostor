import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from "@impostor/shared";
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export declare function initSocketServer(io: TypedServer): void;
export {};
//# sourceMappingURL=index.d.ts.map