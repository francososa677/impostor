import {
  Player,
  RoomSettings,
  WordEntry,
  GameStats,
  ScoreBoard,
  ClueRecord,
  InternalGameState,
  InternalRoom,
} from "@impostor/shared";
import { pickRandom, shuffleArray } from "./random.js";
import { validateCanStartGame, checkWinConditions, countVotes } from "./rules.js";
import { isGuessCorrect } from "./fuzzy-match.js";
import { updateScoresForRound } from "./scoring.js";

export interface GameEngineInitOptions {
  room: InternalRoom;
  wordsByCategory: Map<string, WordEntry[]>;
}

export class GameEngine {
  /**
   * Initializes a brand new game match inside a room
   */
  public static startMatch(
    room: InternalRoom,
    wordsByCategory: Map<string, WordEntry[]>
  ): { success: boolean; error?: string } {
    const availableCategoryIds = Array.from(wordsByCategory.keys());
    const validation = validateCanStartGame(
      Array.from(room.players.values()),
      room.settings,
      availableCategoryIds
    );

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Reset player statuses for match
    const activePlayers: Player[] = [];
    for (const player of room.players.values()) {
      if (!player.isSpectator && player.isConnected) {
        player.isEliminated = false;
        activePlayers.push(player);
      }
    }

    // Pick 1 category uniformly from selected categories (Decision 99.3)
    const selectedCategory = pickRandom(room.settings.selectedCategories);
    const categoryWords = wordsByCategory.get(selectedCategory);
    if (!categoryWords || categoryWords.length === 0) {
      return { success: false, error: `No hay palabras cargadas para la categoría ${selectedCategory}` };
    }

    // Pick 1 secret word entry uniformly from that category
    const secretEntry = pickRandom(categoryWords);

    // Pick impostors cryptographically
    const shuffledPlayerIds = shuffleArray(activePlayers.map((p) => p.id));
    const impostorIds = new Set<string>(shuffledPlayerIds.slice(0, room.settings.impostorCount));

    // Turn order: random initial starting player, then circular order (Decision 17 & 99)
    const turnOrder = shuffleArray(activePlayers.map((p) => p.id));

    room.game = {
      phase: "CLUE_PHASE",
      round: 1,
      secretWord: secretEntry.word,
      secretCategory: secretEntry.category,
      contextClue: secretEntry.contextClue,
      impostorIds,
      turnOrder,
      currentTurnIndex: 0,
      cluesGivenInRound: new Set<string>(),
      clueHistory: [],
      votes: new Map<string, string>(),
      stats: {
        winner: "innocents",
        winReason: "",
        totalRounds: 1,
        durationMs: 0,
        impostors: Array.from(impostorIds).map((id) => ({
          id,
          nickname: room.players.get(id)?.nickname || "Impostor",
        })),
        eliminatedOrder: [],
        totalCluesGiven: 0,
        lastChanceUsed: false,
        secretWord: secretEntry.word,
        secretCategory: secretEntry.category,
      },
    };

    room.activeMatchCount += 1;
    return { success: true };
  }

  /**
   * Votes to change the secret word in Round 1.
   * If a majority of active players vote to change, a new word is picked.
   * The impostor and the starting player / turn order remain EXACTLY the same.
   */
  public static voteChangeWord(
    room: InternalRoom,
    playerId: string,
    wordsByCategory: Map<string, WordEntry[]>
  ): {
    success: boolean;
    wordChanged?: boolean;
    votesCount?: number;
    votesNeeded?: number;
    error?: string;
  } {
    if (!room.game) {
      return { success: false, error: "Partida no activa" };
    }

    if (room.game.round !== 1 || room.game.phase !== "CLUE_PHASE") {
      return {
        success: false,
        error: "El cambio de palabra solo se puede votar al inicio de la primera ronda",
      };
    }

    const player = room.players.get(playerId);
    if (!player || player.isEliminated || player.isSpectator) {
      return { success: false, error: "Jugador no autorizado para votar cambio de palabra" };
    }

    if (!room.game.changeWordVotes) {
      room.game.changeWordVotes = new Set<string>();
    }

    // Toggle vote
    if (room.game.changeWordVotes.has(playerId)) {
      room.game.changeWordVotes.delete(playerId);
    } else {
      room.game.changeWordVotes.add(playerId);
    }

    const alivePlayers = Array.from(room.players.values()).filter(
      (p) => !p.isEliminated && !p.isSpectator
    );
    const votesNeeded = Math.ceil(alivePlayers.length / 2);

    if (room.game.changeWordVotes.size >= votesNeeded) {
      // Pick a new secret word
      const selectedCategory = pickRandom(room.settings.selectedCategories);
      const categoryWords = wordsByCategory.get(selectedCategory);
      if (!categoryWords || categoryWords.length === 0) {
        return { success: false, error: "No hay palabras disponibles para cambiar" };
      }

      // Filter out current word if possible
      const candidateWords = categoryWords.filter(
        (w) => w.word.toLowerCase() !== room.game?.secretWord.toLowerCase()
      );
      const newSecretEntry =
        candidateWords.length > 0 ? pickRandom(candidateWords) : pickRandom(categoryWords);

      room.game.secretWord = newSecretEntry.word;
      room.game.secretCategory = newSecretEntry.category;
      room.game.contextClue = newSecretEntry.contextClue;
      if (room.game.stats) {
        room.game.stats.secretWord = newSecretEntry.word;
        room.game.stats.secretCategory = newSecretEntry.category;
      }

      // Reset clues given in this round and clue history so far
      room.game.cluesGivenInRound.clear();
      room.game.clueHistory = [];
      room.game.currentTurnIndex = 0; // Starts from the same first player
      room.game.changeWordVotes.clear();

      return {
        success: true,
        wordChanged: true,
        votesCount: 0,
        votesNeeded,
      };
    }

    return {
      success: true,
      wordChanged: false,
      votesCount: room.game.changeWordVotes.size,
      votesNeeded,
    };
  }

