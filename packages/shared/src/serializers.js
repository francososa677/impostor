export function toPublicRoomState(room) {
    let publicGame = null;
    if (room.game) {
        const alivePlayers = Array.from(room.players.values()).filter((p) => !p.isEliminated && !p.isSpectator);
        const votersRemaining = alivePlayers
            .filter((p) => !room.game?.votes.has(p.id))
            .map((p) => p.id);
        const votesCount = {};
        if (room.game.phase === "REVEAL_ELIMINATED" || room.game.phase === "GAME_OVER") {
            for (const targetId of room.game.votes.values()) {
                votesCount[targetId] = (votesCount[targetId] || 0) + 1;
            }
        }
        publicGame = {
            phase: room.game.phase,
            round: room.game.round,
            turnOrder: room.game.turnOrder,
            currentTurnIndex: room.game.currentTurnIndex,
            currentTurnPlayerId: room.game.turnOrder.length > 0 && room.game.currentTurnIndex < room.game.turnOrder.length
                ? room.game.turnOrder[room.game.currentTurnIndex]
                : null,
            cluesGivenInRound: Array.from(room.game.cluesGivenInRound),
            clueHistory: room.game.clueHistory,
            tieBreakerCandidateIds: room.game.tieBreakerCandidateIds,
            votingVotersRemaining: votersRemaining,
            lastVotesCount: Object.keys(votesCount).length > 0 ? votesCount : undefined,
            lastEliminatedPlayerId: room.game.lastEliminatedPlayerId,
            lastEliminatedWasImpostor: room.settings.roleRevealMode === "immediate" || room.game.phase === "GAME_OVER"
                ? room.game.lastEliminatedWasImpostor
                : null,
            lastChanceTargetPlayerId: room.game.lastChanceTargetPlayerId,
            stats: room.game.stats,
        };
    }
    return {
        id: room.id,
        code: room.code,
        hostId: room.hostId,
        visibility: room.visibility,
        settings: {
            ...room.settings,
            hasPassword: Boolean(room.passwordHash),
        },
        players: Array.from(room.players.values()),
        spectators: Array.from(room.spectators.values()),
        game: publicGame,
        scores: room.scores,
        activeMatchCount: room.activeMatchCount,
    };
}
export function toPlayerPrivateState(room, playerId) {
    const isSpectator = room.spectators.has(playerId) || !room.players.has(playerId);
    if (isSpectator || !room.game) {
        return {
            playerId,
            role: "spectator",
            isYourTurn: false,
            hasVoted: false,
            isLastChanceActiveForYou: false,
        };
    }
    const isImpostor = room.game.impostorIds.has(playerId);
    const isYourTurn = room.game.phase === "CLUE_PHASE" &&
        room.game.turnOrder[room.game.currentTurnIndex] === playerId;
    const hasVoted = room.game.votes.has(playerId);
    const isLastChanceActiveForYou = room.game.phase === "LAST_CHANCE" && room.game.lastChanceTargetPlayerId === playerId;
    if (isImpostor) {
        let category = undefined;
        let contextClue = undefined;
        if (room.settings.impostorGetsClue) {
            if (room.settings.clueTypePreference === "category_only" || room.settings.clueTypePreference === "both") {
                category = room.game.secretCategory;
            }
            if (room.settings.clueTypePreference === "context_only" || room.settings.clueTypePreference === "both") {
                contextClue = room.game.contextClue;
            }
        }
        let impostorTeammates = undefined;
        if (room.settings.impostorsKnowEachOther) {
            impostorTeammates = Array.from(room.game.impostorIds)
                .filter((id) => id !== playerId)
                .map((id) => ({
                id,
                nickname: room.players.get(id)?.nickname || "Impostor",
            }));
        }
        return {
            playerId,
            role: "impostor",
            category,
            contextClue,
            impostorTeammates,
            isYourTurn,
            hasVoted,
            isLastChanceActiveForYou,
        };
    }
    // Innocent player
    return {
        playerId,
        role: "innocent",
        secretWord: room.game.secretWord,
        category: room.game.secretCategory,
        isYourTurn,
        hasVoted,
        isLastChanceActiveForYou: false,
    };
}
export function toRoomSummary(room) {
    const host = room.players.get(room.hostId);
    return {
        id: room.id,
        code: room.code,
        name: host ? `Sala de ${host.nickname}` : `Sala ${room.code}`,
        playerCount: room.players.size,
        maxPlayers: room.settings.maxPlayers,
        mode: room.settings.mode,
        visibility: room.visibility,
        hasPassword: Boolean(room.passwordHash),
        impostorCount: room.settings.impostorCount,
        status: room.game && room.game.phase !== "GAME_OVER" ? "IN_GAME" : "WAITING",
    };
}
//# sourceMappingURL=serializers.js.map