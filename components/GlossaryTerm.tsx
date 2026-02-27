"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface Props {
  term: string;
  definition: string;
}

const TOOLTIP_W = 272;
const MARGIN = 10;

export default function GlossaryTerm({ term, definition }: Props) {
  const [visible, setVisible] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [arrowLeft, setArrowLeft] = useState<number>(TOOLTIP_W / 2);
  const [above, setAbove] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const isMobile = useRef(false);

  useEffect(() => {
    isMobile.current = window.matchMedia("(hover: none)").matches;
  }, []);

  // Close on outside tap
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

  // Close on scroll
  useEffect(() => {
    if (!visible) return;
    const handler = () => setVisible(false);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [visible]);

  // Recalculate position after tooltip renders (so we know its actual height)
  useLayoutEffect(() => {
    if (!visible || !spanRef.current) return;

    const spanRect = spanRef.current.getBoundingClientRect();
    const tooltipH = tooltipRef.current?.getBoundingClientRect().height ?? 120;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // ── Vertical ────────────────────────────────────────────────────────────
    const spaceBelow = vh - spanRect.bottom;
    const isAbove = spaceBelow < tooltipH + 16 && spanRect.top > spaceBelow;

    const topValue = isAbove
      ? spanRect.top - tooltipH - 8
      : spanRect.bottom + 8;

    // ── Horizontal ──────────────────────────────────────────────────────────
    // Center tooltip over the span
    const spanCenterX = spanRect.left + spanRect.width / 2;
    const idealLeft = spanCenterX - TOOLTIP_W / 2;
    const clampedLeft = Math.max(MARGIN, Math.min(idealLeft, vw - TOOLTIP_W - MARGIN));

    // Arrow points at span center, clamped to tooltip interior
    const arrow = Math.max(12, Math.min(spanCenterX - clampedLeft, TOOLTIP_W - 12));

    setAbove(isAbove);
    setArrowLeft(arrow);
    setStyle({
      position: "fixed",
      top: topValue,
      left: clampedLeft,
      width: TOOLTIP_W,
    });
  }, [visible]);

  const show = () => setVisible(true);
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
          ref={tooltipRef}
          role="tooltip"
          style={{
            ...style,
            zIndex: 9999,
            background: "#fef9c3",
            color: "#1c1917",
            borderRadius: "6px",
            padding: "10px 12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.10)",
            rotate: "-1deg",
            fontSize: "0.78rem",
            lineHeight: "1.55",
            pointerEvents: "none",
            animation: above
              ? "glossary-fade-up 0.18s ease forwards"
              : "glossary-fade-down 0.18s ease forwards",
          }}
        >
          {/* Arrow */}
          <span
            style={{
              position: "absolute",
              left: arrowLeft,
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              display: "block",
              ...(above
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

          {/* Term */}
          <span style={{ display: "flex", alignItems: "center", gap: "5px", fontWeight: 700, fontSize: "0.82rem", color: "#44403c", marginBottom: "5px" }}>
            <span>📝</span>{term}
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
