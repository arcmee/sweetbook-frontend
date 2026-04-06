import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendProxyTarget = env.BACKEND_PROXY_TARGET ?? "http://localhost:3000";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: backendProxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
