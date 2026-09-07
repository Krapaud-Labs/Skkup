import { NextRequest, NextResponse } from "next/server";

/** Redirige l'ancien alias www vers l'hôte canonique du site. */
export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase();
  if (host !== "www.skkup.fr") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.hostname = "skkup.fr";
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: "/:path*",
};
