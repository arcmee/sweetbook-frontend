import { useEffect, useState, type MouseEvent, type ReactElement } from "react";

import type { PrototypeAuthSession } from "../application/prototype-auth";
import {
  getDefaultPrototypeWorkspaceSnapshot,
  getPrototypeCandidateReviewViewModel,
  getPrototypeOrderEntryViewModel,
  getPrototypePhotoWorkflowViewModel,
  getPrototypeWorkspaceViewModel,
} from "../application/prototype-workspace";
import type { PrototypeWorkspaceSnapshot } from "../application/prototype-workspace-snapshot";
import {
  fetchPrototypeAuthSession,
  fetchPrototypeWorkspaceSnapshot,
  requestPrototypeEventCreate,
  requestPrototypeAuthLogout,
  requestPrototypeGroupCreate,
} from "../data/prototype-api-client";
import {
  appRoutes,
  defaultRouteKey,
  getRouteByKey,
  getRouteByPath,
  type AppRouteKey,
} from "./routes";
import { AlbumCandidateScreen } from "./screens/album-candidate-screen";
import { EventScreen } from "./screens/event-screen";
import { GroupScreen } from "./screens/group-screen";
import { LoginScreen } from "./screens/login-screen";
import { OrderHandoffScreen } from "./screens/order-handoff-screen";
import { PageSection } from "./ui/page-section";
import { PrimaryAction } from "./ui/primary-action";
import { StatePanel } from "./ui/state-panel";

type AppShellProps = {
  currentRouteKey?: AppRouteKey;
  initialSession?: PrototypeAuthSession | null;
};

const prototypeTokenStorageKey = "sweetbook.prototype.token";

