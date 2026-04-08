import type { PropsWithChildren, ReactElement } from "react";

type PageSectionProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  description: string;
}>;

export function PageSection({
  eyebrow,
  title,
  description,
  children,
}: PageSectionProps): ReactElement {
  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}
