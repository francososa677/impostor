import {
  PublicRoomState,
  PlayerPrivateState,
  RoomSummary,
  ChatMessage,
} from "./types.js";
import {
  CreateRoomInput,
  JoinRoomInput,
  SubmitClueInput,
  SubmitVoteInput,
  LastChanceGuessInput,
  SendChatMessageInput,
  UpdateSettingsInput,
} from "./validators.js";

// Client-to-Server Events
export interface ClientToServerEvents {
  "room:create": (
    payload: CreateRoomInput,
    callback: (res: { success: boolean; roomCode?: string; playerId?: string; sessionToken?: string; error?: string }) => void
  ) => void;

  "room:join": (
    payload: JoinRoomInput,
    callback: (res: { success: boolean; roomCode?: string; playerId?: string; sessionToken?: string; isSpectator?: boolean; error?: string }) => void
  ) => void;

  "room:reconnect": (
    payload: { roomCode: string; playerId: string; sessionToken: string },
    callback: (res: { success: boolean; error?: string }) => void
  ) => void;

  "room:leave": () => void;

  "room:kick": (
    payload: { targetPlayerId: string },
    callback: (res: { success: boolean; error?: string }) => void
  ) => void;

  "room:settings-update": (
    payload: UpdateSettingsInput,
    callback: (res: { success: boolean; error?: string }) => void
  ) => void;

  "lobby:subscribe": (callback: (rooms: RoomSummary[]) => void) => void;
  "lobby:unsubscribe": () => void;

  "game:start": (callback: (res: { success: boolean; error?: string }) => void) => void;

  "game:clue-submit": (
    payload: SubmitClueInput,
    callback: (res: { success: boolean; error?: string }) => void
  ) => void;

  "game:skip-turn": (callback: (res: { success: boolean; error?: string }) => void) => void;

  "game:skip-discussion": (callback: (res: { success: boolean; error?: string }) => void) => void;

  "game:vote-change-word": (callback: (res: { success: boolean; wordChanged?: boolean; error?: string }) => void) => void;

  "game:vote-submit": (
    payload: SubmitVoteInput,
    callback: (res: { success: boolean; error?: string }) => void
  ) => void;

  "game:last-chance-guess": (
    payload: LastChanceGuessInput,
    callback: (res: { success: boolean; isCorrect?: boolean; error?: string }) => void
  ) => void;

  "game:rematch": (
    payload: { resetScores?: boolean },
    callback: (res: { success: boolean; error?: string }) => void
  ) => void;

  "chat:send": (
    payload: SendChatMessageInput,
    callback: (res: { success: boolean; error?: string }) => void
  ) => void;
}

// Server-to-Client Events
export interface ServerToClientEvents {
  "room:state": (state: PublicRoomState) => void;
  "player:private-state": (state: PlayerPrivateState) => void;
  "lobby:update": (rooms: RoomSummary[]) => void;
  "chat:message": (message: ChatMessage) => void;
  "timer:tick": (payload: { type: "clue" | "discussion" | "vote"; remainingSeconds: number }) => void;
  "notification:error": (message: string) => void;
  "notification:system": (message: string) => void;
  "player:kicked": (reason: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  playerId?: string;
  roomCode?: string;
  sessionToken?: string;
  ipAddress?: string;
}
