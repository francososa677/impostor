import React from "react";
import { clsx } from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles =
    "relative inline-flex items-center justify-center font-heading font-semibold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
    xl: "px-8 py-4 text-lg gap-3 shadow-xl",
  };

  const variantStyles = {
    primary:
      "bg-gradient-to-r from-crimson-600 to-crimson-700 hover:from-crimson-500 hover:to-crimson-600 text-white shadow-lg shadow-crimson-900/40 border border-crimson-500/30 hover:shadow-crimson-600/30",
    secondary:
      "bg-dark-800 hover:bg-dark-700 text-zinc-200 border border-white/10 hover:border-white/20 shadow-md",
    danger:
      "bg-red-600/80 hover:bg-red-600 text-white border border-red-500/30 shadow-lg shadow-red-950/50",
    ghost:
      "bg-transparent hover:bg-white/5 text-zinc-300 hover:text-white border border-transparent",
    outline:
      "bg-transparent hover:bg-crimson-950/30 text-crimson-400 hover:text-crimson-300 border border-crimson-600/40 hover:border-crimson-500",
  };

  return (
    <button
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        loading && "cursor-wait",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
