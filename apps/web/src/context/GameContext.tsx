import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  PublicRoomState,
  PlayerPrivateState,
  ChatMessage,
  CreateRoomInput,
  JoinRoomInput,
  UpdateSettingsInput,
} from "@impostor/shared";
import { getSocket, GameSocket } from "../socket/socket-client.js";
import { sounds } from "../audio/sound-system.js";

interface NotificationInfo {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface GameContextType {
  socket: GameSocket;
  isConnected: boolean;
  isReconnecting: boolean;
  playerId: string | null;
  roomCode: string | null;
  sessionToken: string | null;
  roomState: PublicRoomState | null;
  privateState: PlayerPrivateState | null;
  messages: ChatMessage[];
  activeTimer: { type: "clue" | "discussion" | "vote"; remainingSeconds: number } | null;
  notifications: NotificationInfo[];
  removeNotification: (id: string) => void;
  showNotification: (message: string, type?: "success" | "error" | "info") => void;

  createRoom: (input: CreateRoomInput) => Promise<{ success: boolean; roomCode?: string; error?: string }>;
  joinRoom: (input: JoinRoomInput) => Promise<{ success: boolean; roomCode?: string; isSpectator?: boolean; error?: string }>;
  leaveRoom: () => void;
  kickPlayer: (targetPlayerId: string) => Promise<boolean>;
  updateSettings: (settings: UpdateSettingsInput) => Promise<boolean>;
  startGame: () => Promise<{ success: boolean; error?: string }>;
  submitClue: (text: string) => Promise<{ success: boolean; error?: string }>;
  skipTurn: () => Promise<{ success: boolean; error?: string }>;
  skipDiscussion: () => Promise<{ success: boolean; error?: string }>;
  voteChangeWord: () => Promise<{ success: boolean; wordChanged?: boolean; error?: string }>;
  submitVote: (targetPlayerId: string) => Promise<{ success: boolean; error?: string }>;
  submitLastChanceGuess: (guess: string) => Promise<{ success: boolean; isCorrect?: boolean; error?: string }>;
  rematch: (resetScores?: boolean) => Promise<{ success: boolean; error?: string }>;
  sendChatMessage: (text: string, reaction?: string) => Promise<boolean>;
}

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socket = getSocket();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const [playerId, setPlayerId] = useState<string | null>(() => sessionStorage.getItem("impostor_player_id"));
  const [roomCode, setRoomCode] = useState<string | null>(() => sessionStorage.getItem("impostor_room_code"));
  const [sessionToken, setSessionToken] = useState<string | null>(() => sessionStorage.getItem("impostor_session_token"));

