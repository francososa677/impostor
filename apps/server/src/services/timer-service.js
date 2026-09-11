import { toPublicRoomState, toPlayerPrivateState } from "@impostor/shared";
export class TimerService {
    static timers = new Map();
    static startTimer(io, room, type, durationSeconds, onExpire) {
        this.clearTimer(room.code);
        if (durationSeconds <= 0)
            return;
        let remaining = durationSeconds;
        // Send initial tick
        io.to(room.code).emit("timer:tick", { type, remainingSeconds: remaining });
        const intervalId = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                TimerService.clearTimer(room.code);
                io.to(room.code).emit("timer:tick", { type, remainingSeconds: 0 });
                onExpire();
            }
            else {
                io.to(room.code).emit("timer:tick", { type, remainingSeconds: remaining });
            }
        }, 1000);
        this.timers.set(room.code, {
            roomCode: room.code,
            type,
            durationSeconds,
            remainingSeconds: remaining,
            intervalId,
            onExpire,
        });
    }
    static clearTimer(roomCode) {
        const existing = this.timers.get(roomCode);
        if (existing) {
            clearInterval(existing.intervalId);
            this.timers.delete(roomCode);
        }
    }
    static broadcastRoomUpdates(io, room) {
        // 1. Broadcast sanitized public room state to everyone in the room
        const publicState = toPublicRoomState(room);
        io.to(room.code).emit("room:state", publicState);
        // 2. Send distinct private state to each connected player and spectator
        for (const player of room.players.values()) {
            if (player.socketId) {
                const privateState = toPlayerPrivateState(room, player.id);
                io.to(player.socketId).emit("player:private-state", privateState);
            }
        }
        for (const spectator of room.spectators.values()) {
            if (spectator.socketId) {
                const privateState = toPlayerPrivateState(room, spectator.id);
                io.to(spectator.socketId).emit("player:private-state", privateState);
            }
        }
    }
}
//# sourceMappingURL=timer-service.js.map