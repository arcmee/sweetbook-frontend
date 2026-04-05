import { createElement, type ReactElement } from "react";

import { AppShell } from "./app-shell";

export function buildAppShell(): ReactElement {
  return createElement(AppShell);
}