  /**
   * Submits a clue during CLUE_PHASE
   */
  public static submitClue(
    room: InternalRoom,
    playerId: string,
    clueText: string
  ): { success: boolean; advanceToPhase?: string; error?: string } {
    if (!room.game || room.game.phase !== "CLUE_PHASE") {
      return { success: false, error: "No es momento de dar pistas" };
    }

    const currentTurnPlayerId = room.game.turnOrder[room.game.currentTurnIndex];
    if (currentTurnPlayerId !== playerId) {
      return { success: false, error: "No es tu turno de dar pista" };
    }

    const player = room.players.get(playerId);
    if (!player || player.isEliminated || player.isSpectator) {
      return { success: false, error: "Jugador no autorizado para dar pistas" };
    }

    // Record clue
    const record: ClueRecord = {
      round: room.game.round,
      playerId,
      nickname: player.nickname,
      text: clueText.trim() || "Pista omitida",
      timestamp: Date.now(),
    };
    room.game.clueHistory.push(record);
    room.game.cluesGivenInRound.add(playerId);
    if (room.game.stats) {
      room.game.stats.totalCluesGiven += 1;
    }

    // Advance turn or check if round finished
    return this.advanceTurn(room);
  }

  /**
   * Advances the turn to the next alive player or transitions to discussion/voting
   */
  public static advanceTurn(
    room: InternalRoom
  ): { success: boolean; advanceToPhase?: string; error?: string } {
    if (!room.game || room.game.phase !== "CLUE_PHASE") {
      return { success: false, error: "Fase incorrecta" };
    }

    const alivePlayerIds = room.game.turnOrder.filter((id) => {
      const p = room.players.get(id);
      return p && !p.isEliminated && !p.isSpectator;
    });

    // Check if all alive players gave their clue this round
    const allGiven = alivePlayerIds.every((id) => room.game?.cluesGivenInRound.has(id));

    if (allGiven) {
      // Transition to DISCUSSION (if timer > 0) or directly to VOTING
      room.game.votes.clear();
      room.game.tieBreakerCandidateIds = undefined;

      if (room.settings.discussionTimerSeconds > 0) {
        room.game.phase = "DISCUSSION";
        return { success: true, advanceToPhase: "DISCUSSION" };
      } else {
        room.game.phase = "VOTING";
        return { success: true, advanceToPhase: "VOTING" };
      }
    }

    // Next alive player in turn order
    let nextIndex = (room.game.currentTurnIndex + 1) % room.game.turnOrder.length;
    let attempts = 0;
    while (attempts < room.game.turnOrder.length) {
      const candidateId = room.game.turnOrder[nextIndex];
      const p = room.players.get(candidateId);
      if (p && !p.isEliminated && !p.isSpectator && !room.game.cluesGivenInRound.has(candidateId)) {
        room.game.currentTurnIndex = nextIndex;
        return { success: true };
      }
      nextIndex = (nextIndex + 1) % room.game.turnOrder.length;
      attempts++;
    }

    // Fallback if everyone has given clue
    room.game.phase = "VOTING";
    return { success: true, advanceToPhase: "VOTING" };
  }

  /**
   * Transition from discussion to voting
   */
  public static startVoting(room: InternalRoom): { success: boolean } {
    if (!room.game) return { success: false };
    room.game.phase = "VOTING";
    room.game.votes.clear();
    return { success: true };
  }

