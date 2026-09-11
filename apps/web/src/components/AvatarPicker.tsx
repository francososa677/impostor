import React from "react";
import { User, Eye, Skull, Ghost, Zap, Flame, Crown, Sparkles } from "lucide-react";
import { clsx } from "clsx";

interface AvatarPickerProps {
  selectedAvatar: string;
  onSelect: (avatar: string) => void;
}

const AVATAR_ICONS: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  "detective-1": { icon: <Eye className="w-5 h-5" />, color: "from-amber-600 to-orange-700", label: "Ojo" },
  "detective-2": { icon: <User className="w-5 h-5" />, color: "from-blue-600 to-indigo-800", label: "Agente" },
  "shadow-1": { icon: <Ghost className="w-5 h-5" />, color: "from-purple-700 to-zinc-900", label: "Sombra" },
  "shadow-2": { icon: <Skull className="w-5 h-5" />, color: "from-zinc-700 to-zinc-900", label: "Calavera" },
  "spy-1": { icon: <Zap className="w-5 h-5" />, color: "from-yellow-600 to-amber-700", label: "Rayo" },
  "spy-2": { icon: <Flame className="w-5 h-5" />, color: "from-red-600 to-crimson-800", label: "Fuego" },
  "mask-1": { icon: <Crown className="w-5 h-5" />, color: "from-emerald-600 to-teal-800", label: "Corona" },
  "mask-2": { icon: <Sparkles className="w-5 h-5" />, color: "from-pink-600 to-rose-800", label: "Magia" },
};

export const AvatarPicker: React.FC<AvatarPickerProps> = ({ selectedAvatar, onSelect }) => {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
      {Object.entries(AVATAR_ICONS).map(([key, item]) => {
        const isSelected = selectedAvatar === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={clsx(
              "flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200 group relative",
              isSelected
                ? "bg-crimson-950/60 border-crimson-500 shadow-lg shadow-crimson-950/80 scale-105"
                : "bg-dark-850/60 border-white/5 hover:border-white/20 hover:bg-dark-800"
            )}
            title={item.label}
          >
            <div
              className={clsx(
                "w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shadow-inner transition-transform group-hover:scale-110",
                item.color
              )}
            >
              {item.icon}
            </div>
            <span className="text-[10px] text-zinc-400 mt-1 font-medium truncate max-w-full">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export const PlayerAvatarView: React.FC<{ avatar: string; className?: string }> = ({
  avatar,
  className = "w-10 h-10",
}) => {
  const meta = AVATAR_ICONS[avatar] || AVATAR_ICONS["detective-1"];
  return (
    <div
      className={clsx(
        "rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-md",
        meta.color,
        className
      )}
    >
      {meta.icon}
    </div>
  );
};
