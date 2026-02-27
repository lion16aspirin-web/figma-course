"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  term: string;
  definition: string;
}

export default function GlossaryTerm({ term, definition }: Props) {
  const [visible, setVisible] = useState(false);
  const [above, setAbove] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);
  const isMobile = useRef(false);

  // Detect touch-only device once on mount
  useEffect(() => {
    isMobile.current = window.matchMedia("(hover: none)").matches;
  }, []);

  // Close tooltip on outside click/tap (mobile)
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

  // Decide whether tooltip opens above or below based on available viewport space
  const calculatePosition = () => {
    if (!spanRef.current) return;
    const rect = spanRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setAbove(spaceBelow < 180 && spaceAbove > spaceBelow);
  };

  return (
    <span
      ref={spanRef}
      onMouseEnter={() => {
        if (!isMobile.current) {
          calculatePosition();
          setVisible(true);
        }
      }}
      onMouseLeave={() => {
        if (!isMobile.current) setVisible(false);
      }}
      onClick={(e) => {
        if (isMobile.current) {
          e.stopPropagation();
          if (!visible) calculatePosition();
          setVisible((v) => !v);
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
            left: "50%",
            transform: "translateX(-50%)",
            ...(above
              ? { bottom: "calc(100% + 8px)" }
              : { top: "calc(100% + 8px)" }),
            zIndex: 9999,
            width: "280px",
            maxWidth: "min(280px, 88vw)",
            background: "#fef9c3",
            color: "#1c1917",
            borderRadius: "6px",
            padding: "10px 12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)",
            rotate: "-1deg",
            fontSize: "0.78rem",
            lineHeight: "1.55",
            pointerEvents: "none",
            animation: above
              ? "glossary-fade-up 0.18s ease forwards"
              : "glossary-fade-down 0.18s ease forwards",
          }}
        >
          {/* CSS triangle arrow */}
          <span
            style={{
              position: "absolute",
              left: "50%",
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
