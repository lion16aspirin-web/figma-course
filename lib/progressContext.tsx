"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ProgressContextType {
  completedLessons: Set<string>;
  toggleLesson: (lessonId: string) => void;
  isCompleted: (lessonId: string) => boolean;
  totalProgress: number;
}

const ProgressContext = createContext<ProgressContextType | null>(null);

const STORAGE_KEY = "figma_progress";
const TOTAL_LESSONS = 17; // 12 lessons + 4 quizzes + 1 artifact

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCompletedLessons(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  const toggleLesson = (lessonId: string) => {
    setCompletedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const isCompleted = (lessonId: string) => completedLessons.has(lessonId);
  const totalProgress = Math.round((completedLessons.size / TOTAL_LESSONS) * 100);

  return (
    <ProgressContext.Provider value={{ completedLessons, toggleLesson, isCompleted, totalProgress }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
