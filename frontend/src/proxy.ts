import { NextRequest, NextResponse } from "next/server";

/** Redirige l'ancien alias www vers l'hôte canonique du site. */
export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase();
  if (host !== "www.skkup.fr") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  // Dokploy/Traefik peut transmettre le port interne dans l'en-tête Host.
  // La redirection publique doit rester sur HTTPS sans exposer ce port.
  url.hostname = "skkup.fr";
  url.protocol = "https:";
  url.port = "";
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: "/:path*",
};
