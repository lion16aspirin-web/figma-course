"use client";

import Link from "next/link";
import { useRef, useEffect, useState, useCallback } from "react";
import { courseModules } from "@/lib/courseData";
import { useProgress } from "@/lib/progressContext";
import { useParams } from "next/navigation";

const SCROLL_KEY = "sidebar-scroll";

/* ─────────────────────────────────────────────
   Inner lesson list — shared between desktop & drawer
   Takes its own scrollable container ref so each
   instance manages its own scroll independently.
───────────────────────────────────────────────*/
function LessonNav({
  scrollRef,
  moduleId,
  lessonId,
  isCompleted,
  onLinkClick,
}: {
  scrollRef: React.RefObject<HTMLElement | null>;
  moduleId: string;
  lessonId: string;
  isCompleted: (id: string) => boolean;
  onLinkClick?: () => void;
}) {
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      sessionStorage.setItem(SCROLL_KEY, String(scrollRef.current.scrollTop));
    }
  }, [scrollRef]);

  return (
    <nav
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto py-2"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {courseModules.map((module) => {
        const isActiveModule = module.id === moduleId;
        const doneCount = module.lessons.filter((l) => isCompleted(l.id)).length;

        return (
          <div key={module.id} className="mb-0.5">
            {/* Module label */}
            <div className="flex items-center justify-between px-4 py-1.5">
              <span
                className="text-[11px] font-semibold uppercase tracking-wider truncate"
                style={{ color: isActiveModule ? "var(--accent)" : "var(--text-faint)" }}
              >
                {module.emoji} {module.title}
              </span>
              <span className="text-[10px] shrink-0 ml-2" style={{ color: "var(--text-faint)" }}>
                {doneCount}/{module.lessons.length}
              </span>
            </div>

            {/* Lessons */}
            {module.lessons.map((lesson) => {
              const isActive = lesson.id === lessonId && isActiveModule;
              const done = isCompleted(lesson.id);

              return (
                <Link
                  key={lesson.id}
                  href={`/course/${module.id}/${lesson.id}`}
                  onClick={onLinkClick}
                  className="flex items-center gap-2.5 px-4 py-2 transition-all rounded-lg mx-1"
                  style={{
                    background: isActive ? "var(--accent-bg)" : "transparent",
                    color: isActive ? "var(--accent)" : done ? "var(--text-muted)" : "var(--text-secondary)",
                  }}
                >
                  {/* Dot / check */}
                  <span
                    className="shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: done ? "var(--accent)" : isActive ? "var(--accent-bg)" : "transparent",
                      border: done ? "none" : `1.5px solid ${isActive ? "var(--accent)" : "var(--border-base)"}`,
                    }}
                  >
                    {done && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 4l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span
                    className="flex-1 leading-snug text-[12px]"
                    style={{
                      fontWeight: isActive ? 500 : 400,
                      textDecorationLine: done && !isActive ? "line-through" : "none",
                      textDecorationColor: "var(--text-faint)",
                    }}
                  >
                    {lesson.title}
                  </span>
                </Link>
              );
            })}
          </div>
        );
      })}
      {/* Bottom padding so last item isn't flush */}
      <div className="h-4" />
    </nav>
  );
}

