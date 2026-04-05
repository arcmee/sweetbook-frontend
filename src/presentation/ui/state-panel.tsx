import type { ReactElement } from "react";

type StateTone = "loading" | "empty" | "error";

type StatePanelProps = {
  tone: StateTone;
  title: string;
  description: string;
};

export function StatePanel({
  tone,
  title,
  description,
}: StatePanelProps): ReactElement {
  return (
    <section aria-live={tone === "loading" ? "polite" : undefined}>
      <p>{tone}</p>
      <h3>{title}</h3>
      <p>{description}</p>
    </section>
  );
}
