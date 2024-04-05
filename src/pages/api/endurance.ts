import type { APIRoute } from "astro";

let count = 0;

export const GET: APIRoute = (req) => {
  count++;
  console.log(" count ", count);
  return new Response(`count: ${count}`, {
    status: 200,
  });
};
