export type AppRouteKey =
  | "login"
  | "dashboard"
  | "groups"
  | "events"
  | "albums"
  | "orders";

export type AppRoute = {
  key: AppRouteKey;
  path: string;
  label: string;
  title: string;
  description: string;
  requiresAuth: boolean;
  showInNavigation: boolean;
};

export const appRoutes: AppRoute[] = [
  {
    key: "login",
    path: "/login",
    label: "Login",
    title: "Sign in to SweetBook",
    description: "Prototype login will use an ID and password entry flow.",
    requiresAuth: false,
    showInNavigation: true,
  },
  {
    key: "dashboard",
    path: "/app",
    label: "Dashboard",
    title: "Prototype dashboard",
    description: "This shell gives later feature screens a shared landing point.",
    requiresAuth: true,
    showInNavigation: true,
  },
  {
    key: "groups",
    path: "/app/groups",
    label: "Groups",
    title: "Group workspace",
    description: "Create and manage family groups from a stable route boundary.",
    requiresAuth: true,
    showInNavigation: true,
  },
  {
    key: "events",
    path: "/app/events",
    label: "Events",
    title: "Event timeline",
    description: "Event creation and review screens will plug into this route later.",
    requiresAuth: true,
    showInNavigation: true,
  },
  {
    key: "albums",
    path: "/app/albums",
    label: "Albums",
    title: "Album candidates",
    description: "Album review and selection pages will inherit this page frame.",
    requiresAuth: true,
    showInNavigation: true,
  },
  {
    key: "orders",
    path: "/app/orders",
    label: "Orders",
    title: "Order handoff",
    description: "SweetBook order status and final handoff will live here.",
    requiresAuth: true,
    showInNavigation: true,
  },
];

export const defaultRouteKey: AppRouteKey = "login";

export function getRouteByKey(routeKey: AppRouteKey): AppRoute {
  const route = appRoutes.find((item) => item.key === routeKey);

  if (!route) {
    throw new Error(`Unknown route: ${routeKey}`);
  }

  return route;
}
