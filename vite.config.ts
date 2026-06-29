import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base must match the GitHub Pages sub-path (https://<user>.github.io/TOEIC-7000/).
// Override with BASE_PATH="/" for custom-domain / root deploys.
const base = process.env.BASE_PATH ?? "/TOEIC-7000/";

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: { target: "es2020" },
});
