import React, { useState } from "react";
import { ClueRecord, Player } from "@impostor/shared";
import { PlayerAvatarView } from "./AvatarPicker.js";
import { MessageSquare, Check, Clock } from "lucide-react";
import { clsx } from "clsx";

interface LiveCluesBoardProps {
  clues: ClueRecord[];
  players: Player[];
  currentRound: number;
  currentTurnPlayerId?: string | null;
  phase?: string;
  className?: string;
}

export const LiveCluesBoard: React.FC<LiveCluesBoardProps> = ({
  clues,
  players,
  currentRound,
  currentTurnPlayerId,
  phase,
  className = "",
}) => {
  // Group clues by round
  const roundsMap = clues.reduce((acc, clue) => {
    if (!acc[clue.round]) acc[clue.round] = [];
    acc[clue.round].push(clue);
    return acc;
  }, {} as Record<number, ClueRecord[]>);

  const availableRounds = Array.from(
    new Set([...Object.keys(roundsMap).map(Number), currentRound])
  ).sort((a, b) => a - b);

  const [selectedRound, setSelectedRound] = useState<number>(currentRound);

  // If selected round is not currently valid, default to currentRound
  const activeRound = availableRounds.includes(selectedRound) ? selectedRound : currentRound;
  const currentRoundClues = roundsMap[activeRound] || [];

  return (
    <div className={clsx("rounded-2xl bg-dark-900/80 border border-white/10 p-4 space-y-3.5 shadow-xl backdrop-blur-md", className)}>
      {/* Header with Round Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-crimson-600/20 text-crimson-400 border border-crimson-500/30">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm text-white tracking-wide">
              Pistas en Pantalla
            </h4>
            <span className="text-[11px] text-zinc-400">
              {currentRoundClues.length} pista{currentRoundClues.length === 1 ? "" : "s"} registrada{currentRoundClues.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* Round Tabs (if more than 1 round exists) */}
        {availableRounds.length > 1 && (
          <div className="flex items-center gap-1 bg-dark-950 p-1 rounded-xl border border-white/5">
            {availableRounds.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRound(r)}
                className={clsx(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
                  activeRound === r
                    ? "bg-crimson-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                Ronda {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clues List / Grid */}
      {currentRoundClues.length === 0 && phase === "CLUE_PHASE" ? (
        <div className="text-center py-6 px-4 rounded-xl bg-dark-950/40 border border-dashed border-white/10">
          <Clock className="w-6 h-6 text-zinc-500 mx-auto mb-1.5 animate-pulse" />
          <p className="text-xs text-zinc-400 font-medium">
            Esperando que los jugadores escriban sus pistas...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {currentRoundClues.map((c, idx) => {
            const player = players.find((p) => p.id === c.playerId);
            const isEliminated = player?.isEliminated;

            return (
              <div
                key={`${c.playerId}-${idx}`}
                className={clsx(
                  "p-3 rounded-xl border flex items-center justify-between gap-3 transition-all animate-fade-in",
                  isEliminated
                    ? "bg-dark-950/40 border-white/5 opacity-60"
                    : "bg-dark-850/90 border-white/10 hover:border-crimson-500/30"
                )}
              >
                {/* Player info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <PlayerAvatarView avatar={player?.avatar || "detective-1"} className="w-8 h-8 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-zinc-200 truncate flex items-center gap-1">
                      <span>{c.nickname}</span>
                      {isEliminated && (
                        <span className="text-[9px] text-red-400 font-normal">(Eliminado)</span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" />
                      Pista #{idx + 1}
                    </span>
                  </div>
                </div>

                {/* Big Clue Text */}
                <div className="text-right shrink-0 max-w-[55%]">
                  <span className="inline-block px-3 py-1 rounded-lg bg-crimson-950/80 border border-crimson-500/40 text-crimson-200 font-bold text-sm tracking-wide shadow-sm break-words">
                    "{c.text}"
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Players who haven't spoken yet in current active clue phase */}
      {phase === "CLUE_PHASE" && activeRound === currentRound && (
        <div className="pt-2 border-t border-white/5">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500">
            <span className="font-semibold text-zinc-400">Pendientes:</span>
            {players
              .filter(
                (p) =>
                  !p.isEliminated &&
                  !p.isSpectator &&
                  !currentRoundClues.some((c) => c.playerId === p.id)
              )
              .map((p) => {
                const isCurrent = p.id === currentTurnPlayerId;
                return (
                  <span
                    key={p.id}
                    className={clsx(
                      "px-2 py-0.5 rounded-md border text-[10px] flex items-center gap-1",
                      isCurrent
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse font-bold"
                        : "bg-dark-950 text-zinc-400 border-white/5"
                    )}
                  >
                    {isCurrent && "⏳"} {p.nickname}
                  </span>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
