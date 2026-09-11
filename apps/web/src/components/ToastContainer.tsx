import React from "react";
import { useGame } from "../context/GameContext.js";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { clsx } from "clsx";

export const ToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useGame();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {notifications.map((n) => {
        const isError = n.type === "error";
        const isSuccess = n.type === "success";

        return (
          <div
            key={n.id}
            className={clsx(
              "pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-lg animate-fade-in text-xs font-medium",
              isError && "bg-red-950/90 border-red-500/40 text-red-200 shadow-red-950/50",
              isSuccess && "bg-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50",
              !isError && !isSuccess && "bg-dark-850/90 border-white/10 text-zinc-200 shadow-black/60"
            )}
          >
            {isError ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : isSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-crimson-400 shrink-0" />
            )}
            <span className="flex-1">{n.message}</span>
            <button
              onClick={() => removeNotification(n.id)}
              className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
