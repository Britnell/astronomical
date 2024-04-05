import type { APIRoute } from "astro";

let count = 0;

export const GET: APIRoute = () => {
  count++;
  return new Response(JSON.stringify({ count }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
