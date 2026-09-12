import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext.js";
import { GlassCard } from "../components/GlassCard.js";
import { Button } from "../components/Button.js";
import { PlayerAvatarView } from "../components/AvatarPicker.js";
import { ShieldAlert } from "lucide-react";

export const JoinPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { joinRoom } = useGame();
  const [nickname, setNickname] = useState(() => localStorage.getItem("impostor_nickname") || "");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const cleanCode = (code || "").trim().toUpperCase();

  useEffect(() => {
    localStorage.setItem("impostor_nickname", nickname);
  }, [nickname]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || cleanCode.length !== 5) return;

    setLoading(true);
    const result = await joinRoom({
      roomCode: cleanCode,
      nickname: nickname.trim(),
      avatar: "detective-1",
    });
    setLoading(false);

    if (result.success && result.roomCode) {
      navigate(`/room/${result.roomCode}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center px-4 py-8 max-w-md mx-auto">
      <GlassCard glow className="w-full p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-crimson-600/20 border border-crimson-500/30 text-crimson-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-crimson-950">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="font-heading font-black text-2xl text-white uppercase">
            Unirse a la Sala
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Código de invitación:{" "}
            <span className="font-mono font-bold text-crimson-400 text-sm">{cleanCode}</span>
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Tu Apodo
            </label>
            <div className="flex items-center gap-3">
              <PlayerAvatarView name={nickname || "Tú"} className="w-11 h-11 text-base font-black" />
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ingresá tu apodo"
                maxLength={20}
                className="flex-1 px-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-crimson-500 text-sm"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={!nickname.trim() || cleanCode.length !== 5}
            className="w-full mt-2"
          >
            Entrar a la Sala
          </Button>
        </form>
      </GlassCard>
    </div>
  );
};
