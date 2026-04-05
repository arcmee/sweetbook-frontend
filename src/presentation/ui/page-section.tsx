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
    <section>
      {eyebrow ? <p>{eyebrow}</p> : null}
      <h2>{title}</h2>
      <p>{description}</p>
      <div>{children}</div>
    </section>
  );
}
