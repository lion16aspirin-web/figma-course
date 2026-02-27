# CLAUDE.md — figma-course

## What is this project
Ukrainian Figma basics course platform. Teaches design fundamentals, components, design systems, and interactive prototypes in Figma — from absolute zero.
4 modules, 12 lessons. Ukrainian language UI.
Live: TBD (not deployed yet) | Repo: TBD

## Ecosystem context (важливо для агентів)
Цей курс — частина серії курсів, що ведуть учня від нуля до повноцінного e-commerce:
1. **ai-sites-course** — сайт без коду: AI-білдери, візитки, лендінги
2. **figma-course** (цей проєкт) — Figma для новачків: компоненти, дизайн-системи, прототипи
3. **ecommerce-basic-course** — Базовий E-Commerce: Shopify, Хорошоп, KeyCRM, Нова Пошта
4. **ecommerce-course** (SoleStore) — просунутий e-commerce: повноцінний інтернет-магазин

При додаванні нових фіч — враховуй що потрібна сумісність з майбутнім API/auth.
Зараз прогрес і тема зберігаються в localStorage — це тимчасово, майбутній бекенд замінить.

## Tech stack
- Next.js 16.1.6 · React 19.2.3 · Tailwind CSS 4 · TypeScript 5
- Vercel (auto-deploy on push to main branch)
- No database — all content static in `lib/courseData.ts`
- No auth — progress stored in localStorage

## Commands
```
npm run dev    # local dev server
npm run build  # production build — must produce 20 static pages
npm run lint   # ESLint check
git push       # triggers Vercel deploy automatically
```

## File map
```
app/
  layout.tsx              # Root layout — ThemeProvider, ProgressProvider, ThemeToggle, anti-flash <script>
  globals.css             # ⚠️ Source of truth for ALL colors (CSS variables)
  page.tsx                # Homepage — hero, philosophy, module list, footer CTA
  course/
    page.tsx              # Syllabus — accordion modules + progress bar
    [moduleId]/[lessonId]/
      layout.tsx          # ⚠️ CourseSidebar lives HERE (not page.tsx) — persists between navigations
      page.tsx            # Server component — validates route, prev/next calc, renders LessonContent

components/
  CourseSidebar.tsx       # Desktop sidebar + mobile bottom bar (56px) + bottom sheet drawer
  LessonContent.tsx       # Lesson renderer: markdown parser, quiz, task/artifact banners, navigation
  ThemeToggle.tsx         # Fixed floating button — cycles dark → light → system

lib/
  courseData.ts           # ALL course content (2086 lines, ~104KB) — modules, lessons, quizzes
  progressContext.tsx     # Progress state via localStorage ("figma_progress")
  themeContext.tsx        # Theme state via localStorage ("theme") + OS preference
```

## Design system — CSS variables (globals.css)

⚠️ NEVER use hardcoded Tailwind color classes. Always use CSS variables.

| Token | Usage |
|---|---|
| `--bg-base` | Page background |
| `--bg-elevated` | Cards, sidebar, panels |
| `--bg-overlay` | Hover states, inputs |
| `--text-primary` | Main text |
| `--text-secondary` | Body copy |
| `--text-muted` | Labels, captions |
| `--text-faint` | Disabled, decorative |
| `--border-base` | Dividers, borders |
| `--accent` | Purple — CTAs, active states (`#a855f7` dark / `#9333ea` light) |
| `--accent-hover` | Lighter/darker purple on hover |
| `--accent-light` | Same as accent (alias) |
| `--accent-bg` | 10% opacity accent — highlighted backgrounds |
| `--accent-border` | 25% opacity accent — highlighted borders |

```tsx
// ✅ correct
style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}
className="border" style={{ borderColor: "var(--border-base)" }}

// ❌ wrong
className="bg-gray-900 text-white border-gray-800"
```

## Critical architecture rules

### 1. Sidebar in layout.tsx — not page.tsx
Next.js App Router destroys `page.tsx` DOM on every navigation but keeps `layout.tsx` DOM alive.
`CourseSidebar` scroll position persists **because** it lives in `layout.tsx`.
If you move it to `page.tsx` → scroll resets on every lesson click.

