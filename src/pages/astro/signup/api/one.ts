import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const postcode = form.get("postcode");

  if (!postcode) return redirect("/astro/signup?error=empty");
  console.log(" POST", form.entries());

  return redirect("/astro/signup/code");
};
