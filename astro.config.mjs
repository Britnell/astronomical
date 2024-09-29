import { defineConfig } from "astro/config";
import qwikdev from "@qwikdev/astro";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import vue from "@astrojs/vue";

import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  integrations: [
    qwikdev({
      include: ["**/qwik/*.tsx"],
    }),
    vue({
      include: ["**/vue/*.vue"],
    }),
    react({
      include: ["**/react/*.tsx"],
    }),
    tailwind(),
  ],
  output: "hybdrid",
  experimental: {
    serverIslands: true,
  },
  adapter: vercel(),
});
