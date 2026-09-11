import { z } from "zod";
export declare function sanitizeText(input: string): string;
export declare const createRoomSchema: z.ZodObject<{
    nickname: z.ZodPipeline<z.ZodEffects<z.ZodString, string, string>, z.ZodString>;
    avatar: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    mode: z.ZodDefault<z.ZodEnum<["virtual", "single-device", "multi-device"]>>;
    clueDeliveryMode: z.ZodDefault<z.ZodEnum<["oral", "written"]>>;
    impostorCount: z.ZodDefault<z.ZodNumber>;
    impostorsKnowEachOther: z.ZodDefault<z.ZodBoolean>;
    impostorGetsClue: z.ZodDefault<z.ZodBoolean>;
    clueTypePreference: z.ZodDefault<z.ZodEnum<["category_only", "context_only", "both"]>>;
    selectedCategories: z.ZodArray<z.ZodString, "many">;
    clueTimerSeconds: z.ZodDefault<z.ZodNumber>;
    discussionTimerSeconds: z.ZodDefault<z.ZodNumber>;
    voteTimerSeconds: z.ZodDefault<z.ZodNumber>;
    anonymousVoting: z.ZodDefault<z.ZodBoolean>;
    roleRevealMode: z.ZodDefault<z.ZodEnum<["immediate", "game_end", "never"]>>;
    lastChanceGuess: z.ZodDefault<z.ZodBoolean>;
    maxPlayers: z.ZodDefault<z.ZodNumber>;
    isPrivate: z.ZodDefault<z.ZodBoolean>;
    password: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    nickname: string;
    avatar: string;
    mode: "virtual" | "single-device" | "multi-device";
    clueDeliveryMode: "oral" | "written";
    impostorCount: number;
    impostorsKnowEachOther: boolean;
    impostorGetsClue: boolean;
    clueTypePreference: "category_only" | "context_only" | "both";
    selectedCategories: string[];
    clueTimerSeconds: number;
    discussionTimerSeconds: number;
    voteTimerSeconds: number;
    anonymousVoting: boolean;
    roleRevealMode: "immediate" | "game_end" | "never";
    lastChanceGuess: boolean;
    maxPlayers: number;
    isPrivate: boolean;
    password?: string | undefined;
}, {
    nickname: string;
    selectedCategories: string[];
    avatar?: string | undefined;
    mode?: "virtual" | "single-device" | "multi-device" | undefined;
    clueDeliveryMode?: "oral" | "written" | undefined;
    impostorCount?: number | undefined;
    impostorsKnowEachOther?: boolean | undefined;
    impostorGetsClue?: boolean | undefined;
    clueTypePreference?: "category_only" | "context_only" | "both" | undefined;
    clueTimerSeconds?: number | undefined;
    discussionTimerSeconds?: number | undefined;
    voteTimerSeconds?: number | undefined;
    anonymousVoting?: boolean | undefined;
    roleRevealMode?: "immediate" | "game_end" | "never" | undefined;
    lastChanceGuess?: boolean | undefined;
    maxPlayers?: number | undefined;
    isPrivate?: boolean | undefined;
    password?: string | undefined;
}>;
export declare const joinRoomSchema: z.ZodObject<{
    roomCode: z.ZodPipeline<z.ZodEffects<z.ZodString, string, string>, z.ZodString>;
    nickname: z.ZodPipeline<z.ZodEffects<z.ZodString, string, string>, z.ZodString>;
    avatar: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    password: z.ZodOptional<z.ZodString>;
    sessionToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    nickname: string;
    avatar: string;
    roomCode: string;
    password?: string | undefined;
    sessionToken?: string | undefined;
}, {
    nickname: string;
    roomCode: string;
    avatar?: string | undefined;
    password?: string | undefined;
    sessionToken?: string | undefined;
}>;
export declare const submitClueSchema: z.ZodObject<{
    text: z.ZodPipeline<z.ZodEffects<z.ZodString, string, string>, z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string;
}, {
    text: string;
}>;
export declare const submitVoteSchema: z.ZodObject<{
    targetPlayerId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    targetPlayerId: string;
}, {
    targetPlayerId: string;
}>;
export declare const lastChanceGuessSchema: z.ZodObject<{
    guess: z.ZodPipeline<z.ZodEffects<z.ZodString, string, string>, z.ZodString>;
}, "strip", z.ZodTypeAny, {
    guess: string;
}, {
    guess: string;
}>;
export declare const sendChatMessageSchema: z.ZodObject<{
    text: z.ZodPipeline<z.ZodEffects<z.ZodString, string, string>, z.ZodString>;
    reaction: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string;
    reaction?: string | undefined;
}, {
    text: string;
    reaction?: string | undefined;
}>;
export declare const updateSettingsSchema: z.ZodObject<{
    mode: z.ZodOptional<z.ZodEnum<["virtual", "single-device", "multi-device"]>>;
    clueDeliveryMode: z.ZodOptional<z.ZodEnum<["oral", "written"]>>;
    impostorCount: z.ZodOptional<z.ZodNumber>;
    impostorsKnowEachOther: z.ZodOptional<z.ZodBoolean>;
    impostorGetsClue: z.ZodOptional<z.ZodBoolean>;
    clueTypePreference: z.ZodOptional<z.ZodEnum<["category_only", "context_only", "both"]>>;
    selectedCategories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    clueTimerSeconds: z.ZodOptional<z.ZodNumber>;
    discussionTimerSeconds: z.ZodOptional<z.ZodNumber>;
    voteTimerSeconds: z.ZodOptional<z.ZodNumber>;
    anonymousVoting: z.ZodOptional<z.ZodBoolean>;
    roleRevealMode: z.ZodOptional<z.ZodEnum<["immediate", "game_end", "never"]>>;
    lastChanceGuess: z.ZodOptional<z.ZodBoolean>;
    maxPlayers: z.ZodOptional<z.ZodNumber>;
    isPrivate: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    mode?: "virtual" | "single-device" | "multi-device" | undefined;
    clueDeliveryMode?: "oral" | "written" | undefined;
    impostorCount?: number | undefined;
    impostorsKnowEachOther?: boolean | undefined;
    impostorGetsClue?: boolean | undefined;
    clueTypePreference?: "category_only" | "context_only" | "both" | undefined;
    selectedCategories?: string[] | undefined;
    clueTimerSeconds?: number | undefined;
    discussionTimerSeconds?: number | undefined;
    voteTimerSeconds?: number | undefined;
    anonymousVoting?: boolean | undefined;
    roleRevealMode?: "immediate" | "game_end" | "never" | undefined;
    lastChanceGuess?: boolean | undefined;
    maxPlayers?: number | undefined;
    isPrivate?: boolean | undefined;
}, {
    mode?: "virtual" | "single-device" | "multi-device" | undefined;
    clueDeliveryMode?: "oral" | "written" | undefined;
    impostorCount?: number | undefined;
    impostorsKnowEachOther?: boolean | undefined;
    impostorGetsClue?: boolean | undefined;
    clueTypePreference?: "category_only" | "context_only" | "both" | undefined;
    selectedCategories?: string[] | undefined;
    clueTimerSeconds?: number | undefined;
    discussionTimerSeconds?: number | undefined;
    voteTimerSeconds?: number | undefined;
    anonymousVoting?: boolean | undefined;
    roleRevealMode?: "immediate" | "game_end" | "never" | undefined;
    lastChanceGuess?: boolean | undefined;
    maxPlayers?: number | undefined;
    isPrivate?: boolean | undefined;
}>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type SubmitClueInput = z.infer<typeof submitClueSchema>;
export type SubmitVoteInput = z.infer<typeof submitVoteSchema>;
export type LastChanceGuessInput = z.infer<typeof lastChanceGuessSchema>;
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
//# sourceMappingURL=validators.d.ts.map