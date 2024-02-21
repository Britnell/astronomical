import { defineConfig } from "astro/config";
import qwikdev from "@qwikdev/astro";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import vue from "@astrojs/vue";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  integrations: [
    qwikdev({
      include: ["src/qwik/*"],
    }),
    vue({
      include: ["src/vue/*"],
    }),
    react({
      include: ["src/react/*"],
    }),
    tailwind(),
  ],
  output: "hybrid",
  adapter: node({
    mode: "standalone",
  }),
});
