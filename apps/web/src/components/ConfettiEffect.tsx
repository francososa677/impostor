import React, { useEffect } from "react";
import confetti from "canvas-confetti";

export const ConfettiEffect: React.FC<{ durationMs?: number }> = ({ durationMs = 3500 }) => {
  useEffect(() => {
    const end = Date.now() + durationMs;
    const colors = ["#e11d48", "#be123c", "#f43f5e", "#ffffff", "#fb7185"];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, [durationMs]);

  return null;
};