  /**
   * Submits a vote
   */
  public static submitVote(
    room: InternalRoom,
    voterId: string,
    targetId: string
  ): { success: boolean; allVoted?: boolean; error?: string } {
    if (!room.game || (room.game.phase !== "VOTING" && room.game.phase !== "TIE_BREAKER")) {
      return { success: false, error: "No es momento de votación" };
    }

    const voter = room.players.get(voterId);
    if (!voter || voter.isEliminated || voter.isSpectator) {
      return { success: false, error: "No tienes permiso para votar" };
    }

    const target = room.players.get(targetId);
    if (!target || target.isEliminated || target.isSpectator) {
      return { success: false, error: "El jugador votado no es válido" };
    }

    // Cannot vote for self
    if (voterId === targetId) {
      return { success: false, error: "No puedes votarte a ti mismo" };
    }

    // In tie-breaker phase, target must be one of the tied candidates
    if (
      room.game.phase === "TIE_BREAKER" &&
      room.game.tieBreakerCandidateIds &&
      !room.game.tieBreakerCandidateIds.includes(targetId)
    ) {
      return { success: false, error: "Debes votar por uno de los candidatos empatados" };
    }

    room.game.votes.set(voterId, targetId);

    // Check if all alive players have voted
    const aliveVoters = Array.from(room.players.values()).filter(
      (p) => !p.isEliminated && !p.isSpectator && p.isConnected
    );

    const allVoted = aliveVoters.every((p) => room.game?.votes.has(p.id));

    return { success: true, allVoted };
  }

  /**
   * Resolves the voting outcome
   */
  public static resolveVoting(room: InternalRoom): {
    phase: InternalGameState["phase"];
    eliminatedPlayerId?: string | null;
    isTie?: boolean;
    isGameOver?: boolean;
  } {
    if (!room.game) throw new Error("Game is not active");

    const candidateFilter = room.game.phase === "TIE_BREAKER" ? room.game.tieBreakerCandidateIds : undefined;
    const { voteCounts, topCandidateIds } = countVotes(room.game.votes, candidateFilter);

    // Track most voted player stats
    if (room.game.stats && topCandidateIds.length > 0) {
      const topId = topCandidateIds[0];
      const p = room.players.get(topId);
      if (p) {
        room.game.stats.mostVotedPlayer = {
          id: topId,
          nickname: p.nickname,
          voteCount: voteCounts.get(topId) || 0,
        };
      }
    }

    // Handle Ties
    if (topCandidateIds.length > 1) {
      if (room.game.phase === "VOTING") {
        // First tie -> Transition to TIE_BREAKER
        room.game.phase = "TIE_BREAKER";
        room.game.tieBreakerCandidateIds = topCandidateIds;
        room.game.votes.clear();
        return { phase: "TIE_BREAKER", isTie: true };
      } else {
        // Second tie -> No one eliminated, proceed to next round (Decision 102 & 34)
        room.game.lastEliminatedPlayerId = null;
        room.game.lastEliminatedWasImpostor = null;
        room.scores = updateScoresForRound(
          room.scores,
          room.players,
          room.game.impostorIds,
          room.game.votes,
          null,
          null
        );

        this.startNextRound(room);
        return { phase: "CLUE_PHASE", isTie: true, eliminatedPlayerId: null };
      }
    }

    // If no votes were cast (e.g., edge case timeout)
    if (topCandidateIds.length === 0) {
      this.startNextRound(room);
      return { phase: "CLUE_PHASE", eliminatedPlayerId: null };
    }

    // Single eliminated player
    const eliminatedId = topCandidateIds[0];
    const eliminatedPlayer = room.players.get(eliminatedId);
    const wasImpostor = room.game.impostorIds.has(eliminatedId);

    room.game.lastEliminatedPlayerId = eliminatedId;
    room.game.lastEliminatedWasImpostor = wasImpostor;

    if (eliminatedPlayer) {
      eliminatedPlayer.isEliminated = true;
      if (room.game.stats) {
        room.game.stats.eliminatedOrder.push({
          id: eliminatedId,
          nickname: eliminatedPlayer.nickname,
          round: room.game.round,
          wasImpostor,
        });
      }
    }

    // Check Last Chance Guess rule (Decision 100):
    // If eliminated player is an impostor and lastChanceGuess is enabled
    if (wasImpostor && room.settings.lastChanceGuess) {
      room.game.phase = "LAST_CHANCE";
      room.game.lastChanceTargetPlayerId = eliminatedId;
      if (room.game.stats) {
        room.game.stats.lastChanceUsed = true;
      }
      return { phase: "LAST_CHANCE", eliminatedPlayerId: eliminatedId };
    }

    // Otherwise, reveal eliminated and check win conditions
    return this.finishEliminationAndCheckWin(room, eliminatedId);
  }

