"use client";

import Link from "next/link";
import { useState } from "react";
import { courseModules } from "@/lib/courseData";
import { useProgress } from "@/lib/progressContext";

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  lesson:   { label: "УРОК",     color: "#22d3ee" },
  artifact: { label: "АРТЕФАКТ", color: "#f59e0b" },
  quiz:     { label: "ТЕСТ",     color: "#a78bfa" },
  task:     { label: "ЗАВДАННЯ", color: "#34d399" },
};

export default function CoursePage() {
  const { isCompleted, totalProgress, completedLessons } = useProgress();
  const totalLessons = courseModules.reduce((acc, m) => acc + m.lessons.length, 0);
  // First module expanded by default
  const [expanded, setExpanded] = useState<string>(courseModules[0]?.id ?? "");

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? "" : id));

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>

      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b backdrop-blur px-6 py-4"
        style={{
          background: "color-mix(in srgb, var(--bg-base) 90%, transparent)",
          borderColor: "var(--border-base)",
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-sm transition-colors flex items-center gap-1"
            style={{ color: "var(--text-muted)" }}
          >
            ← На головну
          </Link>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            SoleStore Course
          </span>
          <div />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Page title + progress */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            Програма курсу
          </h1>

          {/* Progress bar */}
          <div className="flex items-center gap-4">
            <div
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ background: "var(--bg-overlay)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${totalProgress}%`, background: "var(--accent)" }}
              />
            </div>
            <span className="text-sm tabular-nums shrink-0" style={{ color: "var(--text-muted)" }}>
              {totalProgress}% · {completedLessons.size}/{totalLessons} уроків
            </span>
          </div>
        </div>

        {/* Modules accordion */}
        <div className="space-y-3">
          {courseModules.map((module, moduleIndex) => {
            const isOpen = expanded === module.id;
            const moduleCompleted = module.lessons.filter((l) => isCompleted(l.id)).length;

            return (
              <div
                key={module.id}
                className="rounded-2xl border overflow-hidden"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border-base)",
                }}
              >
                {/* Module header — clickable */}
                <button
                  onClick={() => toggle(module.id)}
                  className="w-full flex items-center gap-4 p-4 text-left transition-colors hover:opacity-90"
                >
                  {/* Emoji icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: "var(--bg-overlay)" }}
                  >
                    {module.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Модуль {moduleIndex + 1}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: "var(--accent-bg)",
                          color: "var(--accent)",
                        }}
                      >
                        {moduleCompleted}/{module.lessons.length}
                      </span>
                    </div>
                    <p
                      className="text-base font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {module.title}
                    </p>
                    {!isOpen && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                        {module.description}
                      </p>
                    )}
                  </div>

                  {/* Chevron */}
                  <span
                    className="shrink-0 text-sm transition-transform duration-200"
                    style={{
                      color: "var(--text-muted)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    ▼
                  </span>
                </button>

                {/* Lessons list — shown when open */}
                {isOpen && (
                  <div
                    className="border-t"
                    style={{ borderColor: "var(--border-base)" }}
                  >
                    {module.lessons.map((lesson) => {
                      const done = isCompleted(lesson.id);
                      const typeKey = (lesson.type || "lesson") as keyof typeof TYPE_LABEL;
                      const tc = TYPE_LABEL[typeKey] ?? TYPE_LABEL.lesson;

                      return (
                        <Link
                          key={lesson.id}
                          href={`/course/${module.id}/${lesson.id}`}
                          className="flex items-center gap-3 px-4 py-3.5 border-b last:border-b-0 transition-opacity hover:opacity-80"
                          style={{
                            borderColor: "var(--border-subtle)",
                            background: done
                              ? "color-mix(in srgb, var(--accent-bg) 40%, transparent)"
                              : "transparent",
                          }}
                        >
                          {/* Circle */}
                          <span
                            className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all"
                            style={{
                              background: done ? "var(--accent)" : "transparent",
                              borderColor: done ? "var(--accent)" : "var(--border-base)",
                              color: done ? "#fff" : "transparent",
                            }}
                          >
                            {done && "✓"}
                          </span>

                          {/* Type badge */}
                          <span
                            className="shrink-0 text-xs font-bold hidden sm:inline"
                            style={{ color: tc.color }}
                          >
                            {tc.label}
                          </span>

                          {/* Title */}
                          <span
                            className="flex-1 text-sm leading-snug"
                            style={{
                              color: done ? "var(--text-muted)" : "var(--text-primary)",
                            }}
                          >
                            {lesson.title}
                          </span>

                          {/* Duration */}
                          <span
                            className="text-xs shrink-0 flex items-center gap-1"
                            style={{ color: "var(--text-muted)" }}
                          >
                            ⏱ {lesson.duration}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