export function AppShell({
  currentRouteKey,
  initialSession = null,
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
  const [session, setSession] = useState<PrototypeAuthSession | null>(initialSession);
  const [authPending, setAuthPending] = useState(false);
  const [workspaceSnapshot, setWorkspaceSnapshot] = useState<PrototypeWorkspaceSnapshot>(
    getDefaultPrototypeWorkspaceSnapshot(),
  );
  const [workspacePending, setWorkspacePending] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [workspaceSuccess, setWorkspaceSuccess] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [createGroupName, setCreateGroupName] = useState("");
  const [createEventTitle, setCreateEventTitle] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const token = window.localStorage.getItem(prototypeTokenStorageKey);
    if (!token) {
      setSession(null);
      setAuthPending(false);
      return;
    }

    setAuthPending(true);
    void fetchPrototypeAuthSession(token)
      .then((nextSession) => {
        setSession(nextSession);
      })
      .catch(() => {
        window.localStorage.removeItem(prototypeTokenStorageKey);
        setSession(null);
      })
      .finally(() => {
        setAuthPending(false);
      });
  }, []);

  const currentRoute = getRouteByKey(activeRouteKey);
  const workspace = getPrototypeWorkspaceViewModel(workspaceSnapshot);
  const activeGroup =
    workspace.groups.find((group) => group.id === selectedGroupId) ?? workspace.groups[0];
  const scopedEvents = activeGroup
    ? workspace.events.filter((event) => event.groupName === activeGroup.name)
    : workspace.events;
  const activeEvent =
    scopedEvents.find((event) => event.id === selectedEventId) ?? scopedEvents[0] ?? workspace.events[0];
  const activeEventId = activeEvent?.id ?? "";
  const workflow = resolveWorkspaceSlice(activeEventId, () =>
    getPrototypePhotoWorkflowViewModel(activeEventId, workspaceSnapshot),
  );
  const review = resolveWorkspaceSlice(activeEventId, () =>
    getPrototypeCandidateReviewViewModel(activeEventId, workspaceSnapshot),
  );
  const orderEntry = resolveWorkspaceSlice(activeEventId, () =>
    getPrototypeOrderEntryViewModel(activeEventId, workspaceSnapshot),
  );

  async function refreshWorkspace(): Promise<void> {
    setWorkspacePending(true);
    setWorkspaceError(null);
    try {
      const snapshot = await fetchPrototypeWorkspaceSnapshot();
      setWorkspaceSnapshot(snapshot);
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    } finally {
      setWorkspacePending(false);
    }
  }

  useEffect(() => {
    if (!session) {
      setWorkspaceSnapshot(getDefaultPrototypeWorkspaceSnapshot());
      setWorkspacePending(false);
      setWorkspaceError(null);
      setWorkspaceSuccess(null);
      setSelectedGroupId(null);
      setSelectedEventId(null);
      return;
    }

    void refreshWorkspace();
  }, [session]);

  useEffect(() => {
    const nextGroup =
      workspace.groups.find((group) => group.id === selectedGroupId) ?? workspace.groups[0];
    if (nextGroup && nextGroup.id !== selectedGroupId) {
      setSelectedGroupId(nextGroup.id);
      return;
    }

    if (!nextGroup) {
      setSelectedGroupId(null);
    }

    const nextScopedEvents = nextGroup
      ? workspace.events.filter((event) => event.groupName === nextGroup.name)
      : workspace.events;
    const nextEvent =
      nextScopedEvents.find((event) => event.id === selectedEventId) ?? nextScopedEvents[0];

    if (nextEvent && nextEvent.id !== selectedEventId) {
      setSelectedEventId(nextEvent.id);
      return;
    }

    if (!nextEvent) {
      setSelectedEventId(null);
    }
  }, [selectedEventId, selectedGroupId, workspace.events, workspace.groups]);

  async function handleCreateGroup(): Promise<void> {
    const nextGroupName = createGroupName.trim();
    if (!nextGroupName) {
      setWorkspaceError("A group name is required.");
      return;
    }

    try {
      setIsCreatingGroup(true);
      setWorkspaceSuccess(null);
      await requestPrototypeGroupCreate({
        name: nextGroupName,
      });
      await refreshWorkspace();
      setCreateGroupName("");
      setWorkspaceSuccess(`Created group ${nextGroupName}.`);
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreatingGroup(false);
    }
  }

  async function handleCreateEvent(): Promise<void> {
    const targetGroup = activeGroup;
    if (!targetGroup) {
      setWorkspaceError("A group is required before creating a prototype event.");
      return;
    }

    const nextEventTitle = createEventTitle.trim();
    if (!nextEventTitle) {
      setWorkspaceError("An event title is required.");
      return;
    }

    try {
      setIsCreatingEvent(true);
      setWorkspaceSuccess(null);
      await requestPrototypeEventCreate({
        groupId: targetGroup.id,
        title: nextEventTitle,
      });
      await refreshWorkspace();
      setCreateEventTitle("");
      setWorkspaceSuccess(`Created event ${nextEventTitle}.`);
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreatingEvent(false);
    }
  }

  function handleSelectGroup(groupId: string): void {
    setSelectedGroupId(groupId);
    const nextGroup = workspace.groups.find((group) => group.id === groupId);
    const nextEvent = workspace.events.find((event) => event.groupName === nextGroup?.name);
    setSelectedEventId(nextEvent?.id ?? null);
  }

  function handleSelectEvent(eventId: string): void {
    setSelectedEventId(eventId);
    const nextEvent = workspace.events.find((event) => event.id === eventId);
    const nextGroup = workspace.groups.find((group) => group.name === nextEvent?.groupName);
    if (nextGroup) {
      setSelectedGroupId(nextGroup.id);
    }
  }

  function navigateTo(routeKey: AppRouteKey): void {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", getRouteByKey(routeKey).path);
    }

    setActiveRouteKey(routeKey);
  }

  function handleNavigation(
    event: MouseEvent<HTMLAnchorElement>,
    routeKey: AppRouteKey,
  ): void {
    if (typeof window === "undefined") {
      return;
    }

    event.preventDefault();
    navigateTo(routeKey);
  }

  function handleLogin(nextSession: PrototypeAuthSession): void {
    setSession(nextSession);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(prototypeTokenStorageKey, nextSession.token);
    }

    navigateTo("dashboard");
  }

  async function handleLogout(): Promise<void> {
    const token = session?.token;

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(prototypeTokenStorageKey);
    }

    setSession(null);
    navigateTo("login");

    if (token) {
      await requestPrototypeAuthLogout(token);
    }
  }

  if (authPending) {
    return (
      <main>
        <StatePanel
          tone="loading"
          title="Restoring prototype session"
          description="Checking the saved prototype login before opening protected routes."
        />
      </main>
    );
  }

  if (currentRoute.requiresAuth && !session) {
    return (
      <main>
        <LoginScreen onLogin={handleLogin} />
      </main>
    );
  }

  return (
    <main>
      <header>
        <p>Prototype workspace</p>
        <h1>SweetBook</h1>
        <p>App shell, route boundaries, and shared UI foundation.</p>
        {session ? <p>Signed in as {session.user.displayName}</p> : null}
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

      {session ? <PrimaryAction label="Sign out" onClick={handleLogout} /> : null}

      {workspacePending ? (
        <StatePanel
          tone="loading"
          title="Refreshing workspace"
          description="Loading the latest prototype workspace snapshot from the backend."
        />
      ) : null}
      {workspaceError ? (
        <StatePanel
          tone="error"
          title="Workspace refresh failed"
          description={workspaceError}
        />
      ) : null}
      {workspaceSuccess ? (
        <StatePanel
          tone="success"
          title="Workspace updated"
          description={workspaceSuccess}
        />
      ) : null}

      {currentRoute.key === "login" ? (
        <LoginScreen onLogin={handleLogin} />
      ) : null}

      {currentRoute.key === "groups" ? (
        <GroupScreen
          workspace={workspace}
          createGroupName={createGroupName}
          isCreatingGroup={isCreatingGroup}
          onCreateGroup={handleCreateGroup}
          onCreateGroupNameChange={setCreateGroupName}
          onSelectGroup={handleSelectGroup}
          selectedGroupId={activeGroup?.id}
        />
      ) : null}

      {currentRoute.key === "events" ? (
        <EventScreen
          workspace={workspace}
          createEventTitle={createEventTitle}
          isCreatingEvent={isCreatingEvent}
          selectedEventId={activeEvent?.id}
          selectedGroupName={activeGroup?.name}
          workflow={workflow}
          onCreateEvent={handleCreateEvent}
          onCreateEventTitleChange={setCreateEventTitle}
          onSelectEvent={handleSelectEvent}
        />
      ) : null}

      {currentRoute.key === "albums" ? (
        <AlbumCandidateScreen
          workspace={workspace}
          review={review}
          activeGroupName={activeGroup?.name}
          activeEventName={activeEvent?.name}
        />
      ) : null}

      {currentRoute.key === "orders" ? (
        <OrderHandoffScreen
          workspace={workspace}
          orderEntry={orderEntry}
          activeGroupName={activeGroup?.name}
        />
      ) : null}

      {currentRoute.key !== "groups" &&
      currentRoute.key !== "events" &&
      currentRoute.key !== "albums" &&
      currentRoute.key !== "orders" &&
      currentRoute.key !== "login" ? (
        <PageSection
          eyebrow={currentRoute.requiresAuth ? "Authenticated route" : "Public route"}
          title={currentRoute.title}
          description={currentRoute.description}
        >
          <PrimaryAction label="Open workspace" />
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

function resolveWorkspaceSlice<T>(
  eventId: string,
  resolver: () => T,
): T | undefined {
  if (!eventId) {
    return undefined;
  }

  try {
    return resolver();
  } catch {
    return undefined;
  }
}
