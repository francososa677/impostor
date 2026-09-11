import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext.js";
import { GlassCard } from "../components/GlassCard.js";
import { Button } from "../components/Button.js";
import { AvatarPicker } from "../components/AvatarPicker.js";
import { DEFAULT_CATEGORIES, GameMode, ClueDeliveryMode, RoleRevealMode, ClueTypePreference } from "@impostor/shared";
import {
  Users,
  Shield,
  Clock,
  Lock,
  Globe,
  Sparkles,
  Smartphone,
} from "lucide-react";
import { clsx } from "clsx";

export const CreateRoomPage: React.FC = () => {
  const { createRoom } = useGame();
  const navigate = useNavigate();

  // Form states
  const [nickname, setNickname] = useState(() => localStorage.getItem("impostor_nickname") || "");
  const [avatar, setAvatar] = useState(() => localStorage.getItem("impostor_avatar") || "detective-1");
  const [mode, setMode] = useState<GameMode>("virtual");
  const [clueDeliveryMode, setClueDeliveryMode] = useState<ClueDeliveryMode>("oral");
  const [impostorCount, setImpostorCount] = useState(1);
  const [impostorsKnowEachOther, setImpostorsKnowEachOther] = useState(false);
  const [impostorGetsClue, setImpostorGetsClue] = useState(true);
  const [clueTypePreference, setClueTypePreference] = useState<ClueTypePreference>("context_only");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "objects",
    "food",
    "football_players",
    "movies",
    "series",
    "videogames",
  ]);
  const [clueTimer, setClueTimer] = useState(30);
  const [discussionTimer, setDiscussionTimer] = useState(60);
  const [voteTimer, setVoteTimer] = useState(45);
  const [anonymousVoting, setAnonymousVoting] = useState(true);
  const [roleRevealMode, setRoleRevealMode] = useState<RoleRevealMode>("immediate");
  const [lastChanceGuess, setLastChanceGuess] = useState(true);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("impostor_nickname", nickname);
    localStorage.setItem("impostor_avatar", avatar);
  }, [nickname, avatar]);

  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      if (selectedCategories.length === 1) return; // Must have at least 1 category
      setSelectedCategories((prev) => prev.filter((id) => id !== catId));
    } else {
      setSelectedCategories((prev) => [...prev, catId]);
    }
  };

  const handleSelectAllCategories = () => {
    setSelectedCategories(DEFAULT_CATEGORIES.map((c) => c.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setLoading(true);
    const result = await createRoom({
      nickname: nickname.trim(),
      avatar,
      mode,
      clueDeliveryMode,
      impostorCount,
      impostorsKnowEachOther,
      impostorGetsClue,
      clueTypePreference,
      selectedCategories,
      clueTimerSeconds: clueTimer,
      discussionTimerSeconds: discussionTimer,
      voteTimerSeconds: voteTimer,
      anonymousVoting,
      roleRevealMode,
      lastChanceGuess,
      maxPlayers,
      isPrivate,
      password: password.trim() || undefined,
    });
    setLoading(false);

    if (result.success && result.roomCode) {
      navigate(`/room/${result.roomCode}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-white uppercase">
          Configuración de Sala
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Ajustá todas las reglas antes de invitar a tus amigos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Identity */}
        <GlassCard className="p-6">
          <h2 className="font-heading font-bold text-lg text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-crimson-400" />
            <span>Tu Identidad</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Apodo / Nombre
              </label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Tu apodo"
                maxLength={20}
                className="w-full px-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-crimson-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Elegí tu Avatar
              </label>
              <AvatarPicker selectedAvatar={avatar} onSelect={setAvatar} />
            </div>
          </div>
        </GlassCard>

        {/* 2. Mode of Play */}
        <GlassCard className="p-6">
          <h2 className="font-heading font-bold text-lg text-white mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-crimson-400" />
            <span>Modalidad de Juego</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: "virtual",
                label: "Virtual",
                desc: "Cada jugador desde su casa con chat y voz propia.",
              },
              {
                id: "single-device",
                label: "1 Dispositivo",
                desc: "Presencial pasando el teléfono de mano en mano.",
              },
              {
                id: "multi-device",
                label: "Múltiples Celulares",
                desc: "Todos juntos físicamente, cada uno en su móvil.",
              },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id as GameMode)}
                className={clsx(
                  "p-4 rounded-xl border text-left transition-all duration-200",
                  mode === m.id
                    ? "bg-crimson-950/60 border-crimson-500 shadow-lg shadow-crimson-950"
                    : "bg-dark-900/60 border-white/5 hover:border-white/20"
                )}
              >
                <div className="font-bold text-white text-sm">{m.label}</div>
                <div className="text-xs text-zinc-400 mt-1">{m.desc}</div>
              </button>
            ))}
          </div>

          {/* Delivery mode for Presencial */}
          {mode !== "virtual" && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                ¿Cómo se entregan las pistas?
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setClueDeliveryMode("oral")}
                  className={clsx(
                    "flex-1 p-3 rounded-xl border text-center text-xs font-bold transition-all",
                    clueDeliveryMode === "oral"
                      ? "bg-crimson-900/40 border-crimson-500 text-white"
                      : "bg-dark-900 border-white/5 text-zinc-400"
                  )}
                >
                  🗣️ Oralmente (en voz alta)
                </button>
                <button
                  type="button"
                  onClick={() => setClueDeliveryMode("written")}
                  className={clsx(
                    "flex-1 p-3 rounded-xl border text-center text-xs font-bold transition-all",
                    clueDeliveryMode === "written"
                      ? "bg-crimson-900/40 border-crimson-500 text-white"
                      : "bg-dark-900 border-white/5 text-zinc-400"
                  )}
                >
                  ✍️ Escribiendo en pantalla
                </button>
              </div>
            </div>
          )}
        </GlassCard>

        {/* 3. Impostors & Rules */}
        <GlassCard className="p-6">
          <h2 className="font-heading font-bold text-lg text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-crimson-400" />
            <span>Reglas de Impostores y Votación</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Impostor Count */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Cantidad de Impostores: <span className="text-crimson-400">{impostorCount}</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setImpostorCount(num)}
                    className={clsx(
                      "w-10 h-10 rounded-xl font-bold border transition-all",
                      impostorCount === num
                        ? "bg-crimson-600 border-crimson-400 text-white shadow-md shadow-crimson-900"
                        : "bg-dark-900 border-white/5 text-zinc-400 hover:text-white"
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Players */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Capacidad Máxima de Jugadores: <span className="text-white">{maxPlayers}</span>
              </label>
              <input
                type="range"
                min={3}
                max={20}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full accent-crimson-500 bg-dark-900 rounded-lg cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="mt-6 space-y-3 pt-4 border-t border-white/5">
            <label className="flex items-center justify-between p-3 rounded-xl bg-dark-900/60 border border-white/5 cursor-pointer">
              <div>
                <div className="text-sm font-semibold text-white">¿Los impostores reciben pistas?</div>
                <div className="text-xs text-zinc-400">
                  Le otorga una pista contextual sutil para disimular mejor.
                </div>
              </div>
              <input
                type="checkbox"
                checked={impostorGetsClue}
                onChange={(e) => setImpostorGetsClue(e.target.checked)}
                className="w-5 h-5 accent-crimson-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-dark-900/60 border border-white/5 cursor-pointer">
              <div>
                <div className="text-sm font-semibold text-white">Última oportunidad del impostor</div>
                <div className="text-xs text-zinc-400">
                  Si es descubierto, puede intentar adivinar la palabra secreta para ganar.
                </div>
              </div>
              <input
                type="checkbox"
                checked={lastChanceGuess}
                onChange={(e) => setLastChanceGuess(e.target.checked)}
                className="w-5 h-5 accent-crimson-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-dark-900/60 border border-white/5 cursor-pointer">
              <div>
                <div className="text-sm font-semibold text-white">¿Los impostores se conocen entre sí?</div>
                <div className="text-xs text-zinc-400">
                  Si hay 2 o más impostores, sabrán quiénes son sus cómplices.
                </div>
              </div>
              <input
                type="checkbox"
                checked={impostorsKnowEachOther}
                onChange={(e) => setImpostorsKnowEachOther(e.target.checked)}
                className="w-5 h-5 accent-crimson-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-dark-900/60 border border-white/5 cursor-pointer">
              <div>
                <div className="text-sm font-semibold text-white">Votación anónima</div>
                <div className="text-xs text-zinc-400">
                  Nadie ve quién votó a quién hasta que concluya la votación.
                </div>
              </div>
              <input
                type="checkbox"
                checked={anonymousVoting}
                onChange={(e) => setAnonymousVoting(e.target.checked)}
                className="w-5 h-5 accent-crimson-500 rounded"
              />
            </label>
          </div>

          {/* Role Reveal Mode */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              ¿Cuándo revelar el rol del expulsado?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: "immediate", label: "Inmediatamente" },
                { id: "game_end", label: "Al final del juego" },
                { id: "never", label: "Nunca" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRoleRevealMode(item.id as RoleRevealMode)}
                  className={clsx(
                    "p-2.5 rounded-xl border text-xs font-bold transition-all",
                    roleRevealMode === item.id
                      ? "bg-crimson-900/40 border-crimson-500 text-white"
                      : "bg-dark-900 border-white/5 text-zinc-400"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* 4. Categories */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-crimson-400" />
                <span>Categorías de Palabras</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Seleccionadas: {selectedCategories.length} de {DEFAULT_CATEGORIES.length}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSelectAllCategories}
              className="text-xs text-crimson-400 hover:text-crimson-300 font-semibold"
            >
              Seleccionar todas
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DEFAULT_CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={clsx(
                    "p-3 rounded-xl border text-left flex items-center justify-between transition-all",
                    isSelected
                      ? "bg-crimson-950/40 border-crimson-500 text-white"
                      : "bg-dark-900/60 border-white/5 text-zinc-400 hover:border-white/20"
                  )}
                >
                  <div>
                    <div className="font-bold text-sm">{cat.name}</div>
                    <div className="text-[11px] text-zinc-500">{cat.description}</div>
                  </div>
                  <span
                    className={clsx(
                      "w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0",
                      isSelected ? "bg-crimson-600 text-white" : "border border-zinc-700"
                    )}
                  >
                    {isSelected ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Clue Type Preference if multiple categories chosen */}
          {selectedCategories.length > 1 && impostorGetsClue && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Tipo de pista para el impostor
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: "context_only", label: "Solo Pista Contextual" },
                  { id: "category_only", label: "Solo Categoría" },
                  { id: "both", label: "Categoría + Pista" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setClueTypePreference(item.id as ClueTypePreference)}
                    className={clsx(
                      "p-2.5 rounded-xl border text-xs font-bold transition-all",
                      clueTypePreference === item.id
                        ? "bg-crimson-900/40 border-crimson-500 text-white"
                        : "bg-dark-900 border-white/5 text-zinc-400"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </GlassCard>

        {/* 5. Timers */}
        <GlassCard className="p-6">
          <h2 className="font-heading font-bold text-lg text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-crimson-400" />
            <span>Temporizadores por Servidor</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Clue timer */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Pista por Jugador
              </label>
              <select
                value={clueTimer}
                onChange={(e) => setClueTimer(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white text-xs focus:outline-none focus:border-crimson-500"
              >
                <option value={0}>Sin límite</option>
                <option value={15}>15 segundos</option>
                <option value={30}>30 segundos</option>
                <option value={45}>45 segundos</option>
                <option value={60}>60 segundos</option>
              </select>
            </div>

            {/* Discussion timer */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Discusión Grupal
              </label>
              <select
                value={discussionTimer}
                onChange={(e) => setDiscussionTimer(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white text-xs focus:outline-none focus:border-crimson-500"
              >
                <option value={0}>Sin límite</option>
                <option value={30}>30 segundos</option>
                <option value={60}>60 segundos</option>
                <option value={90}>90 segundos</option>
                <option value={120}>120 segundos</option>
              </select>
            </div>

            {/* Vote timer */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Votación
              </label>
              <select
                value={voteTimer}
                onChange={(e) => setVoteTimer(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white text-xs focus:outline-none focus:border-crimson-500"
              >
                <option value={0}>Sin límite</option>
                <option value={30}>30 segundos</option>
                <option value={45}>45 segundos</option>
                <option value={60}>60 segundos</option>
                <option value={90}>90 segundos</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* 6. Privacy & Password */}
        <GlassCard className="p-6">
          <h2 className="font-heading font-bold text-lg text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-crimson-400" />
            <span>Privacidad de la Sala</span>
          </h2>

          <div className="space-y-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={clsx(
                  "flex-1 p-3.5 rounded-xl border text-left transition-all",
                  !isPrivate
                    ? "bg-crimson-950/60 border-crimson-500 text-white shadow-md shadow-crimson-950"
                    : "bg-dark-900 border-white/5 text-zinc-400"
                )}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Globe className="w-4 h-4 text-emerald-400" /> Sala Pública
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  Aparece en el lobby para que cualquiera pueda unirse.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={clsx(
                  "flex-1 p-3.5 rounded-xl border text-left transition-all",
                  isPrivate
                    ? "bg-crimson-950/60 border-crimson-500 text-white shadow-md shadow-crimson-950"
                    : "bg-dark-900 border-white/5 text-zinc-400"
                )}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Lock className="w-4 h-4 text-amber-400" /> Sala Privada
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  Solo accesible mediante código exacto, QR o enlace directo.
                </div>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Contraseña Opcional (para ingreso manual en lobby)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Dejar en blanco si no querés contraseña"
                maxLength={32}
                className="w-full px-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-crimson-500"
              />
            </div>
          </div>
        </GlassCard>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="xl"
          loading={loading}
          disabled={!nickname.trim()}
          className="w-full py-4 text-lg"
        >
          Crear y Abrir Sala
        </Button>
      </form>
    </div>
  );
};
