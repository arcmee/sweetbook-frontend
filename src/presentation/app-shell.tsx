import { useEffect, useState, type MouseEvent, type ReactElement } from "react";

import { getPrototypeWorkspaceViewModel } from "../application/prototype-workspace";
import {
  appRoutes,
  defaultRouteKey,
  getRouteByPath,
  getRouteByKey,
  type AppRouteKey,
} from "./routes";
import { AlbumCandidateScreen } from "./screens/album-candidate-screen";
import { EventScreen } from "./screens/event-screen";
import { GroupScreen } from "./screens/group-screen";
import { OrderHandoffScreen } from "./screens/order-handoff-screen";
import { PageSection } from "./ui/page-section";
import { PrimaryAction } from "./ui/primary-action";
import { StatePanel } from "./ui/state-panel";

type AppShellProps = {
  currentRouteKey?: AppRouteKey;
};

export function AppShell({
  currentRouteKey,
}: AppShellProps): ReactElement {
  const [activeRouteKey, setActiveRouteKey] = useState<AppRouteKey>(() => {
    if (currentRouteKey) {
      return currentRouteKey;
    }

    if (typeof window === "undefined") {
      return defaultRouteKey;
    }

    return getRouteByPath(window.location.pathname).key;
  });

  useEffect(() => {
    if (currentRouteKey) {
      setActiveRouteKey(currentRouteKey);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const syncRouteFromLocation = () => {
      setActiveRouteKey(getRouteByPath(window.location.pathname).key);
    };

    syncRouteFromLocation();
    window.addEventListener("popstate", syncRouteFromLocation);

    return () => {
      window.removeEventListener("popstate", syncRouteFromLocation);
    };
  }, [currentRouteKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.location.pathname === "/") {
      window.history.replaceState({}, "", getRouteByKey(activeRouteKey).path);
    }
  }, [activeRouteKey]);

  const currentRoute = getRouteByKey(activeRouteKey);
  const workspace = getPrototypeWorkspaceViewModel();

  function handleNavigation(
    event: MouseEvent<HTMLAnchorElement>,
    routeKey: AppRouteKey,
  ): void {
    if (typeof window === "undefined") {
      return;
    }

    event.preventDefault();
    const route = getRouteByKey(routeKey);
    window.history.pushState({}, "", route.path);
    setActiveRouteKey(routeKey);
  }

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
                <a
                  href={route.path}
                  aria-current={currentRoute.key === route.key ? "page" : undefined}
                  onClick={(event) => handleNavigation(event, route.key)}
                >
                  {route.label}
                </a>
              </li>
            ))}
        </ul>
      </nav>

      {currentRoute.key === "groups" ? (
        <GroupScreen workspace={workspace} />
      ) : null}

      {currentRoute.key === "events" ? (
        <EventScreen workspace={workspace} />
      ) : null}

      {currentRoute.key === "albums" ? (
        <AlbumCandidateScreen workspace={workspace} />
      ) : null}

      {currentRoute.key === "orders" ? (
        <OrderHandoffScreen workspace={workspace} />
      ) : null}

      {currentRoute.key !== "groups" &&
      currentRoute.key !== "events" &&
      currentRoute.key !== "albums" &&
      currentRoute.key !== "orders" ? (
        <PageSection
          eyebrow={currentRoute.requiresAuth ? "Authenticated route" : "Public route"}
          title={currentRoute.title}
          description={currentRoute.description}
        >
          <PrimaryAction
            label={
              currentRoute.key === "login"
                ? "Continue to prototype login"
                : "Open workspace"
            }
          />
          <StatePanel
            tone="empty"
            title="Feature content arrives in later tasks"
            description="Authenticated routes stay behind the login boundary."
          />
        </PageSection>
      ) : null}
    </main>
  );
}
