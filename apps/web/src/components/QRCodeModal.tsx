import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Check, Share2, Sparkles } from "lucide-react";
import { GlassCard } from "./GlassCard.js";
import { Button } from "./Button.js";

interface QRCodeModalProps {
  roomCode: string;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ roomCode, onClose }) => {
  const [copied, setCopied] = useState(false);
  const joinUrl = `${window.location.origin}/join/${roomCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "¡Unite a mi partida de Impostor!",
          text: `Entrá a mi sala de Impostor. Código: ${roomCode}`,
          url: joinUrl,
        });
      } catch {
        // Fallback to copy
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <GlassCard glow className="w-full max-w-sm p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-zinc-400 hover:text-white transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="inline-flex p-2.5 rounded-2xl bg-crimson-950/60 border border-crimson-500/30 text-crimson-400 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-xl text-white">Escaneá para Unirte</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Abrí la cámara de tu celular y apuntá al código QR
          </p>

          {/* QR Code Container */}
          <div className="my-5 p-4 rounded-2xl bg-white inline-block shadow-2xl shadow-crimson-950/50">
            <QRCodeSVG
              value={joinUrl}
              size={180}
              level="H"
              includeMargin={false}
              fgColor="#09090b"
            />
          </div>

          {/* Room Code highlight */}
          <div className="mb-4">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
              Código de Sala
            </span>
            <div className="font-mono text-3xl font-black text-crimson-400 tracking-widest mt-0.5">
              {roomCode}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              icon={copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              onClick={handleCopy}
            >
              {copied ? "¡Copiado!" : "Copiar Enlace"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              icon={<Share2 className="w-4 h-4" />}
              onClick={handleShare}
            >
              Compartir
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
