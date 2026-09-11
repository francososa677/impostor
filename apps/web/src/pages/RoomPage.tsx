import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext.js";
import { GlassCard } from "../components/GlassCard.js";
import { Button } from "../components/Button.js";
import { PlayerAvatarView } from "../components/AvatarPicker.js";
import { TimerDisplay } from "../components/TimerDisplay.js";
import { QRCodeModal } from "../components/QRCodeModal.js";
import { ChatDrawer } from "../components/ChatDrawer.js";
import { ClueHistoryModal } from "../components/ClueHistoryModal.js";
import { LiveCluesBoard } from "../components/LiveCluesBoard.js";
import { ConfettiEffect } from "../components/ConfettiEffect.js";
import {
  Users,
  Shield,
  QrCode,
  Copy,
  Check,
  Play,
  RotateCcw,
  Eye,
  EyeOff,
  Send,
  Skull,
  Award,
  BookOpen,
  Radio,
  Flame,
  UserX,
  FastForward,
} from "lucide-react";
import { clsx } from "clsx";

export const RoomPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const {
    playerId,
    roomState,
    privateState,
    activeTimer,
    kickPlayer,
    startGame,
    submitClue,
    skipTurn,
    skipDiscussion,
    voteChangeWord,
    submitVote,
    submitLastChanceGuess,
    rematch,
  } = useGame();

  const [copiedCode, setCopiedCode] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showClueHistory, setShowClueHistory] = useState(false);
  const [clueText, setClueText] = useState("");
  const [selectedVoteTarget, setSelectedVoteTarget] = useState<string | null>(null);
  const [lastChanceGuessText, setLastChanceGuessText] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [resetScoresOnRematch, setResetScoresOnRematch] = useState(false);
  const [loading, setLoading] = useState(false);

  // Single-device state tracker
  const [passDeviceRevealed, setPassDeviceRevealed] = useState(false);

  const navigate = useNavigate();

  // If no room state or disconnected, redirect or wait
  useEffect(() => {
    if (!roomState && !sessionStorage.getItem("impostor_room_code")) {
      navigate("/");
    }
  }, [roomState, navigate]);

  if (!roomState) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-crimson-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-400 text-sm">Conectando con la sala {code}...</p>
        </div>
      </div>
    );
  }

  const isHost = roomState.hostId === playerId;
  const isSpectator = privateState?.role === "spectator";
  const game = roomState.game;
  const phase = game?.phase || "LOBBY";

  const handleCopyInvite = () => {
    const link = `${window.location.origin}/join/${roomState.code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleStartGame = async () => {
    setLoading(true);
    await startGame();
    setLoading(false);
  };

  const handleClueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clueText.trim()) return;
    const txt = clueText;
    setClueText("");
    await submitClue(txt);
  };

  const handleSkipDiscussion = async () => {
    setLoading(true);
    await skipDiscussion();
    setLoading(false);
  };

  const handleVoteChangeWord = async () => {
    setLoading(true);
    await voteChangeWord();
    setLoading(false);
  };

  const handleVoteConfirm = async () => {
    if (!selectedVoteTarget) return;
    setLoading(true);
    await submitVote(selectedVoteTarget);
    setLoading(false);
  };

  const handleLastChanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastChanceGuessText.trim()) return;
    setLoading(true);
    await submitLastChanceGuess(lastChanceGuessText.trim());
    setLoading(false);
  };

  const handleRematchSubmit = async () => {
    setLoading(true);
    await rematch(resetScoresOnRematch);
    setLoading(false);
  };

  // ----------------------------------------------------
  // RENDER PHASE: LOBBY
  // ----------------------------------------------------
  if (phase === "LOBBY" || !game) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Top Room Banner */}
        <GlassCard glow className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Código de la Sala
              </span>
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-1">
                <span className="font-mono text-4xl sm:text-5xl font-black text-crimson-400 tracking-widest">
                  {roomState.code}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyInvite}
                  icon={copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                >
                  {copiedCode ? "¡Copiado!" : "Copiar Enlace"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowQR(true)}
                  icon={<QrCode className="w-4 h-4 text-crimson-400" />}
                >
                  QR
                </Button>
              </div>
            </div>

            {/* Start Button */}
            {isHost ? (
              <Button
                variant="primary"
                size="xl"
                loading={loading}
                disabled={roomState.players.length < 3}
                onClick={handleStartGame}
                icon={<Play className="w-5 h-5 fill-current" />}
                className="w-full sm:w-auto px-8"
              >
                {roomState.players.length < 3
                  ? `Faltan ${3 - roomState.players.length} jugadores`
                  : "Iniciar Partida"}
              </Button>
            ) : (
              <div className="text-center sm:text-right">
                <span className="text-xs text-zinc-400">Esperando que el anfitrión inicie...</span>
                <div className="flex items-center gap-2 text-sm text-crimson-400 font-semibold mt-1">
                  <span className="w-2 h-2 rounded-full bg-crimson-500 animate-ping" />
                  Sala en preparación
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Players List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-crimson-400" />
                <span>Jugadores Conectados ({roomState.players.length} / {roomState.settings.maxPlayers})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roomState.players.map((p) => (
                <GlassCard
                  key={p.id}
                  className={clsx(
                    "p-3.5 flex items-center justify-between border",
                    p.id === playerId ? "border-crimson-500/40 bg-crimson-950/20" : "border-white/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <PlayerAvatarView avatar={p.avatar} className="w-10 h-10" />
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                        <span>{p.nickname}</span>
                        {p.isHost && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-semibold">
                            Host
                          </span>
                        )}
                        {p.id === playerId && (
                          <span className="text-[10px] bg-crimson-600/30 text-crimson-300 border border-crimson-500/30 px-1.5 py-0.2 rounded font-semibold">
                            Tú
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        {p.isConnected ? "🟢 En línea" : "🔴 Desconectado"}
                      </span>
                    </div>
                  </div>

                  {isHost && p.id !== playerId && (
                    <button
                      onClick={() => kickPlayer(p.id)}
                      className="p-1.5 rounded-lg hover:bg-red-950/40 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Expulsar de la sala"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </GlassCard>
              ))}
            </div>

            {/* Spectators if any */}
            {roomState.spectators.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Espectadores ({roomState.spectators.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {roomState.spectators.map((spec) => (
                    <span
                      key={spec.id}
                      className="text-xs px-2.5 py-1 rounded-lg bg-dark-900 border border-white/5 text-zinc-300 flex items-center gap-1.5"
                    >
                      <PlayerAvatarView avatar={spec.avatar} className="w-4 h-4" />
                      {spec.nickname}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings Summary Panel */}
          <div>
            <GlassCard className="p-5 space-y-4">
              <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-crimson-400" />
                <span>Reglas de la Partida</span>
              </h3>

              <div className="space-y-2.5 text-xs text-zinc-300">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-500">Modalidad:</span>
                  <span className="font-semibold capitalize">{roomState.settings.mode}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-500">Impostores:</span>
                  <span className="font-semibold text-crimson-400">{roomState.settings.impostorCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-500">Pista al Impostor:</span>
                  <span className="font-semibold">
                    {roomState.settings.impostorGetsClue ? "Activada" : "Desactivada"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-500">Última Oportunidad:</span>
                  <span className="font-semibold">
                    {roomState.settings.lastChanceGuess ? "Sí" : "No"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-500">Votación Anónima:</span>
                  <span className="font-semibold">
                    {roomState.settings.anonymousVoting ? "Sí" : "No"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-zinc-500">Temporizador de Pista:</span>
                  <span className="font-semibold">
                    {roomState.settings.clueTimerSeconds ? `${roomState.settings.clueTimerSeconds}s` : "Sin límite"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Categorías:</span>
                  <span className="font-semibold text-crimson-300">
                    {roomState.settings.selectedCategories.length} activas
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Modals & Chat */}
        {showQR && <QRCodeModal roomCode={roomState.code} onClose={() => setShowQR(false)} />}
        <ChatDrawer />
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER PHASE: SINGLE-DEVICE PASS-AND-PLAY (Presencial)
  // ----------------------------------------------------
  if (roomState.settings.mode === "single-device" && phase === "CLUE_PHASE") {
    const currentTurnPlayer = roomState.players.find((p) => p.id === game.currentTurnPlayerId);

    return (
      <div className="max-w-md mx-auto px-4 py-8 min-h-[calc(100vh-80px)] flex flex-col justify-center">
        <GlassCard glow className="p-8 text-center space-y-6 animate-fade-in">
          {!passDeviceRevealed ? (
            <>
              <div className="w-16 h-16 rounded-full bg-crimson-600/20 border border-crimson-500/40 text-crimson-400 flex items-center justify-center mx-auto shadow-xl">
                <EyeOff className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
                  Pasá el dispositivo a:
                </span>
                <h2 className="font-heading font-black text-3xl text-white mt-1">
                  {currentTurnPlayer?.nickname || "Siguiente Jugador"}
                </h2>
                <p className="text-xs text-zinc-400 mt-2">
                  Que el resto del grupo no mire la pantalla antes de continuar.
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full py-4 text-base"
                onClick={() => setPassDeviceRevealed(true)}
              >
                Soy {currentTurnPlayer?.nickname}, Ver Mi Información
              </Button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-crimson-950/60 border border-crimson-500/30 text-crimson-400 flex items-center justify-center mx-auto shadow-xl">
                <Eye className="w-8 h-8" />
              </div>

              {/* Private Info for Current Player */}
              {privateState?.role === "impostor" ? (
                <div className="space-y-3">
                  <div className="inline-block px-4 py-1.5 rounded-full bg-red-600 text-white font-black text-sm uppercase tracking-widest animate-bounce">
                    ¡Sos el Impostor!
                  </div>
                  <p className="text-xs text-zinc-400">
                    No tenés la palabra secreta. Intentá descubrirla y disimular.
                  </p>
                  {privateState.contextClue && (
                    <div className="p-3 rounded-xl bg-dark-900 border border-white/10 text-xs">
                      <span className="text-zinc-500 block mb-0.5">Pista Contextual:</span>
                      <span className="font-bold text-crimson-300 text-sm">
                        {privateState.contextClue}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-zinc-500 uppercase font-semibold">
                    Categoría: {privateState?.category}
                  </div>
                  <div className="text-xs text-zinc-400">Tu palabra secreta es:</div>
                  <div className="font-heading font-black text-4xl text-crimson-400 tracking-wider">
                    {privateState?.secretWord}
                  </div>
                </div>
              )}

              {/* Clue form if written mode */}
              {roomState.settings.clueDeliveryMode === "written" && (
                <form onSubmit={handleClueSubmit} className="space-y-3 pt-4 border-t border-white/5">
                  <input
                    type="text"
                    required
                    value={clueText}
                    onChange={(e) => setClueText(e.target.value)}
                    placeholder="Escribí tu pista..."
                    className="w-full px-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-white text-sm"
                  />
                  <Button type="submit" variant="primary" size="md" className="w-full">
                    Confirmar Pista y Pasar
                  </Button>
                </form>
              )}

              {/* Pass button if oral mode */}
              {roomState.settings.clueDeliveryMode === "oral" && (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={async () => {
                    await submitClue("Pista dicha oralmente");
                    setPassDeviceRevealed(false);
                  }}
                >
                  Ya di mi pista oral, Ocultar y Pasar
                </Button>
              )}

              {/* Vote to change word in Round 1 (Single Device) */}
              {game.round === 1 && (
                <div className="pt-3 border-t border-white/5 flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleVoteChangeWord}
                    className={clsx(
                      "px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all shadow-md",
                      privateState?.hasVotedChangeWord
                        ? "bg-amber-600 text-white border-amber-400 shadow-amber-950/40"
                        : "bg-dark-900 text-zinc-300 border-white/10 hover:border-white/20 hover:text-white"
                    )}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {privateState?.hasVotedChangeWord ? "Votaste cambiar palabra" : "Votar para cambiar palabra"} ({game.changeWordVotes?.length || 0}/{game.changeWordVotesNeeded || Math.ceil(roomState.players.length / 2)})
                    </span>
                  </button>
                  <span className="text-[10px] text-zinc-500">
                    Discreto: si la mayoría vota, se sortea otra palabra sin cambiar los roles.
                  </span>
                </div>
              )}
            </>
          )}
        </GlassCard>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER PHASE: GAMEPLAY (Virtual & Multi-Device)
  // ----------------------------------------------------
  const currentTurnPlayer = roomState.players.find((p) => p.id === game.currentTurnPlayerId);
  const isMyTurn = privateState?.isYourTurn;
  const alivePlayers = roomState.players.filter((p) => !p.isEliminated && !p.isSpectator);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Game Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-dark-900/60 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3">
          <span className="font-heading font-black text-lg text-crimson-400">
            RONDA {game.round}
          </span>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-xs text-zinc-400">
            {alivePlayers.length} sobrevivientes
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeTimer && (
            <TimerDisplay
              remainingSeconds={activeTimer.remainingSeconds}
              type={activeTimer.type}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowClueHistory(true)}
            icon={<BookOpen className="w-4 h-4 text-crimson-400" />}
          >
            Historial ({game.clueHistory.length})
          </Button>
        </div>
      </div>

      {/* 1. SECRET ROLE & WORD CARD (Tap/Hold to Reveal for Security) */}
      {!isSpectator && (
        <GlassCard glow className="p-6 text-center relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Tu Información Privada
            </span>
            <button
              onClick={() => setIsRevealed(!isRevealed)}
              className="flex items-center gap-1.5 text-xs text-crimson-400 hover:text-crimson-300 font-semibold"
            >
              {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{isRevealed ? "Ocultar" : "Tocar para ver"}</span>
            </button>
          </div>

          {isRevealed ? (
            <div className="py-4 space-y-2 animate-scale-up">
              {privateState?.role === "impostor" ? (
                <div>
                  <div className="inline-block px-4 py-1 rounded-full bg-crimson-600 text-white font-black text-sm uppercase tracking-widest mb-2 shadow-lg shadow-crimson-900">
                    ¡SOS EL IMPOSTOR!
                  </div>
                  <p className="text-xs text-zinc-400">
                    No recibiste la palabra. Dedúcela a partir de las pistas de los demás.
                  </p>
                  {privateState.category && (
                    <div className="text-xs text-zinc-400 mt-2">
                      Categoría: <span className="text-white font-bold">{privateState.category}</span>
                    </div>
                  )}
                  {privateState.contextClue && (
                    <div className="text-xs text-zinc-400 mt-1">
                      Pista Contextual: <span className="text-crimson-300 font-bold">{privateState.contextClue}</span>
                    </div>
                  )}
                  {privateState.impostorTeammates && privateState.impostorTeammates.length > 0 && (
                    <div className="text-xs text-zinc-400 mt-2">
                      Tus cómplices:{" "}
                      <span className="text-amber-400 font-bold">
                        {privateState.impostorTeammates.map((t) => t.nickname).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-xs text-zinc-400 mb-1">
                    Categoría: <span className="text-zinc-200 font-bold">{privateState?.category}</span>
                  </div>
                  <div className="text-xs text-zinc-500 uppercase font-semibold">Tu Palabra Secreta:</div>
                  <div className="font-heading font-black text-4xl sm:text-5xl text-crimson-400 tracking-wider mt-1 crimson-glow">
                    {privateState?.secretWord}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => setIsRevealed(true)}
              className="py-6 cursor-pointer text-zinc-500 hover:text-zinc-400 flex flex-col items-center gap-2 group"
            >
              <Eye className="w-8 h-8 text-crimson-500/60 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Presioná para ver tu palabra o rol en privado
              </span>
            </div>
          )}
        </GlassCard>
      )}

      {/* 1b. Vote to Change Word in Round 1 (Virtual / Multi-device) */}
      {game.round === 1 && phase === "CLUE_PHASE" && !isSpectator && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-dark-900/80 border border-amber-500/20 text-xs shadow-lg backdrop-blur-md animate-fade-in">
          <div className="flex items-center gap-2.5 text-left">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">¿No conocés o es difícil la palabra?</span>
              <span className="text-[11px] text-zinc-400">
                Podés votar para cambiarla. Si la mayoría vota a favor, se sortea otra palabra sin cambiar roles ni turnos.
              </span>
            </div>
          </div>

          <Button
            variant={privateState?.hasVotedChangeWord ? "primary" : "secondary"}
            size="sm"
            loading={loading}
            onClick={handleVoteChangeWord}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className={clsx(
              "shrink-0 w-full sm:w-auto font-bold",
              privateState?.hasVotedChangeWord && "bg-amber-600 hover:bg-amber-500 border-amber-500/30 text-white shadow-amber-950/40"
            )}
          >
            {privateState?.hasVotedChangeWord ? "Voto registrado" : "Votar cambiar palabra"} ({game.changeWordVotes?.length || 0}/{game.changeWordVotesNeeded || Math.ceil(alivePlayers.length / 2)})
          </Button>
        </div>
      )}

      {/* 2. SUB-PHASE: CLUE PHASE */}
      {phase === "CLUE_PHASE" && (
        <div className="space-y-4 animate-fade-in">
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PlayerAvatarView avatar={currentTurnPlayer?.avatar || "detective-1"} className="w-10 h-10" />
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">Turno Actual:</span>
                  <h3 className="font-heading font-bold text-lg text-white">
                    {currentTurnPlayer?.nickname} {isMyTurn && "(¡Tu Turno!)"}
                  </h3>
                </div>
              </div>
            </div>

            {/* Turn Order Badges */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
              {game.turnOrder.map((pid, _idx) => {
                const p = roomState.players.find((pl) => pl.id === pid);
                if (!p || p.isEliminated) return null;
                const hasGiven = game.cluesGivenInRound.includes(pid);
                const isCurrent = game.currentTurnPlayerId === pid;

                return (
                  <span
                    key={pid}
                    className={clsx(
                      "text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-medium transition-all",
                      isCurrent
                        ? "bg-crimson-600 text-white font-bold shadow-md shadow-crimson-900 scale-105"
                        : hasGiven
                        ? "bg-dark-900/80 text-zinc-500 border border-white/5"
                        : "bg-dark-850 text-zinc-300 border border-white/10"
                    )}
                  >
                    <PlayerAvatarView avatar={p.avatar} className="w-4 h-4" />
                    {p.nickname} {hasGiven && "✓"}
                  </span>
                );
              })}
            </div>

            {/* If it's my turn, show clue submission input */}
            {isMyTurn && (
              <form onSubmit={handleClueSubmit} className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={clueText}
                    onChange={(e) => setClueText(e.target.value)}
                    placeholder="Escribí una palabra o pista breve..."
                    maxLength={100}
                    className="flex-1 px-4 py-3 rounded-xl bg-dark-900 border border-white/10 text-white text-sm focus:outline-none focus:border-crimson-500"
                  />
                  <Button type="submit" variant="primary" size="md" icon={<Send className="w-4 h-4" />}>
                    Enviar Pista
                  </Button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={skipTurn}
                    className="text-xs text-zinc-500 hover:text-zinc-300 underline"
                  >
                    Omitir mi turno
                  </button>
                </div>
              </form>
            )}
          </GlassCard>

          {/* Live Clues on screen */}
          <LiveCluesBoard
            clues={game.clueHistory}
            players={roomState.players}
            currentRound={game.round}
            currentTurnPlayerId={game.currentTurnPlayerId}
            phase={phase}
          />
        </div>
      )}

      {/* 3. SUB-PHASE: DISCUSSION */}
      {phase === "DISCUSSION" && (
        <div className="space-y-4 animate-fade-in">
          <GlassCard className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 text-left">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-950/40">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="font-heading font-black text-xl sm:text-2xl text-white">Fase de Discusión</h2>
                  <p className="text-xs text-zinc-400">
                    Debatan quién sospechan que es el impostor analizando las pistas dadas.
                  </p>
                </div>
              </div>

              {isHost && (
                <Button
                  variant="primary"
                  size="md"
                  loading={loading}
                  onClick={handleSkipDiscussion}
                  icon={<FastForward className="w-4 h-4" />}
                  className="shrink-0 w-full sm:w-auto bg-gradient-to-r from-amber-600 to-crimson-600 hover:from-amber-500 hover:to-crimson-500 border border-amber-500/30 font-bold shadow-lg shadow-crimson-950/40"
                >
                  Omitir y Pasar a Votación
                </Button>
              )}
            </div>
          </GlassCard>

          {/* Prominent Live Clues Board during discussion */}
          <LiveCluesBoard
            clues={game.clueHistory}
            players={roomState.players}
            currentRound={game.round}
            phase={phase}
          />
        </div>
      )}

      {/* 4. SUB-PHASE: VOTING & TIE-BREAKER */}
      {(phase === "VOTING" || phase === "TIE_BREAKER") && (
        <div className="space-y-4 animate-fade-in">
          <GlassCard glow={phase === "TIE_BREAKER"} className="p-6 space-y-6">
            <div className="text-center">
              {phase === "TIE_BREAKER" && (
                <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-500/40">
                  ¡Desempate! Votá solo entre los candidatos empatados
                </div>
              )}
              <h2 className="font-heading font-black text-2xl text-white uppercase">
                ¿Quién es el Impostor?
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Seleccioná al jugador que querés expulsar de la partida.
              </p>
            </div>

            {/* Voting Suspects Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {alivePlayers.map((target) => {
                // Cannot vote for self
                const isSelf = target.id === playerId;
                const isTieCandidate =
                  phase === "TIE_BREAKER"
                    ? game.tieBreakerCandidateIds?.includes(target.id)
                    : true;

                const isSelected = selectedVoteTarget === target.id;
                const suspectClues = game.clueHistory.filter((c) => c.playerId === target.id);
                const latestClue = suspectClues[suspectClues.length - 1];

                return (
                  <button
                    key={target.id}
                    type="button"
                    disabled={isSelf || !isTieCandidate || privateState?.hasVoted}
                    onClick={() => setSelectedVoteTarget(target.id)}
                    className={clsx(
                      "p-4 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 gap-2",
                      isSelected
                        ? "bg-crimson-600 border-crimson-400 text-white shadow-lg shadow-crimson-900 scale-105"
                        : isSelf || !isTieCandidate
                        ? "opacity-30 bg-dark-900 border-white/5 cursor-not-allowed"
                        : "bg-dark-850/80 border-white/5 hover:border-white/20 text-zinc-300"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <PlayerAvatarView avatar={target.avatar} className="w-10 h-10" />
                        <div>
                          <div className="font-bold text-sm text-white">
                            {target.nickname} {isSelf && "(Tú)"}
                          </div>
                          <span className="text-[10px] text-zinc-400">
                            {isSelf ? "No podés votarte" : "Sospechoso"}
                          </span>
                        </div>
                      </div>
                      {isSelected && <span className="font-bold text-lg text-white">✓</span>}
                    </div>

                    {/* Latest clue given by this suspect */}
                    {latestClue ? (
                      <div className="w-full mt-1 px-2.5 py-1 rounded-lg bg-dark-950/60 border border-white/5 text-xs flex items-center justify-between gap-1">
                        <span className="text-[10px] text-zinc-400">Pista R{latestClue.round}:</span>
                        <span className="font-bold text-crimson-300 truncate">"{latestClue.text}"</span>
                      </div>
                    ) : (
                      <div className="w-full mt-1 text-[10px] text-zinc-500 italic">
                        Sin pistas registradas
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Confirm Vote Button */}
            {!privateState?.hasVoted ? (
              <Button
                variant="primary"
                size="lg"
                loading={loading}
                disabled={!selectedVoteTarget}
                onClick={handleVoteConfirm}
                className="w-full py-4 text-base"
              >
                Confirmar Mi Voto
              </Button>
            ) : (
              <div className="p-4 rounded-xl bg-dark-900 text-center border border-white/10 text-emerald-400 text-sm font-semibold flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                <span>Voto emitido. Esperando a los demás jugadores...</span>
              </div>
            )}
          </GlassCard>

          {/* Live Clues Board available during voting for quick full reference */}
          <LiveCluesBoard
            clues={game.clueHistory}
            players={roomState.players}
            currentRound={game.round}
            phase={phase}
          />
        </div>
      )}

      {/* 5. SUB-PHASE: REVEAL ELIMINATED */}
      {phase === "REVEAL_ELIMINATED" && (
        <GlassCard glow className="p-8 text-center space-y-4 animate-scale-up">
          <div className="w-16 h-16 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-xl">
            <Skull className="w-8 h-8 animate-bounce" />
          </div>

          <div>
            <h2 className="font-heading font-black text-3xl text-white">
              {roomState.players.find((p) => p.id === game.lastEliminatedPlayerId)?.nickname || "Un jugador"}{" "}
              ha sido eliminado
            </h2>

            {game.lastEliminatedWasImpostor !== null && game.lastEliminatedWasImpostor !== undefined && (
              <div className="mt-3">
                {game.lastEliminatedWasImpostor ? (
                  <span className="inline-block px-4 py-1.5 rounded-full bg-crimson-600 text-white font-black text-sm uppercase tracking-widest animate-pulse">
                    ¡Era el IMPOSTOR!
                  </span>
                ) : (
                  <span className="inline-block px-4 py-1.5 rounded-full bg-zinc-800 text-zinc-300 font-bold text-sm uppercase tracking-widest border border-zinc-700">
                    NO era el impostor
                  </span>
                )}
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* 6. SUB-PHASE: LAST CHANCE (Decision 100) */}
      {phase === "LAST_CHANCE" && (
        <GlassCard glow className="p-8 text-center space-y-6 animate-scale-up">
          <div className="w-16 h-16 rounded-full bg-crimson-600 text-white flex items-center justify-center mx-auto shadow-2xl shadow-crimson-900 animate-pulse">
            <Flame className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-heading font-black text-3xl text-white uppercase">
              Última Oportunidad del Impostor
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-md mx-auto">
              El impostor fue descubierto. Si adivina la palabra secreta ahora, ¡los impostores ganan la partida!
            </p>
          </div>

          {privateState?.isLastChanceActiveForYou ? (
            <form onSubmit={handleLastChanceSubmit} className="space-y-4 max-w-md mx-auto">
              <input
                type="text"
                required
                value={lastChanceGuessText}
                onChange={(e) => setLastChanceGuessText(e.target.value)}
                placeholder="¿Cuál era la palabra secreta?"
                maxLength={100}
                className="w-full px-4 py-3 rounded-xl bg-dark-900 border border-crimson-500 text-white font-bold text-center text-lg placeholder-zinc-600 focus:outline-none focus:border-crimson-400"
              />
              <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full py-4 text-base">
                Intentar Adivinar
              </Button>
            </form>
          ) : (
            <div className="p-4 rounded-xl bg-dark-900 border border-white/5 text-zinc-400 text-xs">
              Esperando el intento del impostor descubierto...
            </div>
          )}
        </GlassCard>
      )}

      {/* 7. SUB-PHASE: GAME OVER & STATS (Decision 104, 105, 109) */}
      {phase === "GAME_OVER" && (
        <div className="space-y-6 animate-fade-in">
          <ConfettiEffect />

          <GlassCard glow className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-crimson-600 text-white flex items-center justify-center mx-auto shadow-2xl shadow-crimson-900/50">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                Resultado Final
              </span>
              <h1 className="font-heading font-black text-4xl sm:text-5xl text-white uppercase mt-1">
                {game.stats?.winner === "innocents" ? (
                  <span className="text-emerald-400">¡Victoria de los Inocentes!</span>
                ) : (
                  <span className="text-crimson-500">¡Victoria de los Impostores!</span>
                )}
              </h1>
              <p className="text-sm text-zinc-300 mt-2 max-w-lg mx-auto">
                {game.stats?.winReason}
              </p>
            </div>

            <div className="pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-dark-900 border border-white/5">
                <span className="text-zinc-500 block">Palabra Secreta</span>
                <span className="font-bold text-white text-sm">{game.stats?.secretWord}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-white/5">
                <span className="text-zinc-500 block">Categoría</span>
                <span className="font-bold text-white text-sm">{game.stats?.secretCategory}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-white/5">
                <span className="text-zinc-500 block">Rondas Jugadas</span>
                <span className="font-bold text-white text-sm">{game.stats?.totalRounds}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-white/5">
                <span className="text-zinc-500 block">Impostores</span>
                <span className="font-bold text-crimson-400 text-sm">
                  {game.stats?.impostors.map((i) => i.nickname).join(", ")}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Session Leaderboard */}
          <GlassCard className="p-6">
            <h3 className="font-heading font-bold text-lg text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Tabla de Puntuaciones de la Sesión</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-zinc-500 border-b border-white/5 uppercase">
                  <tr>
                    <th className="pb-3">Jugador</th>
                    <th className="pb-3 text-center">Victorias</th>
                    <th className="pb-3 text-center">Sobrevividas</th>
                    <th className="pb-3 text-center">Aciertos Voto</th>
                    <th className="pb-3 text-right">Puntos Totales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {Object.values(roomState.scores)
                    .sort((a, b) => b.totalScore - a.totalScore)
                    .map((sc, rank) => (
                      <tr key={sc.playerId} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 flex items-center gap-2 font-bold text-white">
                          <span className="text-zinc-500 font-mono w-4">{rank + 1}.</span>
                          <PlayerAvatarView avatar={sc.avatar} className="w-6 h-6" />
                          <span>{sc.nickname}</span>
                        </td>
                        <td className="py-3 text-center text-zinc-300">{sc.wins}</td>
                        <td className="py-3 text-center text-zinc-300">{sc.survivedRounds}</td>
                        <td className="py-3 text-center text-zinc-300">{sc.correctVotes}</td>
                        <td className="py-3 text-right font-bold text-crimson-400 text-sm">
                          {sc.totalScore} pts
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Rematch action (Host only) */}
          {isHost && (
            <GlassCard className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-heading font-bold text-white text-base">¿Jugar Revancha?</h4>
                <p className="text-xs text-zinc-400">
                  La sala se conserva viva con los mismos jugadores y sorteando nueva palabra.
                </p>
                <label className="flex items-center gap-2 mt-2 text-xs text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetScoresOnRematch}
                    onChange={(e) => setResetScoresOnRematch(e.target.checked)}
                    className="accent-crimson-500"
                  />
                  <span>Reiniciar puntuaciones a cero</span>
                </label>
              </div>

              <Button
                variant="primary"
                size="lg"
                loading={loading}
                onClick={handleRematchSubmit}
                icon={<RotateCcw className="w-5 h-5" />}
              >
                Comenzar Revancha
              </Button>
            </GlassCard>
          )}
        </div>
      )}

      {/* Global Modals & Chat */}
      {showQR && <QRCodeModal roomCode={roomState.code} onClose={() => setShowQR(false)} />}
      {showClueHistory && (
        <ClueHistoryModal clues={game.clueHistory} onClose={() => setShowClueHistory(false)} />
      )}
      <ChatDrawer />
    </div>
  );
};
