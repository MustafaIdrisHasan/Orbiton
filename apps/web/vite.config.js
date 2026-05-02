import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all local addresses so http://127.0.0.1:5173 and automation
    // health checks work (default was IPv6-only ::1 on some Windows setups).
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true
      }
    }
  }
});

