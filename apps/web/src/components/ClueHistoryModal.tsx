import React from "react";
import { X, BookOpen } from "lucide-react";
import { GlassCard } from "./GlassCard.js";
import { ClueRecord } from "@impostor/shared";

interface ClueHistoryModalProps {
  clues: ClueRecord[];
  onClose: () => void;
}

export const ClueHistoryModal: React.FC<ClueHistoryModalProps> = ({ clues, onClose }) => {
  // Group clues by round
  const rounds = clues.reduce((acc, clue) => {
    if (!acc[clue.round]) acc[clue.round] = [];
    acc[clue.round].push(clue);
    return acc;
  }, {} as Record<number, ClueRecord[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <GlassCard glow className="w-full max-w-md max-h-[85vh] flex flex-col p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-zinc-400 hover:text-white transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-crimson-950/60 border border-crimson-500/30 text-crimson-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-white">Historial de Pistas</h3>
            <p className="text-xs text-zinc-400">Pistas dichas en todas las rondas</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {Object.keys(rounds).length === 0 ? (
            <p className="text-center text-zinc-500 text-sm py-8">
              Aún no se han dado pistas en esta partida.
            </p>
          ) : (
            Object.entries(rounds).map(([roundNum, roundClues]) => (
              <div key={roundNum} className="rounded-xl bg-dark-900/60 border border-white/5 p-3.5">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2.5">
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-crimson-400">
                    Ronda {roundNum}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {roundClues.length} {roundClues.length === 1 ? "pista" : "pistas"}
                  </span>
                </div>
                <div className="space-y-2">
                  {roundClues.map((c, i) => (
                    <div key={i} className="flex items-baseline justify-between text-xs gap-2">
                      <span className="font-semibold text-zinc-300 shrink-0">{c.nickname}:</span>
                      <span className="font-medium text-crimson-200 bg-crimson-950/40 px-2 py-0.5 rounded-md border border-crimson-900/30 break-words text-right">
                        "{c.text}"
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
};
