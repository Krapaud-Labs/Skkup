/**
 * Endpoints consommés par l'extension, tels que définis dans
 * docs/04-api-contract.md (sections « Extension navigateur » et
 * « Visionnage »). Aucun champ n'est inventé ici : la forme des payloads
 * suit les DTO du backend (`extension/dto/pair.dto.ts`,
 * `watch-sessions/dto/*.dto.ts`).
 */

import { requeteApi } from "./api";
import type { Plateforme } from "./plateformes";

// ─── Appariement ─────────────────────────────────────────────────────────────

export interface ReponseAppariement {
  jetonExtension: string;
  expireAt: string;
  pseudo: string;
}

function objet(valeur: unknown): Record<string, unknown> {
  if (typeof valeur !== "object" || valeur === null || Array.isArray(valeur)) {
    throw new Error("Réponse API invalide.");
  }
  return valeur as Record<string, unknown>;
}

function reponseAppariement(valeur: unknown): ReponseAppariement {
  const corps = objet(valeur);
  if (
    typeof corps.jetonExtension !== "string" ||
    corps.jetonExtension.length < 32 ||
    corps.jetonExtension.length > 512 ||
    typeof corps.expireAt !== "string" ||
    Number.isNaN(Date.parse(corps.expireAt)) ||
    typeof corps.pseudo !== "string" ||
    corps.pseudo.length > 100
  ) {
    throw new Error("Réponse API invalide.");
  }
  return {
    jetonExtension: corps.jetonExtension,
    expireAt: corps.expireAt,
    pseudo: corps.pseudo,
  };
}

/**
 * Échange le code affiché sur le site contre le jeton de l'extension.
 * La route n'est pas authentifiée : le code est le seul secret présenté,
 * et un code inconnu, expiré ou déjà consommé donne le même 401.
 */
export function apparier(code: string): Promise<ReponseAppariement> {
  return requeteApi<unknown>("/extension/pair", {
    methode: "POST",
    corps: { code },
  }).then(reponseAppariement);
}

// ─── Sessions de visionnage ──────────────────────────────────────────────────

export type StatutSession = "EN_COURS" | "TERMINEE" | "INVALIDEE";

export interface SessionVisionnage {
  id: string;
  platform: Plateforme;
  streamExternalId: string;
  statut: StatutSession;
}

export interface ReponseHeartbeat {
  session: SessionVisionnage;
  pointsCredites: number;
}

export function ouvrirSession(
  jeton: string,
  plateforme: Plateforme,
  identifiantChaine: string,
): Promise<SessionVisionnage> {
  return requeteApi<SessionVisionnage>("/watch-sessions", {
    methode: "POST",
    jeton,
    corps: { platform: plateforme, streamExternalId: identifiantChaine },
  });
}

/**
 * La position de lecture n'est transmise que pour la traçabilité : la
 * durée créditée est recalculée côté serveur depuis ses propres
 * horodatages, jamais depuis cette valeur.
 */
export function envoyerHeartbeat(
  jeton: string,
  sessionId: string,
  positionLectureSecondes: number,
  enLecture: boolean,
): Promise<ReponseHeartbeat> {
  return requeteApi<ReponseHeartbeat>(
    `/watch-sessions/${encodeURIComponent(sessionId)}/heartbeat`,
    {
      methode: "POST",
      jeton,
      corps: {
        positionLectureSecondes: Math.max(
          0,
          Math.floor(positionLectureSecondes),
        ),
        enLecture,
      },
    },
  );
}

export function fermerSession(
  jeton: string,
  sessionId: string,
): Promise<SessionVisionnage> {
  return requeteApi<SessionVisionnage>(
    `/watch-sessions/${encodeURIComponent(sessionId)}/close`,
    { methode: "POST", jeton },
  );
}