  const [roomState, setRoomState] = useState<PublicRoomState | null>(null);
  const [privateState, setPrivateState] = useState<PlayerPrivateState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTimer, setActiveTimer] = useState<{ type: "clue" | "discussion" | "vote"; remainingSeconds: number } | null>(null);
  const [notifications, setNotifications] = useState<NotificationInfo[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev.slice(-4), { id, type, message }]);
    setTimeout(() => {
      removeNotification(id);
    }, 4000);
  }, [removeNotification]);

  // Socket Connection and Event Listeners
  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      setIsReconnecting(false);

      // Attempt session recovery
      const savedCode = sessionStorage.getItem("impostor_room_code");
      const savedPlayerId = sessionStorage.getItem("impostor_player_id");
      const savedToken = sessionStorage.getItem("impostor_session_token");

      if (savedCode && savedPlayerId && savedToken) {
        socket.emit(
          "room:reconnect",
          { roomCode: savedCode, playerId: savedPlayerId, sessionToken: savedToken },
          (res) => {
            if (!res.success) {
              sessionStorage.removeItem("impostor_room_code");
              sessionStorage.removeItem("impostor_player_id");
              sessionStorage.removeItem("impostor_session_token");
              setRoomCode(null);
              setPlayerId(null);
              setSessionToken(null);
              setRoomState(null);
              setPrivateState(null);
            }
          }
        );
      }
    }

    function onDisconnect() {
      setIsConnected(false);
      setIsReconnecting(true);
    }

    function onRoomState(state: PublicRoomState) {
      setRoomState((prev) => {
        // Play turn sound when your turn begins
        if (state.game?.phase === "CLUE_PHASE" && prev?.game?.currentTurnPlayerId !== state.game.currentTurnPlayerId) {
          if (state.game.currentTurnPlayerId === playerId) {
            sounds.playTurnStart();
          }
        }
        // Play elimination sound
        if (state.game?.phase === "REVEAL_ELIMINATED" && prev?.game?.phase !== "REVEAL_ELIMINATED") {
          sounds.playElimination();
        }
        // Play victory sound
        if (state.game?.phase === "GAME_OVER" && prev?.game?.phase !== "GAME_OVER") {
          sounds.playVictory();
        }
        return state;
      });
    }

    function onPrivateState(state: PlayerPrivateState) {
      setPrivateState(state);
    }

    function onChatMessage(message: ChatMessage) {
      setMessages((prev) => [...prev.slice(-99), message]);
    }

    function onTimerTick(payload: { type: "clue" | "discussion" | "vote"; remainingSeconds: number }) {
      setActiveTimer(payload);
      if (payload.remainingSeconds <= 5 && payload.remainingSeconds > 0) {
        sounds.playTick();
      }
      if (payload.remainingSeconds === 0) {
        setActiveTimer(null);
      }
    }

    function onPlayerKicked(reason: string) {
      showNotification(reason, "error");
      sessionStorage.clear();
      setRoomState(null);
      setPrivateState(null);
      setRoomCode(null);
      setPlayerId(null);
      setSessionToken(null);
    }

    function onNotificationError(msg: string) {
      showNotification(msg, "error");
    }

    function onNotificationSystem(msg: string) {
      showNotification(msg, "info");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:state", onRoomState);
    socket.on("player:private-state", onPrivateState);
    socket.on("chat:message", onChatMessage);
    socket.on("timer:tick", onTimerTick);
    socket.on("player:kicked", onPlayerKicked);
    socket.on("notification:error", onNotificationError);
    socket.on("notification:system", onNotificationSystem);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:state", onRoomState);
      socket.off("player:private-state", onPrivateState);
      socket.off("chat:message", onChatMessage);
      socket.off("timer:tick", onTimerTick);
      socket.off("player:kicked", onPlayerKicked);
      socket.off("notification:error", onNotificationError);
      socket.off("notification:system", onNotificationSystem);
    };
  }, [socket, playerId, showNotification]);

  // Actions
  const createRoom = useCallback(
    (input: CreateRoomInput): Promise<{ success: boolean; roomCode?: string; error?: string }> => {
      return new Promise((resolve) => {
        socket.emit("room:create", input, (res) => {
          if (res.success && res.roomCode && res.playerId && res.sessionToken) {
            setRoomCode(res.roomCode);
            setPlayerId(res.playerId);
            setSessionToken(res.sessionToken);
            sessionStorage.setItem("impostor_room_code", res.roomCode);
            sessionStorage.setItem("impostor_player_id", res.playerId);
            sessionStorage.setItem("impostor_session_token", res.sessionToken);
            showNotification(`¡Sala ${res.roomCode} creada!`, "success");
            resolve({ success: true, roomCode: res.roomCode });
          } else {
            showNotification(res.error || "Error al crear la sala", "error");
            resolve({ success: false, error: res.error });
          }
        });
      });
    },
    [socket, showNotification]
  );

  const joinRoom = useCallback(
    (input: JoinRoomInput): Promise<{ success: boolean; roomCode?: string; isSpectator?: boolean; error?: string }> => {
      return new Promise((resolve) => {
        socket.emit("room:join", input, (res) => {
          if (res.success && res.roomCode && res.playerId && res.sessionToken) {
            setRoomCode(res.roomCode);
            setPlayerId(res.playerId);
            setSessionToken(res.sessionToken);
            sessionStorage.setItem("impostor_room_code", res.roomCode);
            sessionStorage.setItem("impostor_player_id", res.playerId);
            sessionStorage.setItem("impostor_session_token", res.sessionToken);
            if (res.isSpectator) {
              showNotification("Entraste como espectador (partida en curso)", "info");
            } else {
              showNotification("¡Te uniste a la sala!", "success");
            }
            resolve({ success: true, roomCode: res.roomCode, isSpectator: res.isSpectator });
          } else {
            showNotification(res.error || "Error al unirse a la sala", "error");
            resolve({ success: false, error: res.error });
          }
        });
      });
    },
    [socket, showNotification]
  );

  const leaveRoom = useCallback(() => {
    socket.emit("room:leave");
    sessionStorage.removeItem("impostor_room_code");
    sessionStorage.removeItem("impostor_player_id");
    sessionStorage.removeItem("impostor_session_token");
    setRoomState(null);
    setPrivateState(null);
    setRoomCode(null);
    setPlayerId(null);
    setSessionToken(null);
    setMessages([]);
    setActiveTimer(null);
  }, [socket]);

  const kickPlayer = useCallback(
    (targetPlayerId: string): Promise<boolean> => {
      return new Promise((resolve) => {
        socket.emit("room:kick", { targetPlayerId }, (res) => {
          if (res.success) {
            showNotification("Jugador expulsado", "info");
            resolve(true);
          } else {
            showNotification(res.error || "Error al expulsar", "error");
            resolve(false);
          }
        });
      });
    },
    [socket, showNotification]
  );

  const updateSettings = useCallback(
    (settings: UpdateSettingsInput): Promise<boolean> => {
      return new Promise((resolve) => {
        socket.emit("room:settings-update", settings, (res) => {
          if (res.success) {
            showNotification("Configuración actualizada", "success");
            resolve(true);
          } else {
            showNotification(res.error || "Error al guardar configuración", "error");
            resolve(false);
          }
        });
      });
    },
    [socket, showNotification]
  );

  const startGame = useCallback((): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      socket.emit("game:start", (res) => {
        if (res.success) {
          sounds.playReveal();
          showNotification("¡La partida ha comenzado!", "success");
          resolve({ success: true });
        } else {
          showNotification(res.error || "No se pudo iniciar", "error");
          resolve({ success: false, error: res.error });
        }
      });
    });
  }, [socket, showNotification]);

  const submitClue = useCallback(
    (text: string): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        socket.emit("game:clue-submit", { text }, (res) => {
          if (res.success) {
            resolve({ success: true });
          } else {
            showNotification(res.error || "Error al enviar la pista", "error");
            resolve({ success: false, error: res.error });
          }
        });
      });
    },
    [socket, showNotification]
  );

  const skipTurn = useCallback((): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      socket.emit("game:skip-turn", (res) => {
        if (res.success) {
          resolve({ success: true });
        } else {
          showNotification(res.error || "Error al saltar turno", "error");
          resolve({ success: false, error: res.error });
        }
      });
    });
  }, [socket, showNotification]);

  const skipDiscussion = useCallback((): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      socket.emit("game:skip-discussion", (res) => {
        if (res.success) {
          showNotification("Discusión finalizada por el host", "info");
          resolve({ success: true });
        } else {
          showNotification(res.error || "Error al omitir discusión", "error");
          resolve({ success: false, error: res.error });
        }
      });
    });
  }, [socket, showNotification]);

  const voteChangeWord = useCallback((): Promise<{ success: boolean; wordChanged?: boolean; error?: string }> => {
    return new Promise((resolve) => {
      socket.emit("game:vote-change-word", (res) => {
        if (res.success) {
          if (res.wordChanged) {
            sounds.playReveal();
            showNotification("¡Palabra cambiada por mayoría!", "success");
          } else {
            showNotification("Tu voto para cambiar palabra fue registrado", "info");
          }
          resolve({ success: true, wordChanged: res.wordChanged });
        } else {
          showNotification(res.error || "Error al votar cambio de palabra", "error");
          resolve({ success: false, error: res.error });
        }
      });
    });
  }, [socket, showNotification]);

  const submitVote = useCallback(
    (targetPlayerId: string): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        socket.emit("game:vote-submit", { targetPlayerId }, (res) => {
          if (res.success) {
            sounds.playVoteCast();
            showNotification("¡Voto registrado!", "success");
            resolve({ success: true });
          } else {
            showNotification(res.error || "Error al votar", "error");
            resolve({ success: false, error: res.error });
          }
        });
      });
    },
    [socket, showNotification]
  );

  const submitLastChanceGuess = useCallback(
    (guess: string): Promise<{ success: boolean; isCorrect?: boolean; error?: string }> => {
      return new Promise((resolve) => {
        socket.emit("game:last-chance-guess", { guess }, (res) => {
          if (res.success) {
            if (res.isCorrect) {
              sounds.playVictory();
              showNotification("¡Acertaste la palabra secreta!", "success");
            } else {
              sounds.playElimination();
              showNotification("Palabra incorrecta...", "error");
            }
            resolve({ success: true, isCorrect: res.isCorrect });
          } else {
            showNotification(res.error || "Error al enviar intento", "error");
            resolve({ success: false, error: res.error });
          }
        });
      });
    },
    [socket, showNotification]
  );

  const rematch = useCallback(
    (resetScores = false): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        socket.emit("game:rematch", { resetScores }, (res) => {
          if (res.success) {
            sounds.playReveal();
            showNotification("¡Comenzando nueva partida!", "success");
            resolve({ success: true });
          } else {
            showNotification(res.error || "Error al iniciar revancha", "error");
            resolve({ success: false, error: res.error });
          }
        });
      });
    },
    [socket, showNotification]
  );

  const sendChatMessage = useCallback(
    (text: string, reaction?: string): Promise<boolean> => {
      return new Promise((resolve) => {
        socket.emit("chat:send", { text, reaction }, (res) => {
          if (res.success) {
            resolve(true);
          } else {
            showNotification(res.error || "Error al enviar mensaje", "error");
            resolve(false);
          }
        });
      });
    },
    [socket, showNotification]
  );

  return (
    <GameContext.Provider
      value={{
        socket,
        isConnected,
        isReconnecting,
        playerId,
        roomCode,
        sessionToken,
        roomState,
        privateState,
        messages,
        activeTimer,
        notifications,
        removeNotification,
        showNotification,
        createRoom,
        joinRoom,
        leaveRoom,
        kickPlayer,
        updateSettings,
        startGame,
        submitClue,
        skipTurn,
        skipDiscussion,
        voteChangeWord,
        submitVote,
        submitLastChanceGuess,
        rematch,
        sendChatMessage,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
};
