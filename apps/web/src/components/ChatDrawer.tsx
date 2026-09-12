import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Smile, Radio } from "lucide-react";
import { useGame } from "../context/GameContext.js";
import { CHAT_REACTIONS } from "@impostor/shared";
import { PlayerAvatarView } from "./AvatarPicker.js";
import { clsx } from "clsx";

export const ChatDrawer: React.FC = () => {
  const { messages, sendChatMessage } = useGame();
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(messages.length);

  useEffect(() => {
    if (!isOpen && messages.length > prevCountRef.current) {
      setUnreadCount((prev) => prev + (messages.length - prevCountRef.current));
    }
    prevCountRef.current = messages.length;

    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const msg = text;
    setText("");
    await sendChatMessage(msg);
  };

  const handleQuickReaction = async (reaction: string) => {
    await sendChatMessage(reaction, reaction);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={isOpen ? handleClose : handleOpen}
        className="fixed bottom-5 right-5 z-40 p-3.5 rounded-full bg-crimson-600 hover:bg-crimson-500 text-white shadow-xl shadow-crimson-950/80 border border-crimson-400/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
        aria-label="Chat"
      >
        <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-dark-950 text-xs font-black flex items-center justify-center animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out Drawer Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-96 h-[480px] max-h-[80vh] glass-panel rounded-2xl flex flex-col shadow-2xl border border-white/10 overflow-hidden animate-scale-up">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-dark-900/60">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-crimson-400 animate-pulse" />
              <h3 className="font-heading font-bold text-sm text-white">Chat en Tiempo Real</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages list */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 text-xs">
                <Smile className="w-8 h-8 mb-2 opacity-40 text-crimson-400" />
                <p>Nadie ha hablado aún.</p>
                <p>¡Sé el primero en enviar una reacción!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2 text-xs animate-fade-in">
                  <PlayerAvatarView name={msg.nickname} avatar={msg.avatar} className="w-6 h-6 shrink-0 mt-0.5 text-[9px]" />
                  <div className="flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-semibold text-zinc-200">{msg.nickname}</span>
                      {msg.isSpectator && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Espectador
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p
                      className={clsx(
                        "mt-0.5 break-words rounded-xl p-2 inline-block",
                        msg.reaction
                          ? "text-2xl bg-transparent p-0"
                          : "bg-dark-850/90 border border-white/5 text-zinc-200"
                      )}
                    >
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Reaction Bar */}
          <div className="px-3 py-1.5 border-t border-white/5 bg-dark-900/40 flex items-center justify-around">
            {CHAT_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleQuickReaction(emoji)}
                className="text-lg hover:scale-125 transition-transform p-1"
                title={`Reaccionar ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-dark-900/80 flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribí un mensaje..."
              maxLength={200}
              className="flex-1 px-3 py-2 rounded-xl bg-dark-800 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-crimson-500"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="p-2 rounded-xl bg-crimson-600 hover:bg-crimson-500 text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
