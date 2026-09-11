import crypto from "node:crypto";
import { createRoomSchema, joinRoomSchema, updateSettingsSchema, } from "@impostor/shared";
import { globalRoomStore } from "../store/room-store.js";
import { TimerService } from "../services/timer-service.js";
import { roomCreationLimiter } from "../middleware/rate-limiter.js";
export function registerRoomHandlers(io, socket) {
    const ip = socket.handshake.address;
    // 1. Create Room
    socket.on("room:create", (rawPayload, callback) => {
        try {
            if (!roomCreationLimiter.isAllowed(ip)) {
                return callback({ success: false, error: "Demasiadas salas creadas. Intentá más tarde." });
            }
            const parsed = createRoomSchema.safeParse(rawPayload);
            if (!parsed.success) {
                return callback({ success: false, error: parsed.error.issues[0]?.message || "Datos inválidos" });
            }
            const input = parsed.data;
            const playerId = crypto.randomUUID();
            let passwordHash = undefined;
            if (input.password && input.password.trim().length > 0) {
                passwordHash = crypto.createHash("sha256").update(input.password).digest("hex");
            }
            const hostPlayer = {
                id: playerId,
                nickname: input.nickname,
                avatar: input.avatar,
                socketId: socket.id,
                isConnected: true,
                isHost: true,
                isEliminated: false,
                isSpectator: false,
                joinedAt: Date.now(),
            };
            const room = globalRoomStore.createRoom(hostPlayer, {
                mode: input.mode,
                clueDeliveryMode: input.clueDeliveryMode,
                impostorCount: input.impostorCount,
                impostorsKnowEachOther: input.impostorsKnowEachOther,
                impostorGetsClue: input.impostorGetsClue,
                clueTypePreference: input.clueTypePreference,
                selectedCategories: input.selectedCategories,
                clueTimerSeconds: input.clueTimerSeconds,
                discussionTimerSeconds: input.discussionTimerSeconds,
                voteTimerSeconds: input.voteTimerSeconds,
                anonymousVoting: input.anonymousVoting,
                roleRevealMode: input.roleRevealMode,
                lastChanceGuess: input.lastChanceGuess,
                maxPlayers: input.maxPlayers,
                isPrivate: input.isPrivate,
            }, passwordHash);
            const sessionToken = globalRoomStore.createSessionToken(playerId, room.code);
            // Join socket room
            socket.join(room.code);
            socket.data.playerId = playerId;
            socket.data.roomCode = room.code;
            socket.data.sessionToken = sessionToken;
            globalRoomStore.registerSocket(socket.id, playerId, room.code);
            TimerService.broadcastRoomUpdates(io, room);
            // Update public lobby
            io.to("lobby").emit("lobby:update", globalRoomStore.listPublicRooms());
            callback({
                success: true,
                roomCode: room.code,
                playerId,
                sessionToken,
            });
        }
        catch (err) {
            console.error("[room:create] Error:", err);
            callback({ success: false, error: "Error al crear la sala" });
        }
    });
    // 2. Join Room
    socket.on("room:join", (rawPayload, callback) => {
        try {
            const parsed = joinRoomSchema.safeParse(rawPayload);
            if (!parsed.success) {
                return callback({ success: false, error: parsed.error.issues[0]?.message || "Datos inválidos" });
            }
            const input = parsed.data;
            const room = globalRoomStore.getRoomByCode(input.roomCode);
            if (!room) {
                return callback({ success: false, error: "La sala solicitada no existe o fue cerrada" });
            }
            // Check if player is reconnecting with session token
            if (input.sessionToken) {
                for (const existingPlayer of room.players.values()) {
                    if (globalRoomStore.verifySessionToken(input.sessionToken, existingPlayer.id, room.code)) {
                        existingPlayer.isConnected = true;
                        existingPlayer.socketId = socket.id;
                        socket.join(room.code);
                        socket.data.playerId = existingPlayer.id;
                        socket.data.roomCode = room.code;
                        socket.data.sessionToken = input.sessionToken;
                        globalRoomStore.registerSocket(socket.id, existingPlayer.id, room.code);
                        TimerService.broadcastRoomUpdates(io, room);
                        return callback({
                            success: true,
                            roomCode: room.code,
                            playerId: existingPlayer.id,
                            sessionToken: input.sessionToken,
                            isSpectator: false,
                        });
                    }
                }
            }
            // Check password if applicable (only required if NOT joining directly via code/QR without password hash)
            if (room.passwordHash && !input.sessionToken) {
                if (!input.password) {
                    return callback({ success: false, error: "Esta sala requiere contraseña" });
                }
                const enteredHash = crypto.createHash("sha256").update(input.password).digest("hex");
                if (enteredHash !== room.passwordHash) {
                    return callback({ success: false, error: "Contraseña incorrecta" });
                }
            }
            // Check nickname collision
            for (const p of room.players.values()) {
                if (p.nickname.toLowerCase() === input.nickname.toLowerCase() && p.isConnected) {
                    return callback({ success: false, error: "Ya existe un jugador con ese apodo en la sala" });
                }
            }
            const isMatchActive = room.game !== null && room.game.phase !== "GAME_OVER";
            const isRoomFull = room.players.size >= room.settings.maxPlayers;
            const isSpectator = isMatchActive || isRoomFull;
            const playerId = crypto.randomUUID();
            const sessionToken = globalRoomStore.createSessionToken(playerId, room.code);
            const newPlayer = {
                id: playerId,
                nickname: input.nickname,
                avatar: input.avatar,
                socketId: socket.id,
                isConnected: true,
                isHost: false,
                isEliminated: false,
                isSpectator,
                joinedAt: Date.now(),
            };
            if (isSpectator) {
                room.spectators.set(playerId, newPlayer);
            }
            else {
                room.players.set(playerId, newPlayer);
                if (!room.scores[playerId]) {
                    room.scores[playerId] = {
                        playerId,
                        nickname: newPlayer.nickname,
                        avatar: newPlayer.avatar,
                        wins: 0,
                        survivedRounds: 0,
                        correctVotes: 0,
                        deceivedInnocents: 0,
                        lastChanceBonuses: 0,
                        totalScore: 0,
                    };
                }
            }
            socket.join(room.code);
            socket.data.playerId = playerId;
            socket.data.roomCode = room.code;
            socket.data.sessionToken = sessionToken;
            globalRoomStore.registerSocket(socket.id, playerId, room.code);
            TimerService.broadcastRoomUpdates(io, room);
            io.to("lobby").emit("lobby:update", globalRoomStore.listPublicRooms());
            callback({
                success: true,
                roomCode: room.code,
                playerId,
                sessionToken,
                isSpectator,
            });
        }
        catch (err) {
            console.error("[room:join] Error:", err);
            callback({ success: false, error: "Error al unirse a la sala" });
        }
    });
    // 3. Reconnect
    socket.on("room:reconnect", (payload, callback) => {
        try {
            const room = globalRoomStore.getRoomByCode(payload.roomCode);
            if (!room) {
                return callback({ success: false, error: "La sala no existe" });
            }
            const isValid = globalRoomStore.verifySessionToken(payload.sessionToken, payload.playerId, room.code);
            if (!isValid) {
                return callback({ success: false, error: "Sesión inválida o expirada" });
            }
            const player = room.players.get(payload.playerId) || room.spectators.get(payload.playerId);
            if (!player) {
                return callback({ success: false, error: "Jugador no encontrado en la sala" });
            }
            player.isConnected = true;
            player.socketId = socket.id;
            socket.join(room.code);
            socket.data.playerId = player.id;
            socket.data.roomCode = room.code;
            socket.data.sessionToken = payload.sessionToken;
            globalRoomStore.registerSocket(socket.id, player.id, room.code);
            TimerService.broadcastRoomUpdates(io, room);
            callback({ success: true });
        }
        catch (err) {
            console.error("[room:reconnect] Error:", err);
            callback({ success: false, error: "Error al reconectar" });
        }
    });
    // 4. Update Settings (Host Only, in Lobby / Finished)
    socket.on("room:settings-update", (rawPayload, callback) => {
        try {
            const roomCode = socket.data.roomCode;
            const playerId = socket.data.playerId;
            if (!roomCode || !playerId) {
                return callback({ success: false, error: "No estás en ninguna sala" });
            }
            const room = globalRoomStore.getRoomByCode(roomCode);
            if (!room || room.hostId !== playerId) {
                return callback({ success: false, error: "Solo el anfitrión puede modificar las reglas" });
            }
            if (room.game && room.game.phase !== "GAME_OVER") {
                return callback({ success: false, error: "No se puede cambiar la configuración durante una partida" });
            }
            const parsed = updateSettingsSchema.safeParse(rawPayload);
            if (!parsed.success) {
                return callback({ success: false, error: parsed.error.issues[0]?.message || "Datos inválidos" });
            }
            room.settings = { ...room.settings, ...parsed.data };
            if (parsed.data.isPrivate !== undefined) {
                room.visibility = parsed.data.isPrivate ? "private" : "public";
            }
            TimerService.broadcastRoomUpdates(io, room);
            io.to("lobby").emit("lobby:update", globalRoomStore.listPublicRooms());
            callback({ success: true });
        }
        catch (err) {
            console.error("[room:settings-update] Error:", err);
            callback({ success: false, error: "Error al actualizar configuración" });
        }
    });
    // 5. Kick Player (Host Only)
    socket.on("room:kick", ({ targetPlayerId }, callback) => {
        try {
            const roomCode = socket.data.roomCode;
            const hostId = socket.data.playerId;
            if (!roomCode || !hostId)
                return callback({ success: false, error: "No autorizado" });
            const room = globalRoomStore.getRoomByCode(roomCode);
            if (!room || room.hostId !== hostId) {
                return callback({ success: false, error: "Solo el anfitrión puede expulsar jugadores" });
            }
            const target = room.players.get(targetPlayerId) || room.spectators.get(targetPlayerId);
            if (!target)
                return callback({ success: false, error: "Jugador no encontrado" });
            if (target.socketId) {
                io.to(target.socketId).emit("player:kicked", "Has sido expulsado por el anfitrión.");
                const targetSocket = io.sockets.sockets.get(target.socketId);
                if (targetSocket) {
                    targetSocket.leave(room.code);
                }
            }
            room.players.delete(targetPlayerId);
            room.spectators.delete(targetPlayerId);
            TimerService.broadcastRoomUpdates(io, room);
            io.to("lobby").emit("lobby:update", globalRoomStore.listPublicRooms());
            callback({ success: true });
        }
        catch (err) {
            console.error("[room:kick] Error:", err);
            callback({ success: false, error: "Error al expulsar jugador" });
        }
    });
    // 6. Leave Room
    socket.on("room:leave", () => {
        const roomCode = socket.data.roomCode;
        const playerId = socket.data.playerId;
        if (!roomCode || !playerId)
            return;
        const room = globalRoomStore.getRoomByCode(roomCode);
        if (!room)
            return;
        socket.leave(room.code);
        globalRoomStore.unregisterSocket(socket.id);
        // If game not active, remove immediately
        if (!room.game || room.game.phase === "GAME_OVER") {
            room.players.delete(playerId);
            room.spectators.delete(playerId);
            // If room is empty, delete it
            if (room.players.size === 0 && room.spectators.size === 0) {
                globalRoomStore.deleteRoom(room.id);
                io.to("lobby").emit("lobby:update", globalRoomStore.listPublicRooms());
                return;
            }
            // Transfer host if host left
            if (room.hostId === playerId) {
                const nextPlayer = Array.from(room.players.values())[0];
                if (nextPlayer) {
                    room.hostId = nextPlayer.id;
                    nextPlayer.isHost = true;
                }
            }
            TimerService.broadcastRoomUpdates(io, room);
            io.to("lobby").emit("lobby:update", globalRoomStore.listPublicRooms());
        }
        else {
            // In active match: mark disconnected
            const player = room.players.get(playerId);
            if (player) {
                player.isConnected = false;
                TimerService.broadcastRoomUpdates(io, room);
            }
        }
    });
    // 7. Subscribe to Lobby updates
    socket.on("lobby:subscribe", (callback) => {
        socket.join("lobby");
        callback(globalRoomStore.listPublicRooms());
    });
    socket.on("lobby:unsubscribe", () => {
        socket.leave("lobby");
    });
}
//# sourceMappingURL=room-handler.js.map