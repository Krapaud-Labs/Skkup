"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ErreurApi } from "@/lib/api";
import type { Plateforme } from "@/lib/streams";
import {
  INTERVALLE_HEARTBEAT_MS,
  envoyerHeartbeat,
  fermerSessionVisionnage,
  ouvrirSessionVisionnage,
} from "@/lib/watch-sessions";

/**
 * Orchestration d'une session de visionnage à partir de l'état du
 * lecteur : ouverture au premier démarrage de la lecture, heartbeats
 * périodiques tant que la lecture est en cours, clôture au démontage ou
 * au changement de stream.
 *
 * Le hook est volontairement indépendant de la plateforme du lecteur :
 * seul l'état booléen « en lecture » et la position l'intéressent, ce
 * qui permettra d'ajouter Twitch ou Facebook sans toucher à cette
 * logique.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type EtatSession = "inactive" | "ouverture" | "active" | "erreur";

interface OptionsSessionVisionnage {
  plateforme: Plateforme;
  identifiantChaine: string;
  enLecture: boolean;
  /** Lecture de la position courante au moment de l'envoi, sans re-rendu. */
  lirePosition: () => number;
}

interface RetourSessionVisionnage {
  etat: EtatSession;
  messageErreur: string | null;
  /** Points crédités depuis le début de la session, pour le retour visuel. */
  pointsCredites: number;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSessionVisionnage({
  plateforme,
  identifiantChaine,
  enLecture,
  lirePosition,
}: OptionsSessionVisionnage): RetourSessionVisionnage {
  const router = useRouter();

  const [etat, setEtat] = useState<EtatSession>("inactive");
  const [messageErreur, setMessageErreur] = useState<string | null>(null);
  const [pointsCredites, setPointsCredites] = useState(0);

  const sessionIdRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  // La lecture de la position passe par une ref pour que l'orchestration
  // ne se relance pas si le parent recrée la fonction entre deux rendus.
  const lirePositionRef = useRef(lirePosition);
  useEffect(() => {
    lirePositionRef.current = lirePosition;
  }, [lirePosition]);

  // L'arrêt est mémorisé dans une ref et non dans l'état : l'effet
  // d'orchestration ne doit pas se relancer à chaque changement d'état
  // visible, sous peine de recréer une session à chaque rendu.
  const arreteRef = useRef(false);

  /**
   * Une session invalidée ou expirée ne doit plus recevoir de heartbeat :
   * on coupe l'orchestration jusqu'au prochain changement de stream.
   */
  const arreterSurErreur = useCallback((message: string) => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    sessionIdRef.current = null;
    arreteRef.current = true;
    setEtat("erreur");
    setMessageErreur(message);
  }, []);

  // Le backend est seul juge de l'accès : une 401 signifie que le cookie
  // de session est absent ou expiré, on renvoie vers la connexion plutôt
  // que d'afficher une erreur technique.
  const traiterErreur = useCallback(
    (exception: unknown) => {
      if (exception instanceof ErreurApi && exception.statut === 401) {
        router.push("/connexion");
        return;
      }
      if (exception instanceof ErreurApi && exception.statut === 403) {
        arreterSurErreur(exception.message);
        return;
      }
      // 400 (intervalle jugé non plausible) et 409 (heartbeat concurrent)
      // sont transitoires : le serveur se resynchronise et le prochain
      // heartbeat repart sur une base saine, inutile d'alarmer l'usager.
      if (
        exception instanceof ErreurApi &&
        (exception.statut === 400 || exception.statut === 409)
      ) {
        return;
      }
      arreterSurErreur(
        exception instanceof ErreurApi
          ? exception.message
          : "Le suivi de ton visionnage est interrompu. Recharge la page.",
      );
    },
    [arreterSurErreur, router],
  );

  // ─── Ouverture et heartbeats ───────────────────────────────────────────────
  useEffect(() => {
    if (!enLecture || arreteRef.current) {
      return;
    }

    let annule = false;

    async function battre() {
      const sessionId = sessionIdRef.current;
      if (!sessionId) {
        return;
      }
      try {
        const reponse = await envoyerHeartbeat(
          sessionId,
          lirePositionRef.current(),
          true,
        );
        if (!annule && reponse.pointsCredites > 0) {
          setPointsCredites((total) => total + reponse.pointsCredites);
        }
      } catch (exception) {
        if (!annule) {
          traiterErreur(exception);
        }
      }
    }

    async function demarrer() {
      if (!sessionIdRef.current) {
        setEtat("ouverture");
        try {
          const session = await ouvrirSessionVisionnage(
            plateforme,
            identifiantChaine,
          );
          if (annule) {
            // Lecture arrêtée pendant l'ouverture : la session est déjà
            // créée côté serveur, il faut la refermer explicitement.
            void fermerSessionVisionnage(session.id).catch(() => undefined);
            return;
          }
          sessionIdRef.current = session.id;
        } catch (exception) {
          if (!annule) {
            traiterErreur(exception);
          }
          return;
        }
      }

      if (annule) {
        return;
      }
      setEtat("active");
      timerRef.current = window.setInterval(
        () => void battre(),
        INTERVALLE_HEARTBEAT_MS,
      );
    }

    void demarrer();

    return () => {
      annule = true;
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enLecture, identifiantChaine, plateforme, traiterErreur]);

  // ─── Clôture ───────────────────────────────────────────────────────────────
  // Au démontage comme au changement de stream : la session ouverte ne
  // doit jamais rester « en cours » côté serveur.
  useEffect(() => {
    return () => {
      const sessionId = sessionIdRef.current;
      sessionIdRef.current = null;
      if (sessionId) {
        void fermerSessionVisionnage(sessionId).catch(() => undefined);
      }
    };
  }, [identifiantChaine, plateforme]);

  return { etat, messageErreur, pointsCredites };
}
