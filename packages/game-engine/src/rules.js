import { GAME_LIMITS, getMaxImpostorsForPlayerCount } from "@impostor/shared";
export function validateCanStartGame(players, settings, availableCategories) {
    const eligiblePlayers = players.filter((p) => !p.isSpectator && p.isConnected);
    if (eligiblePlayers.length < GAME_LIMITS.MIN_PLAYERS) {
        return {
            valid: false,
            error: `Se necesitan al menos ${GAME_LIMITS.MIN_PLAYERS} jugadores conectados para iniciar`,
        };
    }
    const maxImpostors = getMaxImpostorsForPlayerCount(eligiblePlayers.length);
    if (settings.impostorCount < 1 || settings.impostorCount > maxImpostors) {
        return {
            valid: false,
            error: `La cantidad de impostores (${settings.impostorCount}) debe estar entre 1 y ${maxImpostors} para ${eligiblePlayers.length} jugadores`,
        };
    }
    if (settings.selectedCategories.length === 0) {
        return {
            valid: false,
            error: "Debes seleccionar al menos una categoría",
        };
    }
    const invalidCategories = settings.selectedCategories.filter((cat) => !availableCategories.includes(cat));
    if (invalidCategories.length > 0) {
        return {
            valid: false,
            error: `Categorías no disponibles: ${invalidCategories.join(", ")}`,
        };
    }
    return { valid: true };
}
export function checkWinConditions(players, impostorIds) {
    let aliveInnocents = 0;
    let aliveImpostors = 0;
    for (const player of players.values()) {
        if (player.isSpectator || player.isEliminated)
            continue;
        if (impostorIds.has(player.id)) {
            aliveImpostors += 1;
        }
        else {
            aliveInnocents += 1;
        }
    }
    // All impostors eliminated -> Innocents win
    if (aliveImpostors === 0) {
        return {
            isGameOver: true,
            winner: "innocents",
            winReason: "¡Todos los impostores fueron descubiertos y eliminados!",
        };
    }
    // Impostors >= Innocents -> Impostors win (rule 15 & 466)
    if (aliveImpostors >= aliveInnocents) {
        return {
            isGameOver: true,
            winner: "impostors",
            winReason: "¡Los impostores igualaron o superaron a los inocentes!",
        };
    }
    return {
        isGameOver: false,
        winner: null,
        winReason: "",
    };
}
export function countVotes(votes, candidateFilter) {
    const voteCounts = new Map();
    for (const targetId of votes.values()) {
        if (candidateFilter && !candidateFilter.includes(targetId))
            continue;
        voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1);
    }
    let maxVotes = 0;
    for (const count of voteCounts.values()) {
        if (count > maxVotes) {
            maxVotes = count;
        }
    }
    const topCandidateIds = [];
    if (maxVotes > 0) {
        for (const [targetId, count] of voteCounts.entries()) {
            if (count === maxVotes) {
                topCandidateIds.push(targetId);
            }
        }
    }
    return { voteCounts, maxVotes, topCandidateIds };
}
//# sourceMappingURL=rules.js.map