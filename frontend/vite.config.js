import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Ambiente local: o navegador acessa /api e o Vite encaminha ao Express.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    proxy: { "/api": "http://127.0.0.1:3001" },
  },
});
