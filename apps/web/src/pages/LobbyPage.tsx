import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext.js";
import { GlassCard } from "../components/GlassCard.js";
import { Button } from "../components/Button.js";
import { RoomSummary } from "@impostor/shared";
import { PlayerAvatarView } from "../components/AvatarPicker.js";
import {
  Search,
  Users,
  Lock,
  Globe,
  Radio,
  Plus,
  Shield,
  Smartphone,
} from "lucide-react";
import { clsx } from "clsx";

export const LobbyPage: React.FC = () => {
  const { socket, joinRoom } = useGame();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<RoomSummary | null>(null);
  const [joinNickname, setJoinNickname] = useState(() => localStorage.getItem("impostor_nickname") || "");
  const [joinPassword, setJoinPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Subscribe to realtime lobby updates
    socket.emit("lobby:subscribe", (initialRooms) => {
      setRooms(initialRooms || []);
    });

    const onLobbyUpdate = (updatedRooms: RoomSummary[]) => {
      setRooms(updatedRooms);
    };

    socket.on("lobby:update", onLobbyUpdate);

    return () => {
      socket.emit("lobby:unsubscribe");
      socket.off("lobby:update", onLobbyUpdate);
    };
  }, [socket]);

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase());
    const matchesMode = filterMode === "all" || r.mode === filterMode;
    return matchesSearch && matchesMode;
  });

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !joinNickname.trim()) return;

    setLoading(true);
    const result = await joinRoom({
      roomCode: selectedRoom.code,
      nickname: joinNickname.trim(),
      avatar: "detective-1",
      password: joinPassword.trim() || undefined,
    });
    setLoading(false);

    if (result.success && result.roomCode) {
      localStorage.setItem("impostor_nickname", joinNickname.trim());
      navigate(`/room/${result.roomCode}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-5 h-5 text-crimson-400 animate-pulse" />
            <span className="text-xs text-crimson-400 uppercase tracking-wider font-bold">
              Salas Activas en Tiempo Real
            </span>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-white uppercase">
            Lobby de Partidas
          </h1>
        </div>

        <Link to="/create">
          <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />}>
            Crear Sala
          </Button>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-crimson-500"
          />
        </div>

        <div className="flex gap-2">
          {["all", "virtual", "single-device", "multi-device"].map((m) => (
            <button
              key={m}
              onClick={() => setFilterMode(m)}
              className={clsx(
                "px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all",
                filterMode === m
                  ? "bg-crimson-600 text-white shadow-md shadow-crimson-950"
                  : "bg-dark-850 text-zinc-400 hover:text-white border border-white/5"
              )}
            >
              {m === "all"
                ? "Todas"
                : m === "virtual"
                ? "Virtual"
                : m === "single-device"
                ? "1 Dispositivo"
                : "Múltiples"}
            </button>
          ))}
        </div>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Globe className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-lg text-white mb-1">
            No hay salas públicas disponibles
          </h3>
          <p className="text-zinc-400 text-xs max-w-sm mx-auto mb-6">
            Sé el primero en crear una sala pública y esperar a que otros jugadores se unan.
          </p>
          <Link to="/create">
            <Button variant="primary" size="md">
              Crear una Sala Ahora
            </Button>
          </Link>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => {
            const isFull = room.playerCount >= room.maxPlayers;
            const inGame = room.status === "IN_GAME";

            return (
              <GlassCard
                key={room.id}
                className="p-5 flex flex-col justify-between hover:border-crimson-500/40 transition-all hover:scale-[1.01]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-crimson-400 bg-crimson-950/60 px-2 py-0.5 rounded border border-crimson-600/30">
                      {room.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {room.hasPassword && (
                        <span title="Requiere contraseña" className="text-amber-400">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <span
                        className={clsx(
                          "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                          inGame
                            ? "bg-amber-950/80 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-950/80 text-emerald-400 border border-emerald-500/30"
                        )}
                      >
                        {inGame ? "En Partida" : "En Espera"}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-heading font-bold text-base text-white truncate mb-1">
                    {room.name}
                  </h3>

                  <div className="space-y-1 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-zinc-500" />
                      <span>
                        {room.playerCount} / {room.maxPlayers} jugadores
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{room.impostorCount} {room.impostorCount === 1 ? "impostor" : "impostores"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="capitalize">{room.mode}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">
                    {inGame ? "Entrarás como espectador" : isFull ? "Sala llena" : "Lugar disponible"}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedRoom(room)}
                  >
                    Unirse
                  </Button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Join Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <GlassCard glow className="w-full max-w-sm p-6 relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <h3 className="font-heading font-bold text-lg text-white">Unirse a la Sala</h3>
                <p className="text-xs text-crimson-400 font-mono font-bold">{selectedRoom.code}</p>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Tu Apodo
                </label>
                <div className="flex items-center gap-2.5">
                  <PlayerAvatarView name={joinNickname || "Tú"} className="w-10 h-10 text-xs" />
                  <input
                    type="text"
                    required
                    value={joinNickname}
                    onChange={(e) => setJoinNickname(e.target.value)}
                    placeholder="Tu apodo"
                    maxLength={20}
                    className="flex-1 px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-crimson-500 text-sm"
                  />
                </div>
              </div>

              {selectedRoom.hasPassword && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Contraseña de la Sala
                  </label>
                  <input
                    type="password"
                    required
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    placeholder="Contraseña"
                    className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-crimson-500"
                  />
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                disabled={!joinNickname.trim()}
                className="w-full mt-4"
              >
                Confirmar y Entrar
              </Button>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
