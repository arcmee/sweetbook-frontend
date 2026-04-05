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
    <section role="status" aria-live={tone === "loading" ? "polite" : "polite"}>
      <p>{formatTone(tone)}</p>
      <h3>{title}</h3>
      <p>{description}</p>
    </section>
  );
}

function formatTone(tone: StateTone): string {
  if (tone === "loading") {
    return "Loading state";
  }

  if (tone === "error") {
    return "Error state";
  }

  return "Empty state";
}
