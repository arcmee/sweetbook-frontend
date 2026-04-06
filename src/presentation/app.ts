import { createElement, type ReactElement } from "react";

import type { PrototypeAuthSession } from "../application/prototype-auth";
import { AppShell } from "./app-shell";
import type { AppRouteKey } from "./routes";

type BuildAppShellOptions = {
  currentRouteKey?: AppRouteKey;
  initialSession?: PrototypeAuthSession | null;
};

export function buildAppShell(
  options: BuildAppShellOptions = {},
): ReactElement {
  return createElement(AppShell, {
    currentRouteKey: options.currentRouteKey,
    initialSession: options.initialSession,
  });
}
