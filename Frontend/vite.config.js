import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: "pages",
  build: {
    outDir: "../dist",
  },
  envDir: path.resolve(__dirname, ".."),
});
