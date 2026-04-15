import { defineConfig, loadEnv } from "vite";
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || "http://localhost:8080";

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 3000,
      strictPort: true,
      open: true,
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, "/api"),
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            mui: ["@emotion/react", "@emotion/styled", "@mui/material"],
          },
        },
      },
    },
    test: {
      environment: "happy-dom",
      globals: true,
      setupFiles: "./src/setupTests.ts",
      css: false,
      testTimeout: 30000,
    },
    env: {
      apiUrl: `${apiProxyTarget}/api`,
    },
  };
});
