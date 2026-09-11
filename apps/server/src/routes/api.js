import { Router } from "express";
import { WordDataLoader } from "../store/data-loader.js";
import { globalRoomStore } from "../store/room-store.js";
export const apiRouter = Router();
apiRouter.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: Date.now(),
        uptime: process.uptime(),
        activeRooms: globalRoomStore.getRoomCount(),
    });
});
apiRouter.get("/api/categories", (req, res) => {
    const categories = WordDataLoader.getCategoriesMeta();
    res.json({ categories });
});
apiRouter.get("/api/rooms", (req, res) => {
    const publicRooms = globalRoomStore.listPublicRooms();
    res.json({ rooms: publicRooms });
});
apiRouter.get("/api/rooms/:code", (req, res) => {
    const room = globalRoomStore.getRoomByCode(req.params.code);
    if (!room) {
        return res.status(404).json({ error: "Sala no encontrada" });
    }
    res.json({
        code: room.code,
        playerCount: room.players.size,
        maxPlayers: room.settings.maxPlayers,
        hasPassword: Boolean(room.passwordHash),
        isPrivate: room.settings.isPrivate,
        mode: room.settings.mode,
        inGame: room.game !== null && room.game.phase !== "GAME_OVER",
    });
});
//# sourceMappingURL=api.js.map