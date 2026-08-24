import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Tailwind v4 is configured entirely through this plugin + the @theme block
// in src/index.css - there is deliberately no tailwind.config.js or
// postcss.config.js in this project. That's the current (v4) way of doing
// it: the old JS config file and PostCSS setup were replaced by CSS-native
// configuration, which is simpler and keeps design tokens next to the CSS
// that uses them.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173
  }
});
