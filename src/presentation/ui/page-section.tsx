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
  const headingId = toHeadingId(title);

  return (
    <section aria-labelledby={headingId}>
      {eyebrow ? <p>{eyebrow}</p> : null}
      <h2 id={headingId}>{title}</h2>
      <p>{description}</p>
      <div>{children}</div>
    </section>
  );
}

function toHeadingId(title: string): string {
  return `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}
