import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { buildAppShell } from "./presentation/app";
import "./presentation/index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container #root was not found.");
}

createRoot(container).render(<StrictMode>{buildAppShell()}</StrictMode>);
