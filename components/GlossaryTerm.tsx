"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  term: string;
  definition: string;
}

interface TooltipState {
  visible: boolean;
  top: number;
  left: number;
  arrowLeft: number;
  above: boolean;
}

const TOOLTIP_W = 260;
const TOOLTIP_H = 130; // conservative estimate for above calculation
const MARGIN = 10;

function calcPos(spanEl: HTMLElement): Omit<TooltipState, "visible"> {
  const r = spanEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // vertical
  const spaceBelow = vh - r.bottom;
  const above = spaceBelow < TOOLTIP_H + 16 && r.top > spaceBelow;
  const top = above ? r.top - TOOLTIP_H - 10 : r.bottom + 10;

  // horizontal — center over span, clamp to screen
  const spanCenter = r.left + r.width / 2;
  const idealLeft = spanCenter - TOOLTIP_W / 2;
  const left = Math.max(MARGIN, Math.min(idealLeft, vw - TOOLTIP_W - MARGIN));

  // arrow tracks span center
  const arrowLeft = Math.max(14, Math.min(spanCenter - left, TOOLTIP_W - 14));

  return { top, left, arrowLeft, above };
}

export default function GlossaryTerm({ term, definition }: Props) {
  const [state, setState] = useState<TooltipState>({
    visible: false,
    top: 0,
    left: 0,
    arrowLeft: TOOLTIP_W / 2,
    above: false,
  });
  const [mounted, setMounted] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);
  const isMobile = useRef(false);

  useEffect(() => {
    setMounted(true);
    isMobile.current = window.matchMedia("(hover: none)").matches;
  }, []);

  useEffect(() => {
    if (!state.visible) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (spanRef.current && !spanRef.current.contains(e.target as Node))
        setState((s) => ({ ...s, visible: false }));
    };
    const onScroll = () => setState((s) => ({ ...s, visible: false }));
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      window.removeEventListener("scroll", onScroll);
    };
  }, [state.visible]);

  const open = () => {
    if (!spanRef.current) return;
    setState({ visible: true, ...calcPos(spanRef.current) });
  };
  const close = () => setState((s) => ({ ...s, visible: false }));

  const tooltip = state.visible && mounted ? (
    <span
      role="tooltip"
      style={{
        position: "fixed",
        top: state.top,
        left: state.left,
        width: TOOLTIP_W,
        zIndex: 9999,
        background: "#fef9c3",
        color: "#1c1917",
        borderRadius: "8px",
        padding: "10px 12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.20)",
        transform: "rotate(-1deg)",
        fontSize: "0.78rem",
        lineHeight: "1.55",
        pointerEvents: "none",
        animation: state.above
          ? "glossary-fade-up 0.15s ease forwards"
          : "glossary-fade-down 0.15s ease forwards",
      }}
    >
      {/* arrow */}
      <span style={{
        position: "absolute",
        left: state.arrowLeft,
        transform: "translateX(-50%)",
        width: 0, height: 0, display: "block",
        ...(state.above
          ? { bottom: -6, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #fef9c3" }
          : { top: -6, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderBottom: "6px solid #fef9c3" }),
      }} />

      <span style={{ display: "flex", alignItems: "center", gap: 5, fontWeight: 700, fontSize: "0.82rem", color: "#44403c", marginBottom: 5 }}>
        <span>📝</span>{term}
      </span>
      <span style={{ color: "#57534e", display: "block" }}>{definition}</span>
    </span>
  ) : null;

  return (
    <>
      <span
        ref={spanRef}
        onMouseEnter={() => { if (!isMobile.current) open(); }}
        onMouseLeave={() => { if (!isMobile.current) close(); }}
        onClick={(e) => {
          if (!isMobile.current) return;
          e.stopPropagation();
          state.visible ? close() : open();
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
      </span>

      {mounted && createPortal(tooltip, document.body)}
    </>
  );
}
