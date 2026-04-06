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
    label: "Home",
    title: "Group voting dashboard",
    description: "Review active group voting events from the main landing page.",
    requiresAuth: true,
    showInNavigation: true,
  },
  {
    key: "groups",
    path: "/app/groups",
    label: "Group",
    title: "Group page",
    description: "Review a single group's events, members, and management actions.",
    requiresAuth: true,
    showInNavigation: true,
  },
  {
    key: "events",
    path: "/app/events",
    label: "Event",
    title: "Event page",
    description: "Upload event photos and gather likes from group members.",
    requiresAuth: true,
    showInNavigation: true,
  },
  {
    key: "albums",
    path: "/app/albums",
    label: "Selection",
    title: "Photo selection",
    description: "The owner uses this route to confirm the final album photo set.",
    requiresAuth: true,
    showInNavigation: true,
  },
  {
    key: "orders",
    path: "/app/orders",
    label: "Order",
    title: "Order handoff",
    description: "Review the owner-selected set before finishing the SweetBook order.",
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

export function getRouteByPath(pathname: string): AppRoute {
  const normalizedPathname = pathname.replace(/\/$/, "") || "/";
  const route =
    appRoutes.find((item) => item.path === normalizedPathname) ??
    appRoutes.find((item) => item.path === pathname);

  if (!route) {
    return getRouteByKey(defaultRouteKey);
  }

  return route;
}
