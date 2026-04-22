"use client";

import { useEffect, useRef } from "react";

export function CardGlowTracker({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    function handler(e: MouseEvent) {
      const root = ref.current;
      if (!root) return;

      const cards = root.querySelectorAll<HTMLElement>(".agent-card-premium");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
      });
    }

    container.addEventListener("mousemove", handler);
    return () => container.removeEventListener("mousemove", handler);
  }, []);

  return <div ref={ref}>{children}</div>;
}
