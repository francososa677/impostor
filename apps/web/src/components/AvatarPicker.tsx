import React from "react";
import { clsx } from "clsx";

const GRADIENT_PALETTES = [
  "from-crimson-600 to-rose-800",
  "from-blue-600 to-indigo-800",
  "from-emerald-600 to-teal-800",
  "from-amber-600 to-orange-800",
  "from-purple-600 to-fuchsia-800",
  "from-cyan-600 to-blue-800",
  "from-rose-600 to-pink-800",
  "from-violet-600 to-indigo-900",
];

export function getPlayerColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENT_PALETTES.length;
  return GRADIENT_PALETTES[index];
}

export function getPlayerInitials(name: string): string {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

export const PlayerAvatarView: React.FC<{
  avatar?: string;
  name?: string;
  className?: string;
}> = ({ avatar = "detective-1", name, className = "w-10 h-10" }) => {
  const gradient = getPlayerColor(name || avatar || "Player");
  const initials = getPlayerInitials(name || avatar || "J");

  return (
    <div
      className={clsx(
        "rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-md shrink-0 select-none border border-white/10",
        gradient,
        className
      )}
    >
      {initials}
    </div>
  );
};
