import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { buildAppShell } from "../src/presentation/app";
import { PageSection } from "../src/presentation/ui/page-section";
import { StatePanel } from "../src/presentation/ui/state-panel";

describe("frontend validation and hardening", () => {
  it("marks the active navigation item for authenticated routes", () => {
    const markup = renderToStaticMarkup(
      buildAppShell({ currentRouteKey: "orders" }),
    );

    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain('href="/app/orders"');
  });

  it("binds page sections to explicit headings for screen-reader navigation", () => {
    const markup = renderToStaticMarkup(
      createElement(
        PageSection,
        {
          eyebrow: "Hardening",
          title: "Accessible section",
          description: "Section descriptions should stay associated with headings.",
        },
        "Body content",
      ),
    );

    expect(markup).toContain("aria-labelledby");
    expect(markup).toContain("Accessible section");
  });

  it("exposes state-panel tone through accessible status messaging", () => {
    const markup = renderToStaticMarkup(
      createElement(StatePanel, {
        tone: "error",
        title: "Unable to continue",
        description: "The prototype should expose state changes clearly.",
      }),
    );

    expect(markup).toContain('role="status"');
    expect(markup).toContain("Error state");
  });
});
