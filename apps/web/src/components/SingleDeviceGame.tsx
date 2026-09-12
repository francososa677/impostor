import React, { useState, useEffect, useRef } from "react";
import { GlassCard } from "./GlassCard.js";
import { Button } from "./Button.js";
import { PlayerAvatarView } from "./AvatarPicker.js";
import { ConfettiEffect } from "./ConfettiEffect.js";
import { sounds } from "../audio/sound-system.js";
import { pickNewSecretWord } from "../data/words.js";
import {
  Eye,
  EyeOff,
  RotateCcw,
  Play,
  Users,
  Check,
  FastForward,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  UserX,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";
import { clsx } from "clsx";

export interface SingleDeviceConfig {
  playerNames: string[];
  selectedCategories: string[];
  impostorCount: number;
  impostorGetsClue: boolean;
  clueDeliveryMode: "oral" | "written";
  clueTimerSeconds: number;
  discussionTimerSeconds: number;
}

interface PlayerRoleState {
  id: string;
  name: string;
  isEliminated: boolean;
  role: "innocent" | "impostor";
  word?: string;
  contextClue?: string;
}

interface SingleDeviceGameProps {
  initialConfig: SingleDeviceConfig;
  onExit?: () => void;
}

export const SingleDeviceGame: React.FC<SingleDeviceGameProps> = ({
  initialConfig,
  onExit,
}) => {
  // Settings
  const [config, setConfig] = useState<SingleDeviceConfig>(initialConfig);
  const [newPlayerName, setNewPlayerName] = useState("");

  // Game lifecycle phases
  // LOBBY -> PASS_REVEAL -> ROUND_INTRO -> CLUE_ROUND -> DISCUSSION -> VOTING -> REVEAL_ELIMINATED -> GAME_OVER
  const [phase, setPhase] = useState<
    | "LOBBY"
    | "PASS_REVEAL"
    | "ROUND_INTRO"
    | "CLUE_ROUND"
    | "DISCUSSION"
    | "VOTING"
    | "REVEAL_ELIMINATED"
    | "GAME_OVER"
  >("LOBBY");

  // Game state
  const [round, setRound] = useState(1);
  const [players, setPlayers] = useState<PlayerRoleState[]>([]);
  const [secretWord, setSecretWord] = useState("");
  const [secretCategory, setSecretCategory] = useState("");
  const [turnOrder, setTurnOrder] = useState<string[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);

  // Pass-reveal state
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  // Clues given in current round (playerId -> word)
  const [cluesGiven, setCluesGiven] = useState<Record<string, string>>({});
  const [clueInputText, setClueInputText] = useState("");

  // Timer state
  const [remainingTimer, setRemainingTimer] = useState<number | null>(null);

  // Voting state
  const [selectedVoteTargetId, setSelectedVoteTargetId] = useState<string | null>(null);
  const [eliminatedPlayer, setEliminatedPlayer] = useState<PlayerRoleState | null>(null);
  const [winner, setWinner] = useState<"innocents" | "impostor" | null>(null);
  const [winReason, setWinReason] = useState("");

  // Timer reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Save session for recovery if refreshed
  useEffect(() => {
    sessionStorage.setItem("impostor_single_device_session", JSON.stringify(config));
  }, [config]);

  // Handle timer countdown
  const startTimer = (seconds: number, onExpire: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (seconds <= 0) {
      setRemainingTimer(null);
      return;
    }

    setRemainingTimer(seconds);

    timerRef.current = setInterval(() => {
      setRemainingTimer((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          sounds.playElimination();
          onExpire();
          return 0;
        }
        if (prev <= 6 && prev > 1) {
          sounds.playTick();
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRemainingTimer(null);
  };

  // ----------------------------------------------------
  // START OR RESTART MATCH
  // ----------------------------------------------------
  const startNewMatch = (keepPlayersList = config.playerNames) => {
    clearTimer();

    // 1. Pick secret word & category
    const wordEntry = pickNewSecretWord(config.selectedCategories);
    setSecretWord(wordEntry.word);
    setSecretCategory(wordEntry.category);

    // 2. Assign IDs and shuffle impostors
    const playerObjects: PlayerRoleState[] = keepPlayersList.map((name, i) => ({
      id: `p-${i}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      isEliminated: false,
      role: "innocent",
      word: wordEntry.word,
    }));

    // Pick impostor(s)
    const shuffledIndexes = [...Array(playerObjects.length).keys()].sort(() => Math.random() - 0.5);
    const chosenImpostorIndexes = shuffledIndexes.slice(0, Math.min(config.impostorCount, playerObjects.length - 1));

    chosenImpostorIndexes.forEach((idx) => {
      playerObjects[idx].role = "impostor";
      playerObjects[idx].word = undefined;
      playerObjects[idx].contextClue = config.impostorGetsClue ? wordEntry.contextClue : undefined;
    });

    // 3. Shuffled turn order
    const shuffledOrder = [...playerObjects.map((p) => p.id)].sort(() => Math.random() - 0.5);

    setPlayers(playerObjects);
    setTurnOrder(shuffledOrder);
    setRound(1);
    setCluesGiven({});
    setCurrentTurnIndex(0);
    setCurrentRevealIndex(0);
    setIsRevealed(false);
    setSelectedVoteTargetId(null);
    setEliminatedPlayer(null);
    setWinner(null);
    setWinReason("");

    // Start Phase 1: Pass & Reveal
    setPhase("PASS_REVEAL");
    sounds.playReveal();
  };

  // ----------------------------------------------------
  // CHANGE SECRET WORD (if innocent doesn't know it)
  // ----------------------------------------------------
  const handleChangeWord = () => {
    const newEntry = pickNewSecretWord(config.selectedCategories, secretWord);
    setSecretWord(newEntry.word);
    setSecretCategory(newEntry.category);

    // Update innocent players' word
    setPlayers((prev) =>
      prev.map((p) =>
        p.role === "innocent"
          ? { ...p, word: newEntry.word }
          : { ...p, contextClue: config.impostorGetsClue ? newEntry.contextClue : undefined }
      )
    );

    sounds.playReveal();
  };

  // ----------------------------------------------------
  // ADVANCE PASS & REVEAL
  // ----------------------------------------------------
  const handleNextRevealPlayer = () => {
    setIsRevealed(false);
    if (currentRevealIndex < players.length - 1) {
      setCurrentRevealIndex((prev) => prev + 1);
      sounds.playTick();
    } else {
      // Everyone has seen their role! Proceed to ROUND_INTRO
      setPhase("ROUND_INTRO");
      sounds.playVictory();
    }
  };

  // ----------------------------------------------------
  // START WORD ROUND AFTER ANNOUNCEMENT
  // ----------------------------------------------------
  const handleStartWordRound = () => {
    setPhase("CLUE_ROUND");
    setCurrentTurnIndex(0);
    sounds.playTurnStart();

    if (config.clueTimerSeconds > 0) {
      startTimer(config.clueTimerSeconds, () => {
        handleAdvanceTurn("[Tiempo agotado]");
      });
    }
  };

  // ----------------------------------------------------
  // SUBMIT WORD / ADVANCE TURN
  // ----------------------------------------------------
  const handleAdvanceTurn = (submittedWordText?: string) => {
    clearTimer();
    const aliveTurnOrder = turnOrder.filter((id) => {
      const p = players.find((pl) => pl.id === id);
      return p && !p.isEliminated;
    });

    const activePlayerId = aliveTurnOrder[currentTurnIndex];
    const wordToRecord =
      submittedWordText ||
      (config.clueDeliveryMode === "written"
        ? clueInputText.trim() || "Palabra registrada"
        : "Palabra dicha");

    setCluesGiven((prev) => ({
      ...prev,
      [activePlayerId]: wordToRecord,
    }));
    setClueInputText("");

    if (currentTurnIndex < aliveTurnOrder.length - 1) {
      const nextIndex = currentTurnIndex + 1;
      setCurrentTurnIndex(nextIndex);
      sounds.playTurnStart();

      if (config.clueTimerSeconds > 0) {
        startTimer(config.clueTimerSeconds, () => {
          handleAdvanceTurn("[Tiempo agotado]");
        });
      }
    } else {
      // Round completed! Advance to DISCUSSION
      setPhase("DISCUSSION");
      sounds.playReveal();

      if (config.discussionTimerSeconds > 0) {
        startTimer(config.discussionTimerSeconds, () => {
          handleStartVoting();
        });
      }
    }
  };

  // ----------------------------------------------------
  // START VOTING
  // ----------------------------------------------------
  const handleStartVoting = () => {
    clearTimer();
    setPhase("VOTING");
    setSelectedVoteTargetId(null);
    sounds.playReveal();
  };

  // ----------------------------------------------------
  // CONFIRM VOTING & ELIMINATION
  // ----------------------------------------------------
  const handleConfirmVote = () => {
    if (!selectedVoteTargetId) return;

    const target = players.find((p) => p.id === selectedVoteTargetId);
    if (!target) return;

    // Mark eliminated
    const updatedPlayers = players.map((p) =>
      p.id === selectedVoteTargetId ? { ...p, isEliminated: true } : p
    );
    setPlayers(updatedPlayers);
    setEliminatedPlayer(target);
    setPhase("REVEAL_ELIMINATED");
    sounds.playElimination();

    // Check win condition
    const alive = updatedPlayers.filter((p) => !p.isEliminated);
    const aliveImpostors = alive.filter((p) => p.role === "impostor");
    const aliveInnocents = alive.filter((p) => p.role === "innocent");

    if (aliveImpostors.length === 0) {
      setWinner("innocents");
      setWinReason("¡Descubrieron a todos los impostores!");
    } else if (aliveImpostors.length >= aliveInnocents.length) {
      setWinner("impostor");
      setWinReason("Los impostores lograron igualar o superar a los inocentes.");
    }
  };

  // ----------------------------------------------------
  // CONTINUE AFTER REVEAL
  // ----------------------------------------------------
  const handleContinueAfterReveal = () => {
    if (winner) {
      setPhase("GAME_OVER");
      sounds.playVictory();
    } else {
      // Start next round (Round 2+)
      setRound((prev) => prev + 1);
      setCluesGiven({});
      setCurrentTurnIndex(0);
      setPhase("ROUND_INTRO");
      sounds.playTurnStart();
    }
  };

  // Alive players
  const alivePlayers = players.filter((p) => !p.isEliminated);
  const aliveTurnOrder = turnOrder.filter((id) => {
    const p = players.find((pl) => pl.id === id);
    return p && !p.isEliminated;
  });
  const currentTurnPlayer = players.find(
    (p) => p.id === aliveTurnOrder[currentTurnIndex]
  );
  const startingPlayer = players.find((p) => p.id === aliveTurnOrder[0]);

  // ====================================================
  // RENDER: 1. LOBBY (Player Name List & Setup on this phone)
  // ====================================================
  if (phase === "LOBBY") {
    const handleAddPlayer = () => {
      if (!newPlayerName.trim()) return;
      if (config.playerNames.length >= 20) return;
      setConfig((prev) => ({
        ...prev,
        playerNames: [...prev.playerNames, newPlayerName.trim()],
      }));
      setNewPlayerName("");
    };

    const handleRemovePlayer = (index: number) => {
      if (config.playerNames.length <= 3) return;
      setConfig((prev) => ({
        ...prev,
        playerNames: prev.playerNames.filter((_, i) => i !== index),
      }));
    };

    const handleUpdatePlayerName = (index: number, val: string) => {
      setConfig((prev) => {
        const copy = [...prev.playerNames];
        copy[index] = val;
        return { ...prev, playerNames: copy };
      });
    };

    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson-600/20 border border-crimson-500/30 text-crimson-400 text-xs font-bold uppercase tracking-wider mb-2">
            Modo 1 Teléfono Presencial
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-white uppercase">
            Jugadores de la Partida
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Se juega usando únicamente este celular. Ingresá el nombre de cada jugador.
          </p>
        </div>

        <GlassCard glow className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-crimson-400" />
              <span>Jugadores ({config.playerNames.length})</span>
            </h2>
            <span className="text-xs text-zinc-500 font-semibold">Mínimo 3 jugadores</span>
          </div>

          {/* Player Names List */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {config.playerNames.map((name, index) => (
              <div
                key={index}
                className="flex items-center gap-2.5 p-2 rounded-xl bg-dark-900/80 border border-white/5 group focus-within:border-crimson-500/50"
              >
                <PlayerAvatarView name={name || `J${index + 1}`} className="w-9 h-9 text-xs" />
                <span className="text-xs font-bold text-zinc-500 w-5 text-center">
                  #{index + 1}
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleUpdatePlayerName(index, e.target.value)}
                  placeholder={`Nombre Jugador ${index + 1}`}
                  maxLength={20}
                  className="flex-1 bg-transparent text-white text-sm font-semibold focus:outline-none placeholder-zinc-600"
                />
                {config.playerNames.length > 3 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(index)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                    title="Eliminar jugador"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add New Player Input */}
          {config.playerNames.length < 20 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddPlayer();
              }}
              className="flex gap-2 pt-2 border-t border-white/5"
            >
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Nombre del nuevo jugador..."
                maxLength={20}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-white text-sm focus:outline-none focus:border-crimson-500 placeholder-zinc-600"
              />
              <Button
                type="submit"
                variant="secondary"
                size="md"
                disabled={!newPlayerName.trim()}
                icon={<Plus className="w-4 h-4" />}
              >
                Agregar
              </Button>
            </form>
          )}

          {/* Game Mode Delivery Toggle */}
          <div className="pt-4 border-t border-white/5 space-y-2">
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              ¿Cómo van a decir las palabras?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfig((p) => ({ ...p, clueDeliveryMode: "oral" }))}
                className={clsx(
                  "p-3 rounded-xl border text-left transition-all",
                  config.clueDeliveryMode === "oral"
                    ? "bg-crimson-950/60 border-crimson-500 text-white font-bold"
                    : "bg-dark-900 border-white/5 text-zinc-400"
                )}
              >
                <div className="text-xs font-bold">🗣️ Oralmente</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">En voz alta en su turno</div>
              </button>
              <button
                type="button"
                onClick={() => setConfig((p) => ({ ...p, clueDeliveryMode: "written" }))}
                className={clsx(
                  "p-3 rounded-xl border text-left transition-all",
                  config.clueDeliveryMode === "written"
                    ? "bg-crimson-950/60 border-crimson-500 text-white font-bold"
                    : "bg-dark-900 border-white/5 text-zinc-400"
                )}
              >
                <div className="text-xs font-bold">✍️ En Pantalla</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Escribiendo en el celular</div>
              </button>
            </div>
          </div>

          {/* Start Game Action */}
          <Button
            variant="primary"
            size="xl"
            disabled={
              config.playerNames.filter((n) => n.trim().length > 0).length < 3
            }
            onClick={() => startNewMatch()}
            icon={<Play className="w-5 h-5 fill-current" />}
            className="w-full py-4 text-lg font-black"
          >
            Comenzar Partida
          </Button>

          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 py-1"
            >
              Volver a la configuración de sala
            </button>
          )}
        </GlassCard>
      </div>
    );
  }

  // ====================================================
  // RENDER: 2. PASS_REVEAL (Pase del teléfono en secreto)
  // ====================================================
  if (phase === "PASS_REVEAL") {
    const currentPlayer = players[currentRevealIndex];

    return (
      <div className="max-w-md mx-auto px-4 py-8 min-h-[calc(100vh-80px)] flex flex-col justify-center">
        <GlassCard glow className="p-8 text-center space-y-6 animate-fade-in relative overflow-hidden">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-white/5">
            <span>
              Jugador {currentRevealIndex + 1} de {players.length}
            </span>
            <span className="font-semibold text-crimson-400">
              Pase de Celular Privado
            </span>
          </div>

          {!isRevealed ? (
            <>
              <div className="w-20 h-20 rounded-3xl bg-crimson-600/20 border border-crimson-500/40 text-crimson-400 flex items-center justify-center mx-auto shadow-2xl shadow-crimson-950">
                <EyeOff className="w-10 h-10 animate-pulse" />
              </div>

              <div>
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold block">
                  Pasá el celular a:
                </span>
                <h2 className="font-heading font-black text-3xl sm:text-4xl text-white mt-1">
                  {currentPlayer?.name}
                </h2>
                <p className="text-xs text-zinc-400 mt-2 max-w-xs mx-auto">
                  Asegurate de que ningún otro jugador mire la pantalla antes de continuar.
                </p>
              </div>

              <Button
                variant="primary"
                size="xl"
                className="w-full py-4 text-base font-bold shadow-lg shadow-crimson-950"
                onClick={() => {
                  setIsRevealed(true);
                  sounds.playTurnStart();
                }}
              >
                Soy {currentPlayer?.name}, Ver Mi Rol
              </Button>
            </>
          ) : (
            <>
              {/* Revealed State */}
              {currentPlayer?.role === "impostor" ? (
                <div className="space-y-4 py-2 animate-scale-up">
                  <div className="w-16 h-16 rounded-2xl bg-crimson-600 border border-crimson-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-crimson-900">
                    <ShieldAlert className="w-9 h-9" />
                  </div>

                  <div>
                    <div className="inline-block px-4 py-1.5 rounded-full bg-crimson-600 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-crimson-950 animate-bounce">
                      ¡SOS EL IMPOSTOR!
                    </div>
                    <p className="text-xs text-zinc-300 mt-3 max-w-xs mx-auto">
                      No tenés la palabra secreta. Escuchá atentamente las palabras de los demás
                      para deducirla y disimular sin que te descubran.
                    </p>
                  </div>

                  {currentPlayer.contextClue && (
                    <div className="p-3.5 rounded-2xl bg-dark-900 border border-crimson-500/30 text-xs text-left">
                      <span className="text-zinc-500 block text-[11px] uppercase font-bold">
                        Pista de ayuda contextual:
                      </span>
                      <span className="font-heading font-black text-crimson-300 text-base">
                        {currentPlayer.contextClue}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 py-2 animate-scale-up">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-950">
                    <Eye className="w-9 h-9" />
                  </div>

                  <div>
                    <span className="text-xs text-zinc-400 uppercase font-semibold block">
                      Categoría: <strong className="text-white">{secretCategory}</strong>
                    </span>
                    <span className="text-xs text-zinc-500 uppercase tracking-widest block mt-3">
                      Tu palabra secreta es:
                    </span>
                    <h1 className="font-heading font-black text-4xl sm:text-5xl text-crimson-400 tracking-wider mt-1 crimson-glow">
                      {secretWord}
                    </h1>
                    <p className="text-[11px] text-zinc-400 mt-3 max-w-xs mx-auto">
                      No digas esta palabra en voz alta. En tu turno dirás una sola palabra
                      relacionada.
                    </p>
                  </div>

                  {/* Change word option if player doesn't know it */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleChangeWord}
                      className="px-3 py-1.5 rounded-xl bg-dark-900/80 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 mx-auto hover:bg-amber-950/40 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>¿No conocés la palabra? Cambiar palabra</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Hide and proceed button */}
              <Button
                variant="primary"
                size="lg"
                className="w-full py-4 text-base font-bold mt-4"
                onClick={handleNextRevealPlayer}
              >
                Listo, Ya Vi Mi Rol (Ocultar)
              </Button>
            </>
          )}
        </GlassCard>
      </div>
    );
  }

  // ====================================================
  // RENDER: 3. ROUND_INTRO ("¡Todos vieron su rol! Empieza la ronda")
  // ====================================================
  if (phase === "ROUND_INTRO") {
    return (
      <div className="max-w-md mx-auto px-4 py-8 min-h-[calc(100vh-80px)] flex flex-col justify-center">
        <GlassCard glow className="p-8 text-center space-y-6 animate-scale-up">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-crimson-600 to-amber-600 text-white flex items-center justify-center mx-auto shadow-2xl shadow-crimson-950">
            <Sparkles className="w-10 h-10 animate-spin-slow" />
          </div>

          <div className="space-y-2">
            <div className="inline-block px-3 py-1 rounded-full bg-crimson-600/20 text-crimson-400 text-xs font-bold uppercase tracking-wider border border-crimson-500/30">
              Ronda {round}
            </div>
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-white uppercase">
              ¡Todos ya vieron su rol!
            </h2>
          </div>

          <div className="p-5 rounded-2xl bg-dark-900/80 border border-white/10 space-y-2">
            <span className="text-xs text-zinc-400 uppercase tracking-widest font-semibold block">
              Empieza la ronda:
            </span>
            <div className="flex items-center justify-center gap-3">
              <PlayerAvatarView name={startingPlayer?.name} className="w-12 h-12 text-lg" />
              <h3 className="font-heading font-black text-2xl text-white">
                {startingPlayer?.name}
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              En orden, cada jugador debe decir (o escribir) <strong>una sola palabra</strong>{" "}
              relacionada con su palabra secreta.
            </p>
          </div>

          <Button
            variant="primary"
            size="xl"
            className="w-full py-4 text-base font-black shadow-lg shadow-crimson-950"
            onClick={handleStartWordRound}
            icon={<ArrowRight className="w-5 h-5" />}
          >
            ¡Empezar Ronda de Palabras!
          </Button>
        </GlassCard>
      </div>
    );
  }

  // ====================================================
  // RENDER: 4. CLUE_ROUND (Decir o escribir la palabra con cronómetro)
  // ====================================================
  if (phase === "CLUE_ROUND") {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-dark-900/80 border border-white/5">
          <div>
            <span className="text-xs text-zinc-400 uppercase font-semibold">Ronda {round}</span>
            <h3 className="font-heading font-bold text-white text-base">Ronda de Palabras</h3>
          </div>

          {remainingTimer !== null && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-crimson-950/60 border border-crimson-500/40 text-crimson-300 font-mono font-bold text-base">
              <Clock className="w-4 h-4 animate-pulse text-crimson-400" />
              <span>{remainingTimer}s</span>
            </div>
          )}
        </div>

        {/* Current Turn Card */}
        <GlassCard glow className="p-8 text-center space-y-6">
          <div className="space-y-2">
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
              Turno para decir su palabra:
            </span>
            <div className="flex items-center justify-center gap-3 mt-1">
              <PlayerAvatarView name={currentTurnPlayer?.name} className="w-14 h-14 text-xl" />
              <h2 className="font-heading font-black text-3xl sm:text-4xl text-white">
                {currentTurnPlayer?.name}
              </h2>
            </div>
          </div>

          {config.clueDeliveryMode === "oral" ? (
            <div className="space-y-4 pt-4 border-t border-white/5">
              <p className="text-xs text-zinc-400">
                Decí tu palabra en voz alta a todos tus amigos. Una vez dicha, pasá al siguiente.
              </p>
              <Button
                variant="primary"
                size="xl"
                className="w-full py-4 text-base font-bold shadow-lg shadow-crimson-950"
                onClick={() => handleAdvanceTurn()}
              >
                Palabra Dicha / Siguiente Jugador ▶
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!clueInputText.trim()) return;
                handleAdvanceTurn(clueInputText.trim());
              }}
              className="space-y-4 pt-4 border-t border-white/5"
            >
              <input
                type="text"
                required
                value={clueInputText}
                onChange={(e) => setClueInputText(e.target.value)}
                placeholder="Escribí tu palabra aquí..."
                maxLength={60}
                className="w-full px-4 py-3 rounded-xl bg-dark-900 border border-white/10 text-white text-base placeholder-zinc-600 focus:outline-none focus:border-crimson-500"
              />
              <Button
                type="submit"
                variant="primary"
                size="xl"
                disabled={!clueInputText.trim()}
                className="w-full py-4 text-base font-bold"
              >
                Confirmar Palabra y Pasar ▶
              </Button>
            </form>
          )}

          {/* Turn Order Badges */}
          <div className="pt-4 border-t border-white/5">
            <span className="text-[11px] text-zinc-500 uppercase font-semibold block mb-2">
              Orden de turnos:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {aliveTurnOrder.map((pid, idx) => {
                const p = players.find((pl) => pl.id === pid);
                if (!p) return null;
                const hasGiven = cluesGiven[pid] !== undefined;
                const isCurrent = idx === currentTurnIndex;

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
                    <PlayerAvatarView name={p.name} className="w-4 h-4 text-[9px]" />
                    <span>{p.name}</span>
                    {hasGiven && <Check className="w-3 h-3 text-emerald-400" />}
                  </span>
                );
              })}
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  // ====================================================
  // RENDER: 5. DISCUSSION (Fase de debate grupal)
  // ====================================================
  if (phase === "DISCUSSION") {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <GlassCard glow className="p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-950">
            <Users className="w-8 h-8" />
          </div>

          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-500/30">
              Debate Abierto
            </div>
            <h2 className="font-heading font-black text-3xl text-white uppercase">
              Fase de Discusión
            </h2>
            <p className="text-xs text-zinc-400 mt-2 max-w-sm mx-auto">
              Analicen las palabras que dijo cada uno. ¿Quién sonó raro? ¿Quién dudó? Debatan
              abiertamente entre todos.
            </p>
          </div>

          {remainingTimer !== null && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-900 border border-amber-500/30 text-amber-400 font-mono font-bold text-lg">
              <Clock className="w-5 h-5 animate-pulse" />
              <span>Tiempo de debate: {remainingTimer}s</span>
            </div>
          )}

          {/* If written words, show board */}
          {config.clueDeliveryMode === "written" && Object.keys(cluesGiven).length > 0 && (
            <div className="text-left space-y-2 pt-4 border-t border-white/5">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                Palabras registradas en esta ronda:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {alivePlayers.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-dark-900/80 border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <PlayerAvatarView name={p.name} className="w-7 h-7 text-xs" />
                      <span className="text-xs font-bold text-white">{p.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-crimson-300">
                      "{cluesGiven[p.id] || "Sin palabra"}"
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="primary"
            size="xl"
            className="w-full py-4 text-base font-bold bg-gradient-to-r from-amber-600 to-crimson-600 hover:from-amber-500 hover:to-crimson-500"
            onClick={handleStartVoting}
            icon={<FastForward className="w-5 h-5" />}
          >
            Pasar a Votación
          </Button>
        </GlassCard>
      </div>
    );
  }

  // ====================================================
  // RENDER: 6. VOTING (Votación para expulsar)
  // ====================================================
  if (phase === "VOTING") {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <GlassCard glow className="p-8 text-center space-y-6">
          <div>
            <h2 className="font-heading font-black text-3xl text-white uppercase">
              ¿Quién es el Impostor?
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Seleccionen al jugador que el grupo decidió expulsar por votación.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {alivePlayers.map((p) => {
              const isSelected = selectedVoteTargetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedVoteTargetId(p.id)}
                  className={clsx(
                    "p-4 rounded-xl border text-left flex items-center justify-between transition-all duration-200",
                    isSelected
                      ? "bg-crimson-600 border-crimson-400 text-white shadow-lg shadow-crimson-900 scale-105 font-bold"
                      : "bg-dark-900/80 border-white/5 hover:border-white/20 text-zinc-300"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <PlayerAvatarView name={p.name} className="w-10 h-10 text-sm" />
                    <div>
                      <div className="text-sm font-bold text-white">{p.name}</div>
                      <span className="text-[10px] text-zinc-400">Sospechoso</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-white" />}
                </button>
              );
            })}
          </div>

          <Button
            variant="primary"
            size="xl"
            disabled={!selectedVoteTargetId}
            onClick={handleConfirmVote}
            className="w-full py-4 text-base font-bold shadow-lg shadow-crimson-950"
          >
            Confirmar Expulsión
          </Button>
        </GlassCard>
      </div>
    );
  }

  // ====================================================
  // RENDER: 7. REVEAL_ELIMINATED (Revelar si era impostor)
  // ====================================================
  if (phase === "REVEAL_ELIMINATED" && eliminatedPlayer) {
    const wasImpostor = eliminatedPlayer.role === "impostor";

    return (
      <div className="max-w-md mx-auto px-4 py-8 min-h-[calc(100vh-80px)] flex flex-col justify-center">
        {wasImpostor && <ConfettiEffect />}
        <GlassCard glow className="p-8 text-center space-y-6 animate-scale-up">
          <div
            className={clsx(
              "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl",
              wasImpostor
                ? "bg-emerald-600 text-white shadow-emerald-950"
                : "bg-red-600 text-white shadow-red-950"
            )}
          >
            {wasImpostor ? (
              <UserCheck className="w-10 h-10" />
            ) : (
              <UserX className="w-10 h-10" />
            )}
          </div>

          <div className="space-y-2">
            <span className="text-xs text-zinc-400 uppercase tracking-widest font-semibold block">
              El grupo votó expulsar a:
            </span>
            <h2 className="font-heading font-black text-3xl text-white">
              {eliminatedPlayer.name}
            </h2>
            <div
              className={clsx(
                "inline-block px-4 py-1.5 rounded-full font-black text-base uppercase tracking-wider mt-2",
                wasImpostor ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
              )}
            >
              {wasImpostor ? "¡ERA EL IMPOSTOR! 🕵️‍♂️💥" : "¡ERA INOCENTE! 😱"}
            </div>
          </div>

          <Button
            variant="primary"
            size="xl"
            onClick={handleContinueAfterReveal}
            className="w-full py-4 text-base font-bold shadow-lg"
          >
            {winner ? "Ver Resultados Finales" : "Continuar Siguiente Ronda ▶"}
          </Button>
        </GlassCard>
      </div>
    );
  }

  // ====================================================
  // RENDER: 8. GAME_OVER (Victoria y revancha)
  // ====================================================
  if (phase === "GAME_OVER") {
    const impostorNames = players
      .filter((p) => p.role === "impostor")
      .map((p) => p.name)
      .join(", ");

    return (
      <div className="max-w-md mx-auto px-4 py-8 min-h-[calc(100vh-80px)] flex flex-col justify-center">
        <ConfettiEffect />
        <GlassCard glow className="p-8 text-center space-y-6 animate-scale-up">
          <div className="w-20 h-20 rounded-3xl bg-crimson-600 text-white flex items-center justify-center mx-auto shadow-2xl shadow-crimson-950">
            <Sparkles className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="font-heading font-black text-3xl sm:text-4xl text-white uppercase">
              {winner === "innocents" ? "¡Ganan los Inocentes!" : "¡Gana el Impostor!"}
            </h1>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">{winReason}</p>
          </div>

          {/* Reveal details */}
          <div className="p-5 rounded-2xl bg-dark-900/80 border border-white/10 text-left space-y-3">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                Palabra Secreta:
              </span>
              <span className="font-heading font-black text-2xl text-crimson-400">
                {secretWord}
              </span>
              <span className="text-xs text-zinc-400 block mt-0.5">
                Categoría: {secretCategory}
              </span>
            </div>

            <div className="pt-2 border-t border-white/5">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                {config.impostorCount > 1 ? "Los Impostores eran:" : "El Impostor era:"}
              </span>
              <span className="font-bold text-white text-sm">{impostorNames}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="primary"
              size="xl"
              onClick={() => startNewMatch()}
              icon={<Play className="w-5 h-5 fill-current" />}
              className="w-full py-4 text-base font-black shadow-lg shadow-crimson-950"
            >
              Jugar Otra Ronda (Mismos Jugadores)
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setPhase("LOBBY")}
              className="w-full"
            >
              Cambiar Jugadores / Configuración
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return null;
};
