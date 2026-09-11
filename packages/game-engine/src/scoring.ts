import { ScoreBoard, Player, SCORING_RULES } from "@impostor/shared";

export function initializeScoreBoard(players: Player[]): ScoreBoard {
  const scores: ScoreBoard = {};
  for (const player of players) {
    scores[player.id] = {
      playerId: player.id,
      nickname: player.nickname,
      avatar: player.avatar,
      wins: 0,
      survivedRounds: 0,
      correctVotes: 0,
      deceivedInnocents: 0,
      lastChanceBonuses: 0,
      totalScore: 0,
    };
  }
  return scores;
}

export function updateScoresForRound(
  currentScores: ScoreBoard,
  players: Map<string, Player>,
  impostorIds: Set<string>,
  votes: Map<string, string>,
  eliminatedId: string | null,
  winner: "innocents" | "impostors" | null,
  lastChanceBonusPlayerId: string | null = null
): ScoreBoard {
  const newScores: ScoreBoard = { ...currentScores };

  // Ensure all players are in the scoreboard
  for (const player of players.values()) {
    if (!newScores[player.id]) {
      newScores[player.id] = {
        playerId: player.id,
        nickname: player.nickname,
        avatar: player.avatar,
        wins: 0,
        survivedRounds: 0,
        correctVotes: 0,
        deceivedInnocents: 0,
        lastChanceBonuses: 0,
        totalScore: 0,
      };
    }
  }

  // Round survival bonus for alive players (excluding eliminated this round)
  for (const player of players.values()) {
    if (player.isSpectator) continue;
    const isAlive = !player.isEliminated && player.id !== eliminatedId;
    const isImpostor = impostorIds.has(player.id);

    if (isAlive) {
      if (isImpostor) {
        newScores[player.id].survivedRounds += 1;
        newScores[player.id].totalScore += SCORING_RULES.IMPOSTOR_SURVIVED_ROUND;
      } else {
        newScores[player.id].survivedRounds += 1;
        newScores[player.id].totalScore += SCORING_RULES.INNOCENT_SURVIVED_ROUND;
      }
    }
  }

  // Voting points
  for (const [voterId, targetId] of votes.entries()) {
    if (!newScores[voterId]) continue;
    const voterIsImpostor = impostorIds.has(voterId);
    const targetIsImpostor = impostorIds.has(targetId);

    if (!voterIsImpostor && targetIsImpostor) {
      // Innocent voted correctly for an impostor
      newScores[voterId].correctVotes += 1;
      newScores[voterId].totalScore += SCORING_RULES.INNOCENT_CORRECT_VOTE;
    } else if (voterIsImpostor && !targetIsImpostor) {
      // Impostor voted to frame an innocent
      newScores[voterId].deceivedInnocents += 1;
      newScores[voterId].totalScore += SCORING_RULES.IMPOSTOR_DECEIVED_VOTE;
    }
  }

  // Last chance bonus
  if (lastChanceBonusPlayerId && newScores[lastChanceBonusPlayerId]) {
    newScores[lastChanceBonusPlayerId].lastChanceBonuses += 1;
    newScores[lastChanceBonusPlayerId].totalScore += SCORING_RULES.IMPOSTOR_LAST_CHANCE_SUCCESS;
  }

  // Winner points if game ended
  if (winner) {
    for (const player of players.values()) {
      if (player.isSpectator || !newScores[player.id]) continue;
      const isImpostor = impostorIds.has(player.id);

      if (winner === "impostors" && isImpostor) {
        newScores[player.id].wins += 1;
        newScores[player.id].totalScore += SCORING_RULES.IMPOSTOR_WIN;
      } else if (winner === "innocents" && !isImpostor) {
        newScores[player.id].wins += 1;
        newScores[player.id].totalScore += SCORING_RULES.INNOCENT_WIN;
      }
    }
  }

  return newScores;
}
