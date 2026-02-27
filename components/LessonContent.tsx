"use client";

import { ReactElement, ReactNode, useState } from "react";
import { useProgress } from "@/lib/progressContext";
import { Lesson, Module } from "@/lib/courseData";
import Link from "next/link";
import GlossaryTerm from "@/components/GlossaryTerm";
import { glossaryEntries } from "@/lib/glossary";

interface Props {
  lesson: Lesson;
  module: Module;
  nextLesson: { moduleId: string; lessonId: string; title: string } | null;
  prevLesson: { moduleId: string; lessonId: string; title: string } | null;
}

// ─── Glossary-aware inline renderer ───────────────────────────────────────────
// Replaces dangerouslySetInnerHTML for paragraphs and list items.
// Processes: **bold** → <strong>, `code` → <code>, glossary terms → <GlossaryTerm>

function applyGlossaryTerms(text: string, baseKey: number): ReactNode[] {
  if (!text) return [];
  let remaining = text;
  const segments: ReactNode[] = [];
  let k = baseKey;

  while (remaining.length > 0) {
    let earliestIndex = -1;
    let matchedEntry: { term: string; definition: string } | null = null;
    let matchedActual = "";

    for (const entry of glossaryEntries) {
      const escaped = entry.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?<![\\p{L}\\p{N}])(${escaped})(?![\\p{L}\\p{N}])`, "iu");
      const match = regex.exec(remaining);
      if (match && (earliestIndex === -1 || match.index < earliestIndex)) {
        earliestIndex = match.index;
        matchedEntry = entry;
        matchedActual = match[1];
      }
    }

    if (!matchedEntry || earliestIndex === -1) {
      segments.push(remaining);
      break;
    }
    if (earliestIndex > 0) segments.push(remaining.slice(0, earliestIndex));
    segments.push(
      <GlossaryTerm key={k++} term={matchedActual} definition={matchedEntry.definition} />
    );
    remaining = remaining.slice(earliestIndex + matchedActual.length);
  }
  return segments;
}

function applyCodeAndGlossary(text: string, baseKey: number): ReactNode[] {
  const codeParts = text.split(/(`[^`\n]+`)/g);
  const result: ReactNode[] = [];
  let k = baseKey;
  for (const part of codeParts) {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      result.push(
        <code
          key={k++}
          style={{
            background: "var(--bg-overlay)",
            color: "var(--accent-light)",
            padding: "1px 4px",
            borderRadius: "3px",
            fontSize: "0.75rem",
            fontFamily: "monospace",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    } else {
      result.push(...applyGlossaryTerms(part, k));
      k += 500;
    }
  }
  return result;
}

function renderInline(text: string): ReactNode[] {
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
  const result: ReactNode[] = [];
  let k = 0;
  for (const part of boldParts) {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      const inner = part.slice(2, -2);
      result.push(
        <strong key={k++} style={{ color: "var(--text-primary)", fontWeight: 600 }}>
          {applyCodeAndGlossary(inner, k * 1000)}
        </strong>
      );
    } else {
      result.push(...applyCodeAndGlossary(part, k * 1000));
    }
    k++;
  }
  return result;
}
// ──────────────────────────────────────────────────────────────────────────────

function QuizComponent({ lesson, onComplete }: { lesson: Lesson; onComplete: () => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const quiz = lesson.quiz || [];

  const correctCount = quiz.filter((q, i) => answers[i] === q.correct).length;
  const allAnswered = quiz.every((_, i) => answers[i] !== undefined);

  return (
    <div className="space-y-8">
      <div
        className="rounded-2xl p-5 border"
        style={{ background: "var(--accent-bg)", borderColor: "var(--accent-border)" }}
      >
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🧠</span>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Тест до модуля
          </h2>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Дайте відповідь на {quiz.length} запитань. Результат з&apos;явиться після відправки.
        </p>
      </div>

      {quiz.map((q, qi) => (
        <div key={qi} className="space-y-3">
          <p className="font-medium text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
            <span className="font-bold mr-2" style={{ color: "var(--accent-light)" }}>{qi + 1}.</span>
            {q.question}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const isSelected = answers[qi] === oi;
              const isCorrect = q.correct === oi;

              let bg = "var(--bg-overlay)";
              let border = "var(--border-base)";
              let color = "var(--text-secondary)";

              if (!submitted) {
                if (isSelected) {
                  bg = "var(--accent-bg)";
                  border = "var(--accent)";
                  color = "var(--text-primary)";
                }
              } else {
                if (isCorrect) { bg = "rgba(34,197,94,0.1)"; border = "#22c55e"; color = "#4ade80"; }
                else if (isSelected && !isCorrect) { bg = "rgba(239,68,68,0.1)"; border = "#ef4444"; color = "#f87171"; }
                else { color = "var(--text-muted)"; }
              }

              return (
                <div
                  key={oi}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl border text-sm cursor-pointer transition-all"
                  style={{ background: bg, borderColor: border, color }}
                  onClick={() => !submitted && setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                >
                  <span
                    className="shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold mt-0.5"
                    style={{
                      borderColor: !submitted
                        ? isSelected ? "var(--accent)" : "var(--border-base)"
                        : isCorrect ? "#22c55e" : isSelected ? "#ef4444" : "var(--border-base)",
                      background: !submitted
                        ? isSelected ? "var(--accent)" : "transparent"
                        : isCorrect ? "#22c55e" : isSelected ? "#ef4444" : "transparent",
                      color: (isSelected || (submitted && isCorrect)) ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    {String.fromCharCode(65 + oi)}
                  </span>
                  <span>{opt}</span>
                  {submitted && isCorrect && <span className="ml-auto shrink-0" style={{ color: "#4ade80" }}>✓</span>}
                  {submitted && isSelected && !isCorrect && <span className="ml-auto shrink-0" style={{ color: "#f87171" }}>✗</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button
          disabled={!allAnswered}
          onClick={() => setSubmitted(true)}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
          style={{
            background: allAnswered ? "var(--accent)" : "var(--bg-overlay)",
            color: allAnswered ? "#fff" : "var(--text-muted)",
            cursor: allAnswered ? "pointer" : "not-allowed",
          }}
        >
          {allAnswered ? "Перевірити відповіді" : `Дайте відповідь на всі запитання (${Object.keys(answers).length}/${quiz.length})`}
        </button>
      ) : (
        <div
          className="rounded-2xl p-6 text-center border"
          style={{
            background: correctCount === quiz.length
              ? "rgba(34,197,94,0.1)"
              : correctCount >= quiz.length / 2
              ? "rgba(234,179,8,0.1)"
              : "rgba(239,68,68,0.1)",
            borderColor: correctCount === quiz.length
              ? "rgba(34,197,94,0.3)"
              : correctCount >= quiz.length / 2
              ? "rgba(234,179,8,0.3)"
              : "rgba(239,68,68,0.3)",
          }}
        >
          <div className="text-4xl mb-3">
            {correctCount === quiz.length ? "🏆" : correctCount >= quiz.length / 2 ? "👍" : "📚"}
          </div>
          <p className="font-bold text-xl mb-1" style={{ color: "var(--text-primary)" }}>
            {correctCount}/{quiz.length} правильно
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            {correctCount === quiz.length
              ? "Відмінно! Ви засвоїли матеріал модуля."
              : correctCount >= quiz.length / 2
              ? "Непогано! Перегляньте уроки де допустили помилки."
              : "Рекомендуємо повторити матеріал модуля."}
          </p>
          <button
            onClick={onComplete}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors text-white"
            style={{ background: "var(--accent)" }}
          >
            Позначити тест виконаним →
          </button>
        </div>
      )}
    </div>
  );
}

export default function LessonContent({ lesson, module, nextLesson, prevLesson }: Props) {
  const { isCompleted, toggleLesson } = useProgress();
  const done = isCompleted(lesson.id);
  const isQuiz = lesson.type === "quiz";
  const isArtifact = lesson.type === "artifact";
  const isTask = lesson.type === "task";

  const renderContent = (text: string) => {
    const lines = text.split("\n");
    const elements: ReactElement[] = [];
    let i = 0;
    let keyCounter = 0;
    const nextKey = () => keyCounter++;

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith("### ")) {
        elements.push(
          <h3 key={nextKey()} className="text-lg font-semibold mt-6 mb-3" style={{ color: "var(--text-primary)" }}>
            {line.slice(4)}
          </h3>
        );
      } else if (line.startsWith("## ")) {
        elements.push(
          <h2 key={nextKey()} className="text-2xl font-bold mt-8 mb-4" style={{ color: "var(--text-primary)" }}>
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith("# ")) {
        elements.push(
          <h1 key={nextKey()} className="text-3xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
            {line.slice(2)}
          </h1>
        );
      } else if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
        elements.push(
          <p key={nextKey()} className="font-semibold mt-4 mb-1" style={{ color: "var(--text-primary)" }}>
            {line.slice(2, -2)}
          </p>
        );
      } else if (line.startsWith("> ")) {
        elements.push(
          <blockquote
            key={nextKey()}
            className="border-l-2 pl-4 py-3 pr-3 rounded-r-xl my-4 text-sm"
            style={{
              borderColor: "var(--accent)",
              background: "var(--accent-bg)",
              color: "var(--text-secondary)",
            }}
          >
            {line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}
          </blockquote>
        );
      } else if (line.startsWith("- ")) {
        const items: string[] = [];
        while (i < lines.length && lines[i].startsWith("- ")) {
          items.push(lines[i].slice(2));
          i++;
        }
        elements.push(
          <ul key={nextKey()} className="space-y-2 my-4">
            {items.map((item, idx) => (
              <li key={idx} className="flex gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <span className="mt-0.5 shrink-0" style={{ color: "var(--accent-light)" }}>•</span>
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        );
        continue;
      } else if (line.startsWith("```")) {
        const lang = line.slice(3);
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        elements.push(
          <div
            key={nextKey()}
            className="my-4 rounded-xl overflow-hidden border"
            style={{ borderColor: "var(--border-base)" }}
          >
            {lang && (
              <div
                className="px-4 py-2 text-xs border-b font-mono"
                style={{
                  background: "var(--bg-overlay)",
                  borderColor: "var(--border-base)",
                  color: "var(--text-muted)",
                }}
              >
                {lang}
              </div>
            )}
            <pre
              className="p-4 overflow-x-auto text-sm font-mono leading-relaxed"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-secondary)",
              }}
            >
              <code>{codeLines.join("\n")}</code>
            </pre>
          </div>
        );
      } else if (line.startsWith("|") && line.includes("|")) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].startsWith("|")) {
          tableLines.push(lines[i]);
          i++;
        }
        const headers = tableLines[0].split("|").filter((c) => c.trim());
        const rows = tableLines.slice(2).map((r) => r.split("|").filter((c) => c.trim()));
        elements.push(
          <div
            key={nextKey()}
            className="my-4 overflow-x-auto rounded-xl border"
            style={{ borderColor: "var(--border-base)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--bg-overlay)" }}>
                  {headers.map((h, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-3 text-left font-semibold whitespace-nowrap"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {h.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? "var(--bg-elevated)" : "var(--bg-base)" }}>
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="px-4 py-3 font-mono text-xs"
                        style={{ color: "var(--text-secondary)" }}
                        dangerouslySetInnerHTML={{
                          __html: cell.trim()
                            .replace(/`(.*?)`/g, `<code style="background:var(--bg-overlay);color:var(--accent-light);padding:1px 4px;border-radius:3px">$1</code>`)
                            .replace(/\*\*(.*?)\*\*/g, `<strong style="color:var(--text-primary)">$1</strong>`),
                        }}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      } else if (line.trim() === "" || line.startsWith("---")) {
        // skip
      } else {
        elements.push(
          <p
            key={nextKey()}
            className="leading-relaxed my-2 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            {renderInline(line)}
          </p>
        );
      }

      i++;
    }

    return elements;
  };

  const typeBadge = () => {
    if (isArtifact) return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border" style={{ background: "rgba(245,158,11,0.1)", color: "#fbbf24", borderColor: "rgba(245,158,11,0.3)" }}>
        📄 Артефакт
      </span>
    );
    if (isQuiz) return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border" style={{ background: "rgba(168,85,247,0.1)", color: "#c084fc", borderColor: "rgba(168,85,247,0.3)" }}>
        🧠 Тест
      </span>
    );
    if (isTask) return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border" style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", borderColor: "rgba(34,197,94,0.3)" }}>
        📝 Завдання
      </span>
    );
    return null;
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-10 backdrop-blur border-b px-4 py-3 flex items-center gap-2"
        style={{
          background: "color-mix(in srgb, var(--bg-base) 85%, transparent)",
          borderColor: "var(--border-base)",
        }}
      >
        {/* Home link — always visible */}
        <Link
          href="/"
          className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
          style={{ color: "var(--text-muted)", background: "var(--bg-overlay)" }}
          title="На головну"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>

        {/* Breadcrumb */}
        <div className="flex-1 flex items-center gap-2 text-sm min-w-0">
          <span className="hidden md:block shrink-0" style={{ color: "var(--text-muted)" }}>{module.title}</span>
          <span className="hidden md:block shrink-0" style={{ color: "var(--border-base)" }}>›</span>
          <span className="font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {lesson.title}
          </span>
        </div>

        {/* Complete button — hidden on mobile (use bottom nav instead) */}
        {!isQuiz && (
          <button
            onClick={() => toggleLesson(lesson.id)}
            className="hidden md:flex shrink-0 items-center gap-2 text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
            style={{
              background: done ? "var(--accent-bg)" : "var(--bg-overlay)",
              color: done ? "var(--accent-light)" : "var(--text-secondary)",
            }}
          >
            {done ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Виконано
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden lg:inline">Позначити як виконане</span>
                <span className="lg:hidden">Виконано?</span>
              </>
            )}
          </button>
        )}
      </header>

      {/* Artifact banner */}
      {isArtifact && (
        <div className="border-b px-6 py-3" style={{ background: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.2)" }}>
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <span className="text-xl">📄</span>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#fbbf24" }}>Готовий артефакт для роботи</p>
              <p className="text-xs" style={{ color: "rgba(251,191,36,0.7)" }}>Скопіюйте та адаптуйте під свій проєкт. Не надсилайте клієнту без персоналізації.</p>
            </div>
          </div>
        </div>
      )}

      {/* Task banner */}
      {isTask && (
        <div className="border-b px-6 py-3" style={{ background: "rgba(34,197,94,0.05)", borderColor: "rgba(34,197,94,0.2)" }}>
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <span className="text-xl">📝</span>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#4ade80" }}>Практичне завдання</p>
              <p className="text-xs" style={{ color: "rgba(74,222,128,0.7)" }}>Виконайте завдання на основі проєкту SoleStore. Після завершення — позначте як виконане.</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs mb-3 flex-wrap" style={{ color: "var(--text-muted)" }}>
            <span
              className="px-2 py-0.5 rounded-full"
              style={{ background: "var(--accent-bg)", color: "var(--accent-light)" }}
            >
              Модуль {parseInt(module.id.replace("module-", ""))}
            </span>
            <span>·</span>
            <span>{lesson.duration}</span>
            {typeBadge() && <span>·</span>}
            {typeBadge()}
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            {lesson.title}
          </h1>
        </div>

        {isQuiz ? (
          <QuizComponent lesson={lesson} onComplete={() => toggleLesson(lesson.id)} />
        ) : (
          <div className="prose-custom">
            {renderContent(lesson.content || "")}
          </div>
        )}

        {/* Task completion CTA */}
        {isTask && (
          <div
            className="mt-8 rounded-2xl p-5 border"
            style={{
              background: done ? "rgba(34,197,94,0.1)" : "var(--bg-elevated)",
              borderColor: done ? "rgba(34,197,94,0.3)" : "var(--border-base)",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm" style={{ color: done ? "#4ade80" : "var(--text-primary)" }}>
                  {done ? "✅ Завдання виконано!" : "Виконали завдання?"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {done ? "Чудова робота! Переходьте до наступного уроку." : "Позначте після завершення, щоб відстежити прогрес."}
                </p>
              </div>
              <button
                onClick={() => toggleLesson(lesson.id)}
                className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  background: done ? "rgba(34,197,94,0.2)" : "#22c55e",
                  color: done ? "#4ade80" : "#fff",
                }}
              >
                {done ? "Виконано ✓" : "Позначити виконаним"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation — pb-20 on mobile to clear the fixed bottom bar */}
      <div className="border-t px-4 py-4 pb-24 md:pb-4" style={{ borderColor: "var(--border-base)" }}>
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Mobile: complete button (full-width, above prev/next) */}
          {!isQuiz && !isTask && (
            <button
              onClick={() => toggleLesson(lesson.id)}
              className="md:hidden w-full py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: done ? "var(--accent-bg)" : "var(--accent)",
                color: done ? "var(--accent-light)" : "#fff",
              }}
            >
              {done ? "✓ Виконано" : "Позначити виконаним"}
            </button>
          )}

          <div className="flex items-center justify-between gap-4">
            {prevLesson ? (
              <Link
                href={`/course/${prevLesson.moduleId}/${prevLesson.lessonId}`}
                className="flex items-center gap-2 text-sm transition-colors group"
                style={{ color: "var(--text-secondary)" }}
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                <div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Попередній</div>
                  <div className="truncate max-w-36 md:max-w-48">{prevLesson.title}</div>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {/* Desktop: complete button (center) */}
            {!isQuiz && !isTask && (
              <button
                onClick={() => toggleLesson(lesson.id)}
                className="hidden md:block px-5 py-2 rounded-xl text-sm font-medium transition-colors shrink-0"
                style={{
                  background: done ? "var(--accent-bg)" : "var(--accent)",
                  color: done ? "var(--accent-light)" : "#fff",
                }}
              >
                {done ? "✓ Виконано" : "Позначити виконаним"}
              </button>
            )}

            {nextLesson ? (
              <Link
                href={`/course/${nextLesson.moduleId}/${nextLesson.lessonId}`}
                className="flex items-center gap-2 text-sm transition-colors group text-right"
                style={{ color: "var(--text-secondary)" }}
              >
                <div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Наступний</div>
                  <div className="truncate max-w-36 md:max-w-48">{nextLesson.title}</div>
                </div>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            ) : (
              <Link
                href="/"
                className="text-sm transition-colors"
                style={{ color: "var(--accent-light)" }}
              >
                Завершити курс →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
