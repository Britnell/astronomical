import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = ({}) => {
  return new Response(
    "very joke haha",
    // `<p id="joke">Very joke, much funny ha</p>`,
    {
      status: 200,
    }
  );
};
