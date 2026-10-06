"use client";

import type { ReactNode } from "react";

interface ContextPanelProps {
  focusedChrome?: boolean;
  panelId: string;
  isActive: boolean;
  children: ReactNode;
}

export function ContextPanel({ panelId, isActive, children, focusedChrome = false }: ContextPanelProps) {
  return (
    <section
      id={`dock-panel-${panelId}`}
      role="tabpanel"
      aria-labelledby={`dock-tab-${panelId}`}
      hidden={!isActive}
      className={isActive ? `min-h-0 flex-1 overflow-y-auto overscroll-contain ${focusedChrome ? "bg-brand-surface p-4" : "bg-brand-paper p-3"}` : "hidden"}
    >
      {children}
    </section>
  );
}
