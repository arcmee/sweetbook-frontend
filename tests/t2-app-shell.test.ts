import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { buildAppShell } from "../src/presentation/app";
import {
  appRoutes,
  defaultRouteKey,
  getRouteByPath,
} from "../src/presentation/routes";
import { PageSection } from "../src/presentation/ui/page-section";
import { PrimaryAction } from "../src/presentation/ui/primary-action";
import { StatePanel } from "../src/presentation/ui/state-panel";

describe("frontend app shell foundation", () => {
  it("defines the baseline route map for prototype navigation", () => {
    expect(defaultRouteKey).toBe("landing");
    expect(appRoutes.map((route) => route.key)).toEqual([
      "landing",
      "signup",
      "login",
      "dashboard",
      "groups",
      "events",
      "albums",
      "orders",
    ]);
    expect(appRoutes.map((route) => route.path)).toEqual([
      "/",
      "/signup",
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
      buildAppShell({
        currentRouteKey: "groups",
        initialSession: {
          token: "ptok_123",
          user: {
            userId: "user-demo",
            username: "demo",
            displayName: "SweetBook Demo User",
            role: "owner",
          },
        },
      }),
    );

    expect(markup).toContain("SweetBook");
    expect(markup).toContain("Prototype workspace");
    expect(markup).toContain("Login");
    expect(markup).toContain("Start");
    expect(markup).toContain("Group");
    expect(markup).toContain("Events in this group");
    expect(markup).toContain("Group members");
    expect(markup).toContain("Account");
    expect(markup).toContain("My groups");
    expect(markup).toContain("Notification center");
    expect(markup).toContain("Group invitations");
    expect(markup).toContain("Voting reminders");
    expect(markup).toContain("Accept invite");
    expect(markup).toContain("Decline");
  });

  it("resolves browser paths back to the matching route", () => {
    expect(getRouteByPath("/").key).toBe("landing");
    expect(getRouteByPath("/signup").key).toBe("signup");
    expect(getRouteByPath("/app/orders").key).toBe("orders");
    expect(getRouteByPath("/app/orders/").key).toBe("orders");
    expect(getRouteByPath("/unknown").key).toBe("landing");
  });

  it("renders the public landing and sign-up entry routes", () => {
    const landingMarkup = renderToStaticMarkup(buildAppShell({ currentRouteKey: "landing" }));
    const signupMarkup = renderToStaticMarkup(buildAppShell({ currentRouteKey: "signup" }));

    expect(landingMarkup).toContain("groupictures");
    expect(landingMarkup).toContain("시작하기");
    expect(landingMarkup).toContain("로그인");
    expect(signupMarkup).toContain("groupictures signup");
    expect(signupMarkup).toContain("회원가입");
    expect(signupMarkup).toContain("로그인으로 이동");
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
