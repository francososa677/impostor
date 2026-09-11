import http from "node:http";
import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from "@impostor/shared";
declare const app: import("express-serve-static-core").Express;
declare const server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
declare const io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export { app, server, io };
//# sourceMappingURL=server.d.ts.map