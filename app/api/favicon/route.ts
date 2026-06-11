import { API_BASE_URL } from "@/lib/api";

export const dynamic = "force-dynamic";

const ORGANIZATION_PROFILE_URL = `${API_BASE_URL}/organization-profiles/current/`;

type OrganizationProfileResponse = {
  logo?: string | null;
  logo_url?: string | null;
};

export async function GET(request: Request) {
  const fallbackUrl = new URL("/favicon.ico", request.url);

  try {
    const profileResponse = await fetch(ORGANIZATION_PROFILE_URL, {
      cache: "no-store",
    });

    if (!profileResponse.ok) {
      return Response.redirect(fallbackUrl, 307);
    }

    const profile = (await profileResponse.json()) as OrganizationProfileResponse;
    const logoUrl = profile.logo_url || profile.logo || "";

    if (!logoUrl) {
      return Response.redirect(fallbackUrl, 307);
    }

    const imageResponse = await fetch(logoUrl, {
      cache: "no-store",
    });

    if (!imageResponse.ok) {
      return Response.redirect(fallbackUrl, 307);
    }

    const contentType = imageResponse.headers.get("content-type") || "image/png";
    const imageBytes = await imageResponse.arrayBuffer();

    return new Response(imageBytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch {
    return Response.redirect(fallbackUrl, 307);
  }
}
