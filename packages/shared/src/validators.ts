import { z } from "zod";
import { GAME_LIMITS } from "./constants.js";

// Sanitizer for text (strip HTML tags and control chars)
export function sanitizeText(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>?/gm, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim();
}

export const createRoomSchema = z.object({
  nickname: z
    .string()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(GAME_LIMITS.MIN_NICKNAME_LENGTH, `El apodo debe tener al menos ${GAME_LIMITS.MIN_NICKNAME_LENGTH} caracteres`)
        .max(GAME_LIMITS.MAX_NICKNAME_LENGTH, `El apodo no puede exceder ${GAME_LIMITS.MAX_NICKNAME_LENGTH} caracteres`)
    ),
  avatar: z.string().optional().default("detective-1"),
  mode: z.enum(["virtual", "single-device", "multi-device"]).default("virtual"),
  clueDeliveryMode: z.enum(["oral", "written"]).default("oral"),
  impostorCount: z.number().int().min(1).max(5).default(1),
  impostorsKnowEachOther: z.boolean().default(false),
  impostorGetsClue: z.boolean().default(true),
  clueTypePreference: z.enum(["category_only", "context_only", "both"]).default("context_only"),
  selectedCategories: z.array(z.string()).min(1, "Debes seleccionar al menos una categoría"),
  clueTimerSeconds: z.number().int().nonnegative().default(30),
  discussionTimerSeconds: z.number().int().nonnegative().default(60),
  voteTimerSeconds: z.number().int().nonnegative().default(45),
  anonymousVoting: z.boolean().default(true),
  roleRevealMode: z.enum(["immediate", "game_end", "never"]).default("immediate"),
  lastChanceGuess: z.boolean().default(true),
  maxPlayers: z.number().int().min(GAME_LIMITS.MIN_PLAYERS).max(GAME_LIMITS.MAX_PLAYERS).default(8),
  isPrivate: z.boolean().default(false),
  password: z.string().max(32).optional(),
});

export const joinRoomSchema = z.object({
  roomCode: z.string().transform(sanitizeText).pipe(z.string().length(GAME_LIMITS.ROOM_CODE_LENGTH)),
  nickname: z
    .string()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(GAME_LIMITS.MIN_NICKNAME_LENGTH)
        .max(GAME_LIMITS.MAX_NICKNAME_LENGTH)
    ),
  avatar: z.string().optional().default("detective-1"),
  password: z.string().max(32).optional(),
  sessionToken: z.string().optional(),
});

export const submitClueSchema = z.object({
  text: z.string().transform(sanitizeText).pipe(z.string().max(GAME_LIMITS.MAX_CLUE_LENGTH)),
});

export const submitVoteSchema = z.object({
  targetPlayerId: z.string().min(1),
});

export const lastChanceGuessSchema = z.object({
  guess: z
    .string()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(1, "La palabra no puede estar vacía")
        .max(GAME_LIMITS.MAX_GUESS_LENGTH)
    ),
});

export const sendChatMessageSchema = z.object({
  text: z
    .string()
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(1)
        .max(GAME_LIMITS.MAX_CHAT_MESSAGE_LENGTH)
    ),
  reaction: z.string().max(10).optional(),
});

export const updateSettingsSchema = z.object({
  mode: z.enum(["virtual", "single-device", "multi-device"]).optional(),
  clueDeliveryMode: z.enum(["oral", "written"]).optional(),
  impostorCount: z.number().int().min(1).max(5).optional(),
  impostorsKnowEachOther: z.boolean().optional(),
  impostorGetsClue: z.boolean().optional(),
  clueTypePreference: z.enum(["category_only", "context_only", "both"]).optional(),
  selectedCategories: z.array(z.string()).min(1).optional(),
  clueTimerSeconds: z.number().int().nonnegative().optional(),
  discussionTimerSeconds: z.number().int().nonnegative().optional(),
  voteTimerSeconds: z.number().int().nonnegative().optional(),
  anonymousVoting: z.boolean().optional(),
  roleRevealMode: z.enum(["immediate", "game_end", "never"]).optional(),
  lastChanceGuess: z.boolean().optional(),
  maxPlayers: z.number().int().min(GAME_LIMITS.MIN_PLAYERS).max(GAME_LIMITS.MAX_PLAYERS).optional(),
  isPrivate: z.boolean().optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type SubmitClueInput = z.infer<typeof submitClueSchema>;
export type SubmitVoteInput = z.infer<typeof submitVoteSchema>;
export type LastChanceGuessInput = z.infer<typeof lastChanceGuessSchema>;
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
