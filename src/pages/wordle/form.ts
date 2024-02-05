import type { APIRoute } from "astro";
import { markGuess, readGameFromCookie } from "../../wordle";

export const prerender = false;

export const GET: APIRoute = ({ redirect }) => {
  return redirect("/wordle");
};

// params  for dynamic url
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const guess = form.get("guess") as string | null;
  const gameCookie = request.headers.get("cookie");
  if (!guess || !gameCookie) return redirect("/wordle");
  if (guess?.length !== 5) {
    return redirect("/wordle?guess=bad");
  }

  const game = readGameFromCookie(gameCookie);
  game.guesses.push(guess);
  game.marks.push(markGuess(guess, game.solution));

  return new Response("", {
    status: 302,
    headers: {
      "Set-Cookie": `game=${JSON.stringify(game)}; Path=/; Max-Age=3600`,
      Location: "/wordle",
    },
  });
  //   return new Response(" bad request", { status: 402 });
};
