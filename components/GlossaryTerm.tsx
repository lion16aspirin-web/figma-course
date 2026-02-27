"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  term: string;
  definition: string;
}

interface TooltipPos {
  above: boolean;
  // horizontal offset relative to the trigger span's left edge (px)
  // used as `left` on the tooltip; we also track where the arrow should point
  left: number;
  // where the arrow sits horizontally inside the tooltip (%)
  arrowLeft: string;
}

const TOOLTIP_W = 272; // px — must match width below
const MARGIN = 8;      // min gap from viewport edge

export default function GlossaryTerm({ term, definition }: Props) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<TooltipPos>({ above: false, left: 0, arrowLeft: "50%" });
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

  const calculatePosition = () => {
    if (!spanRef.current) return;
    const rect = spanRef.current.getBoundingClientRect();
    const vw = window.innerWidth;

    // ── Vertical ────────────────────────────────────────────────────────────
    const above = window.innerHeight - rect.bottom < 180 && rect.top > window.innerHeight - rect.bottom;

    // ── Horizontal ──────────────────────────────────────────────────────────
    // Ideal: center the tooltip over the middle of the trigger span
    const spanCenterX = rect.left + rect.width / 2;
    let idealLeft = spanCenterX - TOOLTIP_W / 2; // relative to viewport

    // Clamp so tooltip stays inside viewport with MARGIN gap
    const clampedLeft = Math.max(MARGIN, Math.min(idealLeft, vw - TOOLTIP_W - MARGIN));

    // Arrow position: where the span center is, relative to the clamped tooltip
    const arrowPx = spanCenterX - clampedLeft;
    // Clamp arrow itself so it doesn't overflow the tooltip corners (border-radius 6px)
    const arrowPct = Math.max(12, Math.min(arrowPx, TOOLTIP_W - 12));
    const arrowLeft = `${(arrowPct / TOOLTIP_W) * 100}%`;

    // Convert from viewport coords to position relative to the span's offsetParent.
    // Since the tooltip is inside the span (position:relative), we need left
    // relative to the span's left edge.
    const leftRelativeToSpan = clampedLeft - rect.left;

    setPos({ above, left: leftRelativeToSpan, arrowLeft });
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
        position: "relative",
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
            position: "absolute",
            left: `${pos.left}px`,
            ...(pos.above
              ? { bottom: "calc(100% + 8px)" }
              : { top: "calc(100% + 8px)" }),
            zIndex: 9999,
            width: `${TOOLTIP_W}px`,
            background: "#fef9c3",
            color: "#1c1917",
            borderRadius: "6px",
            padding: "10px 12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.20), 0 1px 4px rgba(0,0,0,0.10)",
            rotate: "-1deg",
            fontSize: "0.78rem",
            lineHeight: "1.55",
            pointerEvents: "none",
            animation: pos.above
              ? "glossary-fade-up 0.18s ease forwards"
              : "glossary-fade-down 0.18s ease forwards",
          }}
        >
          {/* Arrow — follows span center even when tooltip is clamped */}
          <span
            style={{
              position: "absolute",
              left: pos.arrowLeft,
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              display: "block",
              ...(pos.above
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
