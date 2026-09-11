import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Volume2, VolumeX, ShieldAlert, LogOut, Radio } from "lucide-react";
import { useGame } from "../context/GameContext.js";
import { sounds } from "../audio/sound-system.js";

export const Navbar: React.FC = () => {
  const { isConnected, isReconnecting, roomState, leaveRoom } = useGame();
  const [isMuted, setIsMuted] = useState(sounds.isMuted());
  const navigate = useNavigate();

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleLeave = () => {
    if (confirm("¿Seguro que querés salir de la sala?")) {
      leaveRoom();
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/5 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-crimson-600 flex items-center justify-center shadow-lg shadow-crimson-900/50 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-black text-xl tracking-wider crimson-gradient-text uppercase">
            Impostor
          </span>
        </Link>

        {/* Status and Controls */}
        <div className="flex items-center gap-3">
          {/* Connection indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-dark-900 border border-white/5 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? "bg-emerald-500 animate-pulse"
                  : isReconnecting
                  ? "bg-amber-500 animate-ping"
                  : "bg-red-500"
              }`}
            />
            <span className="text-zinc-400 font-medium hidden sm:inline">
              {isConnected ? "En línea" : isReconnecting ? "Reconectando..." : "Desconectado"}
            </span>
          </div>

          {/* Room code badge if inside a room */}
          {roomState && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-crimson-950/60 border border-crimson-600/30 text-xs font-mono font-bold text-crimson-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>{roomState.code}</span>
            </div>
          )}

          {/* Audio toggle button */}
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-lg bg-dark-850 hover:bg-dark-800 border border-white/5 text-zinc-400 hover:text-white transition-colors"
            title={isMuted ? "Activar sonido" : "Silenciar"}
            aria-label="Toggle sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-crimson-400" />}
          </button>

          {/* Leave room button */}
          {roomState && (
            <button
              onClick={handleLeave}
              className="p-2 rounded-lg bg-dark-850 hover:bg-red-950/40 border border-white/5 hover:border-red-500/30 text-zinc-400 hover:text-red-400 transition-colors"
              title="Salir de la sala"
              aria-label="Salir de la sala"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
