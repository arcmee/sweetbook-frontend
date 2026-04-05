import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { buildAppShell } from "../src/presentation/app";
import { appRoutes, defaultRouteKey } from "../src/presentation/routes";
import { PageSection } from "../src/presentation/ui/page-section";
import { PrimaryAction } from "../src/presentation/ui/primary-action";
import { StatePanel } from "../src/presentation/ui/state-panel";

describe("frontend app shell foundation", () => {
  it("defines the baseline route map for prototype navigation", () => {
    expect(defaultRouteKey).toBe("login");
    expect(appRoutes.map((route) => route.key)).toEqual([
      "login",
      "dashboard",
      "groups",
      "events",
      "albums",
      "orders",
    ]);
    expect(appRoutes.map((route) => route.path)).toEqual([
      "/login",
      "/app",
      "/app/groups",
      "/app/events",
      "/app/albums",
      "/app/orders",
    ]);
  });

  it("renders the global shell, navigation, and active route placeholder", () => {
    const markup = renderToStaticMarkup(
      buildAppShell({ currentRouteKey: "groups" }),
    );

    expect(markup).toContain("SweetBook");
    expect(markup).toContain("Prototype workspace");
    expect(markup).toContain("Login");
    expect(markup).toContain("Groups");
    expect(markup).toContain("Group workspace");
    expect(markup).toContain("Authenticated routes stay behind the login boundary.");
  });

  it("exports shared UI primitives for later feature screens", () => {
    const sectionMarkup = renderToStaticMarkup(
      createElement(
        PageSection,
        {
          eyebrow: "Shared UI",
          title: "Section title",
          description: "Section description",
        },
        createElement(PrimaryAction, { label: "Continue" }),
      ),
    );
    const stateMarkup = renderToStaticMarkup(
      createElement(StatePanel, {
        tone: "empty",
        title: "No content yet",
        description: "Feature tasks will populate this view.",
      }),
    );

    expect(sectionMarkup).toContain("Shared UI");
    expect(sectionMarkup).toContain("Continue");
    expect(stateMarkup).toContain("No content yet");
    expect(stateMarkup).toContain("Feature tasks will populate this view.");
  });
});
