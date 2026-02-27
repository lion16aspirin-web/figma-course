"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  term: string;
  definition: string;
}

interface TooltipPos {
  top: number;
  left: number;
  arrowLeft: number; // px from tooltip left edge
  fadeUp: boolean;   // true = animate upward (tooltip is above term)
}

const TOOLTIP_W = 272;
const MARGIN = 10; // min gap from viewport edges

export default function GlossaryTerm({ term, definition }: Props) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<TooltipPos>({ top: 0, left: 0, arrowLeft: TOOLTIP_W / 2, fadeUp: false });
  const spanRef = useRef<HTMLSpanElement>(null);
  const isMobile = useRef(false);

  useEffect(() => {
    isMobile.current = window.matchMedia("(hover: none)").matches;
  }, []);

  // Close on outside tap/click
  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (spanRef.current && !spanRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [visible]);

  // Close on scroll (fixed tooltip would otherwise float away)
  useEffect(() => {
    if (!visible) return;
    const handler = () => setVisible(false);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [visible]);

  const calculatePosition = () => {
    if (!spanRef.current) return;
    const rect = spanRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // ── Vertical: prefer below, flip above if not enough space ──────────────
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    const above = spaceBelow < 200 && spaceAbove > spaceBelow;

    const tooltipTop = above
      ? rect.top - 8   // will be offset by height via transform below
      : rect.bottom + 8;

    // ── Horizontal: center over span, clamp to viewport ─────────────────────
    const spanCenterX = rect.left + rect.width / 2;
    const idealLeft = spanCenterX - TOOLTIP_W / 2;
    const clampedLeft = Math.max(MARGIN, Math.min(idealLeft, vw - TOOLTIP_W - MARGIN));

    // Arrow points to span center, clamped within tooltip bounds
    const arrowLeft = Math.max(12, Math.min(spanCenterX - clampedLeft, TOOLTIP_W - 12));

    setPos({ top: tooltipTop, left: clampedLeft, arrowLeft, fadeUp: above });
  };

  const show = () => { calculatePosition(); setVisible(true); };
  const hide = () => setVisible(false);

  return (
    <span
      ref={spanRef}
      onMouseEnter={() => { if (!isMobile.current) show(); }}
      onMouseLeave={() => { if (!isMobile.current) hide(); }}
      onClick={(e) => {
        if (isMobile.current) {
          e.stopPropagation();
          if (!visible) show(); else hide();
        }
      }}
      style={{
        display: "inline",
        borderBottom: "1.5px dashed var(--accent)",
        color: "inherit",
        cursor: "help",
        userSelect: "text",
      }}
    >
      {term}

      {visible && (
        <span
          role="tooltip"
          aria-label={`Визначення: ${term}`}
          style={{
            // fixed = relative to viewport, never clipped by parent overflow/padding
            position: "fixed",
            top: pos.fadeUp ? undefined : pos.top,
            bottom: pos.fadeUp ? `${window.innerHeight - pos.top}px` : undefined,
            left: pos.left,
            zIndex: 9999,
            width: `${TOOLTIP_W}px`,
            background: "#fef9c3",
            color: "#1c1917",
            borderRadius: "6px",
            padding: "10px 12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.10)",
            rotate: "-1deg",
            fontSize: "0.78rem",
            lineHeight: "1.55",
            pointerEvents: "none",
            animation: pos.fadeUp
              ? "glossary-fade-up 0.18s ease forwards"
              : "glossary-fade-down 0.18s ease forwards",
          }}
        >
          {/* Arrow — always points to the span center */}
          <span
            style={{
              position: "absolute",
              left: pos.arrowLeft,
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              display: "block",
              ...(pos.fadeUp
                ? {
                    bottom: "-6px",
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: "6px solid #fef9c3",
                  }
                : {
                    top: "-6px",
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderBottom: "6px solid #fef9c3",
                  }),
            }}
          />

          {/* Term title */}
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontWeight: 700,
              fontSize: "0.82rem",
              color: "#44403c",
              marginBottom: "5px",
            }}
          >
            <span style={{ fontSize: "0.9rem" }}>📝</span>
            {term}
          </span>

          {/* Definition */}
          <span style={{ color: "#57534e", display: "block" }}>
            {definition}
          </span>
        </span>
      )}
    </span>
  );
}
