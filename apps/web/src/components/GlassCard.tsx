import React from "react";
import { clsx } from "clsx";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: boolean;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  glow = false,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        "rounded-2xl transition-all duration-300",
        glow ? "glass-panel-glow" : "glass-panel",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