### 2. Mobile layout (breakpoint: md = 768px)
- Desktop: sidebar visible, `w-64`, sticky left column
- Mobile: sidebar hidden, fixed bottom bar `56px` height
- `<main>` in `layout.tsx` has `pb-16 md:pb-0` to clear the bottom bar
- `ThemeToggle`: `bottom-16 right-4 sm:bottom-6 sm:right-6` (raised on mobile to clear bottom bar)

### 3. Theme system
- `data-theme="dark" | "light"` set on `<html>` element
- Anti-flash inline `<script>` in `layout.tsx <head>` runs synchronously before first paint
- Theme cycle: dark → light → system → dark
- `"system"` mode listens to `prefers-color-scheme` OS changes via `matchMedia`

### 4. Static generation
All 17 lesson pages pre-built via `generateStaticParams()` in `page.tsx`.
Always run `npm run build` after changing `courseData.ts` or route structure.
Expected output: **20 static pages** (17 lessons + homepage + /course + /not-found).

## Course data (lib/courseData.ts)

File is 2086 lines / ~104KB — source of truth for all course content. Do not duplicate content elsewhere.

**Lesson types:**
- `"lesson"` — standard markdown content
- `"task"` — practical exercise (green banner + completion CTA at bottom)
- `"artifact"` — template/document (amber banner, "copy & adapt for your project")
- `"quiz"` — multiple choice questions (`quiz: QuizQuestion[]` array)

**ID conventions:**
- Module IDs: `module-1` … `module-4`
- Lesson ID format: `m{n}-l{n}` (e.g. `m1-l1`, `m4-l10`) — lesson numbers are global (not reset per module)
- Quiz ID format: `m{n}-quiz` (e.g. `m1-quiz`)
- Artifact ID: `m4-artifact`

**Module titles:**
- module-1: "Знайомство з Figma" (3 lessons + quiz)
- module-2: "Компоненти та UI-кіти" (3 lessons + quiz)
- module-3: "Дизайн-система" (3 lessons + quiz)
- module-4: "Мобільна версія, прототип та передача" (3 lessons + quiz + artifact)

**To add a new lesson:** append to `lessons[]` in the correct module in `courseData.ts`
**To add a new module:** append to `courseModules[]`, then update `TOTAL_LESSONS` in `progressContext.tsx`

## Content renderer (LessonContent.tsx)

Custom markdown-like parser — **no external libraries**.
Supported syntax: `# ## ###` headings, `**bold**`, `` `code` ``, `> blockquote`, `- list`, ```` ``` ```` code block, `|` table rows.
All rendered elements use CSS variables for color (no hardcoded colors).


## Glossary tooltip system

Terms in lesson content are auto-highlighted with a dashed underline (accent color).
Hover (desktop) or tap (mobile) → shows a sticky-note style tooltip with a plain-language definition.

**Files:**
- `lib/glossary.ts` — 90 Ukrainian terms across 7 categories, exported as `glossaryEntries` sorted longest-first
- `components/GlossaryTerm.tsx` — `"use client"` component, absolute-positioned tooltip, CSS arrow, fade animation
- `app/globals.css` — `@keyframes glossary-fade-down/up` for tooltip entrance animation

**Integration in `LessonContent.tsx`:**
- `renderInline(text)` → splits bold/code → `applyGlossaryTerms()` → wraps found terms in `<GlossaryTerm>`
- Applied to: `<p>` paragraphs and `<li>` list items only
- NOT applied to: headings, code blocks, table cells (intentional)
- Longest-first matching prevents "UI" from matching inside "UI-кіт"

**To add new terms:** edit `lib/glossary.ts` in each course separately (4 independent files).

## Progress tracking (lib/progressContext.tsx)

- `localStorage` key: `"figma_progress"` (JSON array of completed lesson IDs)
- `TOTAL_LESSONS = 17` — update this constant if lesson count changes
- Hook: `useProgress()` → `{ completedLessons, toggleLesson, isCompleted, totalProgress }`

## Conventions

- **UI language:** Ukrainian. **Code/comments:** English.
- **Styling:** `style={{ }}` with CSS vars for color, Tailwind for layout/spacing/sizing.
- **`"use client"`** — only when component uses `useState`, `useEffect`, or event handlers.
- **Server components** by default (`layout.tsx`, `page.tsx`).
- **Commits:** English imperative + `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- **After every change:** run `npm run build` to verify all 20 pages build successfully.

## Related docs

| File | Purpose |
|------|---------|
| [README.md](./README.md) | Developer quickstart (Next.js, deploy). |
