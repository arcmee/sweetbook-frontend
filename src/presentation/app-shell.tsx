import type { ReactElement } from "react";

import {
  appRoutes,
  defaultRouteKey,
  getRouteByKey,
  type AppRouteKey,
} from "./routes";
import { PageSection } from "./ui/page-section";
import { PrimaryAction } from "./ui/primary-action";
import { StatePanel } from "./ui/state-panel";

type AppShellProps = {
  currentRouteKey?: AppRouteKey;
};

export function AppShell({
  currentRouteKey = defaultRouteKey,
}: AppShellProps): ReactElement {
  const currentRoute = getRouteByKey(currentRouteKey);

  return (
    <main>
      <header>
        <p>Prototype workspace</p>
        <h1>SweetBook</h1>
        <p>App shell, route boundaries, and shared UI foundation.</p>
      </header>

      <nav aria-label="Primary navigation">
        <ul>
          {appRoutes
            .filter((route) => route.showInNavigation)
            .map((route) => (
              <li key={route.key}>
                <a href={route.path}>{route.label}</a>
              </li>
            ))}
        </ul>
      </nav>

      <PageSection
        eyebrow={currentRoute.requiresAuth ? "Authenticated route" : "Public route"}
        title={currentRoute.title}
        description={currentRoute.description}
      >
        <PrimaryAction
          label={
            currentRoute.key === "login" ? "Continue to prototype login" : "Open workspace"
          }
        />
        <StatePanel
          tone="empty"
          title="Feature content arrives in later tasks"
          description="Authenticated routes stay behind the login boundary."
        />
      </PageSection>
    </main>
  );
}
