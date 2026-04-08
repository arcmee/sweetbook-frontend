import type { ReactElement } from "react";

type StateTone = "loading" | "empty" | "error" | "success";

type StatePanelProps = {
  tone: StateTone;
  title: string;
  description: string;
};

const toneMap = {
  loading: {
    label: "로딩",
    className: "border-sky-200 bg-sky-50 text-sky-900",
  },
  empty: {
    label: "안내",
    className: "border-slate-200 bg-slate-50 text-slate-900",
  },
  error: {
    label: "오류",
    className: "border-rose-200 bg-rose-50 text-rose-900",
  },
  success: {
    label: "완료",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
} as const;

export function StatePanel({
  tone,
  title,
  description,
}: StatePanelProps): ReactElement {
  const selectedTone = toneMap[tone];

  return (
    <section
      aria-live={tone === "loading" ? "polite" : undefined}
      className={`rounded-2xl border px-4 py-4 ${selectedTone.className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em]">{selectedTone.label}</p>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-6 opacity-80">{description}</p>
    </section>
  );
}
