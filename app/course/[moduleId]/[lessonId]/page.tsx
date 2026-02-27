import { notFound } from "next/navigation";
import { courseModules } from "@/lib/courseData";
import LessonContent from "@/components/LessonContent";

interface Props {
  params: Promise<{ moduleId: string; lessonId: string }>;
}

function buildLessonNav() {
  const flat: { moduleId: string; lessonId: string; title: string }[] = [];
  for (const module of courseModules) {
    for (const lesson of module.lessons) {
      flat.push({ moduleId: module.id, lessonId: lesson.id, title: lesson.title });
    }
  }
  return flat;
}

export function generateStaticParams() {
  const params: { moduleId: string; lessonId: string }[] = [];
  for (const module of courseModules) {
    for (const lesson of module.lessons) {
      params.push({ moduleId: module.id, lessonId: lesson.id });
    }
  }
  return params;
}

export default async function LessonPage({ params }: Props) {
  const { moduleId, lessonId } = await params;

  const module = courseModules.find((m) => m.id === moduleId);
  if (!module) notFound();

  const lesson = module.lessons.find((l) => l.id === lessonId);
  if (!lesson) notFound();

  const flat = buildLessonNav();
  const currentIndex = flat.findIndex((f) => f.lessonId === lessonId && f.moduleId === moduleId);
  const prevLesson = currentIndex > 0 ? flat[currentIndex - 1] : null;
  const nextLesson = currentIndex < flat.length - 1 ? flat[currentIndex + 1] : null;

  return (
    <LessonContent
      lesson={lesson}
      module={module}
      nextLesson={nextLesson}
      prevLesson={prevLesson}
    />
  );
}
