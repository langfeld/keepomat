import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  root: "src/frontend",
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@frontend": resolve(__dirname, "src/frontend"),
      "@shared": resolve(__dirname, "src/shared"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        timeout: 120000,
      },
      "/keepomat.user.js": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: resolve(__dirname, "dist/frontend"),
    emptyOutDir: true,
  },
});
