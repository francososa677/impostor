import React from "react";
import { Clock } from "lucide-react";
import { clsx } from "clsx";

interface TimerDisplayProps {
  remainingSeconds: number;
  totalSeconds?: number;
  label?: string;
  type?: "clue" | "discussion" | "vote";
  className?: string;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  remainingSeconds,
  label = "Tiempo restante",
  type = "clue",
  className,
}) => {
  const isUrgent = remainingSeconds <= 10 && remainingSeconds > 0;

  const typeLabels = {
    clue: "Palabra en curso",
    discussion: "Fase de discusión",
    vote: "Votación activa",
  };

  return (
    <div
      className={clsx(
        "flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all duration-300",
        isUrgent
          ? "bg-red-950/80 border-red-500/60 shadow-lg shadow-red-900/50 animate-pulse text-red-300"
          : "bg-dark-850/80 border-white/10 text-zinc-300",
        className
      )}
    >
      <Clock className={clsx("w-4 h-4", isUrgent ? "text-red-400 animate-spin" : "text-crimson-400")} />
      <span className="text-xs font-medium text-zinc-400 hidden sm:inline">
        {label || typeLabels[type]}:
      </span>
      <span className={clsx("font-mono font-bold text-sm", isUrgent ? "text-red-400" : "text-white")}>
        {remainingSeconds}s
      </span>
    </div>
  );
};
