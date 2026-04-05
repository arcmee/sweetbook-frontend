import { createElement, type ReactElement } from "react";

import { AppShell } from "./app-shell";
import { defaultRouteKey, type AppRouteKey } from "./routes";

type BuildAppShellOptions = {
  currentRouteKey?: AppRouteKey;
};

export function buildAppShell(
  options: BuildAppShellOptions = {},
): ReactElement {
  return createElement(AppShell, {
    currentRouteKey: options.currentRouteKey ?? defaultRouteKey,
  });
}
