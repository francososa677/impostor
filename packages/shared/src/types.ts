export type GamePhase =
  | "LOBBY"
  | "STARTING"
  | "ROLE_REVEAL"
  | "CLUE_PHASE"
  | "DISCUSSION"
  | "VOTING"
  | "TIE_BREAKER"
  | "REVEAL_ELIMINATED"
  | "LAST_CHANCE"
  | "GAME_OVER";

export type RoomVisibility = "public" | "private";

export type GameMode = "virtual" | "single-device" | "multi-device";

export type ClueDeliveryMode = "oral" | "written";

export type ClueTypePreference = "category_only" | "context_only" | "both";

export type RoleRevealMode = "immediate" | "game_end" | "never";

export interface Player {
  id: string;
  nickname: string;
  avatar: string;
  socketId?: string;
  isConnected: boolean;
  isHost: boolean;
  isEliminated: boolean;
  isSpectator: boolean;
  joinedAt: number;
}

export interface RoomSettings {
  mode: GameMode;
  clueDeliveryMode: ClueDeliveryMode;
  impostorCount: number;
  impostorsKnowEachOther: boolean;
  impostorGetsClue: boolean;
  clueTypePreference: ClueTypePreference;
  selectedCategories: string[];
  clueTimerSeconds: number; // 0 = unlimited, 15, 30, 45, 60
  discussionTimerSeconds: number; // 0 = unlimited, 30, 60, 90, 120
  voteTimerSeconds: number; // 0 = unlimited, 30, 60, 90, 120
  anonymousVoting: boolean;
  roleRevealMode: RoleRevealMode;
  lastChanceGuess: boolean;
  maxPlayers: number;
  isPrivate: boolean;
  hasPassword?: boolean;
}

export interface WordEntry {
  word: string;
  category: string;
  contextClue: string;
  aliases?: string[];
}

export interface ClueRecord {
  round: number;
  playerId: string;
  nickname: string;
  text: string;
  timestamp: number;
}

export interface VoteRecord {
  voterId: string;
  targetId: string;
  timestamp: number;
}

export interface PlayerScoreBreakdown {
  playerId: string;
  nickname: string;
  avatar: string;
  wins: number;
  survivedRounds: number;
  correctVotes: number;
  deceivedInnocents: number;
  lastChanceBonuses: number;
  totalScore: number;
}

export interface ScoreBoard {
  [playerId: string]: PlayerScoreBreakdown;
}

export interface GameStats {
  winner: "innocents" | "impostors";
  winReason: string;
  totalRounds: number;
  durationMs: number;
  impostors: { id: string; nickname: string }[];
  eliminatedOrder: { id: string; nickname: string; round: number; wasImpostor: boolean }[];
  totalCluesGiven: number;
  mostVotedPlayer?: { id: string; nickname: string; voteCount: number };
  lastChanceUsed: boolean;
  lastChanceSuccess?: boolean;
  lastChanceGuess?: string;
  secretWord: string;
  secretCategory: string;
}

export interface PublicGameState {
  phase: GamePhase;
  round: number;
  turnOrder: string[]; // player ids in circular order
  currentTurnIndex: number;
  currentTurnPlayerId: string | null;
  cluesGivenInRound: string[]; // player ids who gave clue this round
  clueHistory: ClueRecord[];
  clueTimerRemaining?: number;
  discussionTimerRemaining?: number;
  voteTimerRemaining?: number;
  tieBreakerCandidateIds?: string[];
  votingVotersRemaining?: string[]; // IDs of players who haven't voted yet
  lastVotesCount?: Record<string, number>; // targetId -> count
  lastEliminatedPlayerId?: string | null;
  lastEliminatedWasImpostor?: boolean | null; // null if role reveal mode is not immediate
  lastChanceTargetPlayerId?: string | null;
  changeWordVotes?: string[];
  changeWordVotesNeeded?: number;
  stats?: GameStats;
}

export interface PublicRoomState {
  id: string;
  code: string;
  hostId: string;
  visibility: RoomVisibility;
  settings: RoomSettings;
  players: Player[];
  spectators: Player[];
  game: PublicGameState | null;
  scores: ScoreBoard;
  activeMatchCount: number;
}

export interface PlayerPrivateState {
  playerId: string;
  role: "innocent" | "impostor" | "spectator";
  secretWord?: string; // only for innocents
  category?: string; // visible to innocents, or impostor if given category clue
  contextClue?: string; // only for impostor if configured
  impostorTeammates?: { id: string; nickname: string }[]; // if impostors know each other
  isYourTurn: boolean;
  hasVoted: boolean;
  hasVotedChangeWord?: boolean;
  isLastChanceActiveForYou: boolean;
}

export interface RoomSummary {
  id: string;
  code: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  mode: GameMode;
  visibility: RoomVisibility;
  hasPassword: boolean;
  impostorCount: number;
  status: "WAITING" | "IN_GAME";
}

export interface ChatMessage {
  id: string;
  playerId: string;
  nickname: string;
  avatar: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  isSpectator?: boolean;
  reaction?: string;
}
