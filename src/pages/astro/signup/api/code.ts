import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const postcode = form.get("postcode");
  if (!postcode) return redirect("/astro/signup?error=empty");

  const name = form.get("name");
  const phone = form.get("phone");
  if (!name || !phone) return redirect("/astro/signup/one?error=missing");

  const code = form.get("code") as string | null;
  if (!code) return redirect("/astro/signup/code?error=missing");
  if (!code.includes("x")) return redirect("/astro/signup/code?error=invalid");

  return redirect("/astro/signup/review");
};