  /**
   * Handles impostor's guess in the Last Chance phase
   */
  public static handleLastChanceGuess(
    room: InternalRoom,
    playerId: string,
    guessText: string
  ): { success: boolean; isCorrect: boolean; isGameOver: boolean } {
    if (!room.game || room.game.phase !== "LAST_CHANCE" || room.game.lastChanceTargetPlayerId !== playerId) {
      return { success: false, isCorrect: false, isGameOver: false };
    }

    const isCorrect = isGuessCorrect(guessText, room.game.secretWord);
    if (room.game.stats) {
      room.game.stats.lastChanceSuccess = isCorrect;
      room.game.stats.lastChanceGuess = guessText;
    }

    if (isCorrect) {
      // Impostor successfully guessed! Impostors WIN! (Decision 100)
      room.game.phase = "GAME_OVER";
      if (room.game.stats) {
        room.game.stats.winner = "impostors";
        room.game.stats.winReason = `¡El impostor descubrió la palabra secreta ("${room.game.secretWord}") en su última oportunidad!`;
      }

      room.scores = updateScoresForRound(
        room.scores,
        room.players,
        room.game.impostorIds,
        room.game.votes,
        playerId,
        "impostors",
        playerId
      );

      return { success: true, isCorrect: true, isGameOver: true };
    }

    // Guess was incorrect -> normal elimination resolution
    const outcome = this.finishEliminationAndCheckWin(room, playerId);
    return {
      success: true,
      isCorrect: false,
      isGameOver: outcome.isGameOver || false,
    };
  }

  /**
   * Finalizes elimination, calculates round scores, and checks for win conditions
   */
  public static finishEliminationAndCheckWin(
    room: InternalRoom,
    eliminatedId: string
  ): { phase: InternalGameState["phase"]; isGameOver: boolean; winner?: string } {
    if (!room.game) throw new Error("Game is not active");

    const winResult = checkWinConditions(room.players, room.game.impostorIds);

    if (winResult.isGameOver) {
      room.game.phase = "GAME_OVER";
      if (room.game.stats) {
        room.game.stats.winner = winResult.winner || "innocents";
        room.game.stats.winReason = winResult.winReason;
      }

      room.scores = updateScoresForRound(
        room.scores,
        room.players,
        room.game.impostorIds,
        room.game.votes,
        eliminatedId,
        winResult.winner
      );

      return { phase: "GAME_OVER", isGameOver: true, winner: winResult.winner || undefined };
    }

    // Game continues to next round
    room.scores = updateScoresForRound(
      room.scores,
      room.players,
      room.game.impostorIds,
      room.game.votes,
      eliminatedId,
      null
    );

    room.game.phase = "REVEAL_ELIMINATED";
    return { phase: "REVEAL_ELIMINATED", isGameOver: false };
  }

  /**
   * Starts next round
   */
  public static startNextRound(room: InternalRoom): void {
    if (!room.game) return;

    room.game.round += 1;
    if (room.game.stats) {
      room.game.stats.totalRounds = room.game.round;
    }

    room.game.cluesGivenInRound.clear();
    room.game.votes.clear();
    room.game.tieBreakerCandidateIds = undefined;
    room.game.lastChanceTargetPlayerId = null;

    // Find next starting player index among alive players
    const aliveIds = room.game.turnOrder.filter((id) => {
      const p = room.players.get(id);
      return p && !p.isEliminated && !p.isSpectator;
    });

    if (aliveIds.length > 0) {
      const firstAliveId = aliveIds[0];
      room.game.currentTurnIndex = room.game.turnOrder.indexOf(firstAliveId);
    } else {
      room.game.currentTurnIndex = 0;
    }

    room.game.phase = "CLUE_PHASE";
  }

  /**
   * Rematch: preserves players, room code, and scores (optionally reset) (Decision 105)
   */
  public static rematch(
    room: InternalRoom,
    wordsByCategory: Map<string, WordEntry[]>,
    resetScores = false
  ): { success: boolean; error?: string } {
    // Admit eligible spectators to active players if under maxPlayers
    for (const spectator of room.spectators.values()) {
      if (room.players.size < room.settings.maxPlayers) {
        spectator.isSpectator = false;
        room.players.set(spectator.id, spectator);
        room.spectators.delete(spectator.id);
      }
    }

    if (resetScores) {
      for (const key of Object.keys(room.scores)) {
        room.scores[key] = {
          ...room.scores[key],
          wins: 0,
          survivedRounds: 0,
          correctVotes: 0,
          deceivedInnocents: 0,
          lastChanceBonuses: 0,
          totalScore: 0,
        };
      }
    }

    return this.startMatch(room, wordsByCategory);
  }
}
