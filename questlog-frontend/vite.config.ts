import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@backend": path.resolve(__dirname, "../questlog-backend"),
    },
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "unsafe-none",
    },
    proxy: {
      "/api/discord": {
        target: "https://discord.com/api",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/discord/, ""),
        headers: {
          "User-Agent": "DiscordBot (https://questlog.app, 1.0.0)",
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
});
