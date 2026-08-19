import { fetchAuthentifie } from "./auth";
import type { Plateforme } from "./streams";

/**
 * Sessions de visionnage : ouverture, heartbeats, clôture.
 *
 * Ces trois endpoints exigent une session authentifiée, d'où
 * fetchAuthentifie (cookie httpOnly, voir lib/auth.ts). Le frontend ne
 * décide de rien : il déclare ce que fait le lecteur, le backend valide
 * la cohérence temporelle et crédite les points
 * (docs/04-api-contract.md, section Visionnage).
 */

// ─── Fréquence des heartbeats ────────────────────────────────────────────────

/**
 * Le backend attend un heartbeat toutes les 30 secondes et rejette tout
 * intervalle supérieur à 3x cette valeur
 * (backend/src/watch-sessions/watch-sessions.service.ts). La constante est
 * donc alignée sur le serveur, pas choisie librement côté client.
 */
export const INTERVALLE_HEARTBEAT_MS = 30_000;

// ─── Types du contrat ────────────────────────────────────────────────────────

export interface SessionVisionnage {
  id: string;
  platform: Plateforme;
  streamExternalId: string;
  statut: "EN_COURS" | "TERMINEE" | "INVALIDEE";
}

export interface ReponseHeartbeat {
  session: SessionVisionnage;
  pointsCredites: number;
}

// ─── Requêtes ────────────────────────────────────────────────────────────────

export function ouvrirSessionVisionnage(
  plateforme: Plateforme,
  identifiantChaine: string,
): Promise<SessionVisionnage> {
  return fetchAuthentifie<SessionVisionnage>("/watch-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      platform: plateforme,
      streamExternalId: identifiantChaine,
    }),
  });
}

/**
 * La position de lecture n'est envoyée qu'à des fins de traçabilité : la
 * durée créditée est recalculée côté serveur à partir de ses propres
 * horodatages, jamais à partir de cette valeur.
 */
export function envoyerHeartbeat(
  sessionId: string,
  positionLectureSecondes: number,
  enLecture: boolean,
): Promise<ReponseHeartbeat> {
  return fetchAuthentifie<ReponseHeartbeat>(
    `/watch-sessions/${encodeURIComponent(sessionId)}/heartbeat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        positionLectureSecondes: Math.max(
          0,
          Math.floor(positionLectureSecondes),
        ),
        enLecture,
      }),
    },
  );
}

export function fermerSessionVisionnage(
  sessionId: string,
): Promise<SessionVisionnage> {
  return fetchAuthentifie<SessionVisionnage>(
    `/watch-sessions/${encodeURIComponent(sessionId)}/close`,
    { method: "POST" },
  );
}
