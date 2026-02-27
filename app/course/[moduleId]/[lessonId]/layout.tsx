import CourseSidebar from "@/components/CourseSidebar";

export default function LessonLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <CourseSidebar />
      {/* pb-16 on mobile to avoid bottom bar overlap */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
