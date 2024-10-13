import type { APIRoute } from "astro";

export const prerender = false;

const getpostcode = (pc: string) =>
  fetch(`http://api.postcodes.io/postcodes/${pc}`).then((res) => res.json());

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const postcode = form.get("postcode") as string | null;
  if (!postcode) return redirect("/astro/signup?error=empty");

  const valid = await getpostcode(postcode);
  if (valid.error) return redirect("/astro/signup?error=invalid");

  return redirect("/astro/signup/one");
};