/* ─────────────────────────────────────────────
   Sidebar header (home link + progress bar)
   Used in both desktop sidebar and mobile drawer
───────────────────────────────────────────────*/
function SidebarHeader({
  totalProgress,
  completedLessons,
  totalLessons,
  onHomeClick,
}: {
  totalProgress: number;
  completedLessons: Set<string>;
  totalLessons: number;
  onHomeClick?: () => void;
}) {
  return (
    <div className="px-4 pt-4 pb-3 border-b shrink-0" style={{ borderColor: "var(--border-base)" }}>
      <Link
        href="/"
        onClick={onHomeClick}
        className="text-xs flex items-center gap-1 mb-3 transition-opacity hover:opacity-70"
        style={{ color: "var(--text-muted)" }}
      >
        ← На головну
      </Link>

      <p className="font-semibold text-sm leading-tight mb-3" style={{ color: "var(--text-primary)" }}>
        SoleStore Course
      </p>

      <div>
        <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
          <span>{completedLessons.size} з {totalLessons} уроків</span>
          <span style={{ color: "var(--accent)" }}>{totalProgress}%</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-overlay)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${totalProgress}%`, background: "var(--accent)" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────────*/
export default function CourseSidebar() {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const { isCompleted, totalProgress, completedLessons } = useProgress();
  const totalLessons = courseModules.reduce((a, m) => a + m.lessons.length, 0);

  const [mobileOpen, setMobileOpen] = useState(false);

  // Separate refs: desktop nav and drawer nav
  const desktopNavRef = useRef<HTMLElement>(null);
  const drawerNavRef = useRef<HTMLElement>(null);

  // Restore scroll position for desktop sidebar on mount
  useEffect(() => {
    const nav = desktopNavRef.current;
    if (!nav) return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved !== null) nav.scrollTop = parseInt(saved, 10);
  }, []);

  // Restore scroll position for drawer when it opens
  useEffect(() => {
    if (!mobileOpen) return;
    // Wait for the drawer DOM to be painted
    requestAnimationFrame(() => {
      const nav = drawerNavRef.current;
      if (!nav) return;
      const saved = sessionStorage.getItem(SCROLL_KEY);
      if (saved !== null) nav.scrollTop = parseInt(saved, 10);
    });
  }, [mobileOpen]);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [lessonId, moduleId]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const currentModule = courseModules.find((m) => m.id === moduleId);
  const currentLesson = currentModule?.lessons.find((l) => l.id === lessonId);

  const headerProps = { totalProgress, completedLessons, totalLessons };
  const navProps = {
    moduleId: moduleId ?? "",
    lessonId: lessonId ?? "",
    isCompleted,
  };

  return (
    <>
      {/* ═══════════════════════════════════════
          DESKTOP sidebar (md and above)
      ═══════════════════════════════════════ */}
      <aside
        className="hidden md:flex w-64 shrink-0 h-screen sticky top-0 flex-col overflow-hidden border-r"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border-base)" }}
      >
        <SidebarHeader {...headerProps} />
        <LessonNav scrollRef={desktopNavRef} {...navProps} />
      </aside>

      {/* ═══════════════════════════════════════
          MOBILE bottom bar (below md)
      ═══════════════════════════════════════ */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t flex items-center gap-3 px-4"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border-base)",
          height: "56px",
        }}
      >
        {/* Current lesson info */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider leading-none mb-0.5" style={{ color: "var(--text-muted)" }}>
            {currentModule?.emoji} {currentModule?.title}
          </p>
          <p className="text-xs font-medium truncate leading-tight" style={{ color: "var(--text-primary)" }}>
            {currentLesson?.title}
          </p>
        </div>

        {/* Progress pill */}
        <span
          className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: "var(--accent-bg)", color: "var(--accent)" }}
        >
          {totalProgress}%
        </span>

        {/* Menu button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border transition-opacity hover:opacity-80"
          style={{ background: "var(--bg-overlay)", borderColor: "var(--border-base)", color: "var(--text-secondary)" }}
          aria-label="Відкрити зміст курсу"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ═══════════════════════════════════════
          MOBILE drawer (bottom sheet)
      ═══════════════════════════════════════ */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Sheet */}
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl flex flex-col"
            style={{
              background: "var(--bg-elevated)",
              maxHeight: "85vh",
              boxShadow: "0 -8px 48px rgba(0,0,0,0.3)",
            }}
          >
            {/* Drag handle row */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b shrink-0"
              style={{ borderColor: "var(--border-base)" }}
            >
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Зміст курсу
              </span>
              <div className="flex items-center gap-3">
                <div className="w-8 h-1 rounded-full" style={{ background: "var(--border-base)" }} />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "var(--bg-overlay)", color: "var(--text-muted)" }}
                  aria-label="Закрити"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Sidebar header (home + progress) */}
            <SidebarHeader {...headerProps} onHomeClick={() => setMobileOpen(false)} />

            {/* Scrollable lesson list */}
            <LessonNav
              scrollRef={drawerNavRef}
              {...navProps}
              onLinkClick={() => setMobileOpen(false)}
            />
          </div>
        </>
      )}
    </>
  );
}
