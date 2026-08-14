"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import {
  ORIGINE_YOUTUBE,
  interpreterMessageYouTube,
  messagesAbonnementYouTube,
  urlEmbarquementYouTube,
  type EtatLecteur,
} from "@/lib/lecteur-youtube";

/**
 * Lecteur YouTube embarqué : affiche le direct d'une chaîne et remonte
 * l'état de lecture au composant parent, qui se charge de la session de
 * visionnage. Ce composant ne connaît ni l'API ni les points : il ne fait
 * que traduire les événements du lecteur.
 */

interface LecteurYouTubeProps {
  identifiantChaine: string;
  titre: string;
  onEtat: (etat: EtatLecteur) => void;
}

// Le lecteur ignore la poignée de main tant qu'il n'est pas initialisé :
// on la répète quelques fois après le chargement de l'iframe, puis on
// abandonne pour ne pas laisser tourner un timer inutile.
const INTERVALLE_POIGNEE_DE_MAIN_MS = 500;
const TENTATIVES_POIGNEE_DE_MAIN = 10;

export function LecteurYouTube({
  identifiantChaine,
  titre,
  onEtat,
}: LecteurYouTubeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const abonneRef = useRef(false);
  const timerPoigneeRef = useRef<number | null>(null);

  // Conservé dans une ref pour que la souscription postMessage ne soit
  // pas recréée à chaque rendu du parent.
  const onEtatRef = useRef(onEtat);
  useEffect(() => {
    onEtatRef.current = onEtat;
  }, [onEtat]);

  const envoyerAbonnement = useCallback(() => {
    const fenetre = iframeRef.current?.contentWindow;
    if (!fenetre) {
      return;
    }
    for (const message of messagesAbonnementYouTube) {
      fenetre.postMessage(JSON.stringify(message), ORIGINE_YOUTUBE);
    }
  }, []);

  // ─── Réception des messages du lecteur ─────────────────────────────────────
  useEffect(() => {
    function surMessage(evenement: MessageEvent) {
      // Double contrôle : l'origine annoncée et la fenêtre émettrice.
      // Sans cela, n'importe quelle page ouverte pourrait injecter un
      // faux état « en lecture » et déclencher des heartbeats.
      if (evenement.origin !== ORIGINE_YOUTUBE) {
        return;
      }
      const sourceAttendue = iframeRef.current?.contentWindow;
      if (!sourceAttendue || evenement.source !== sourceAttendue) {
        return;
      }

      const etat = interpreterMessageYouTube(evenement.data);
      if (etat) {
        abonneRef.current = true;
        onEtatRef.current(etat);
      }
    }

    window.addEventListener("message", surMessage);
    return () => window.removeEventListener("message", surMessage);
  }, []);

  useEffect(
    () => () => {
      if (timerPoigneeRef.current !== null) {
        window.clearInterval(timerPoigneeRef.current);
      }
    },
    [],
  );

  // ─── Poignée de main ───────────────────────────────────────────────────────
  const surChargement = useCallback(() => {
    if (timerPoigneeRef.current !== null) {
      window.clearInterval(timerPoigneeRef.current);
    }
    abonneRef.current = false;
    let tentatives = 0;
    envoyerAbonnement();

    timerPoigneeRef.current = window.setInterval(() => {
      tentatives += 1;
      if (abonneRef.current || tentatives >= TENTATIVES_POIGNEE_DE_MAIN) {
        if (timerPoigneeRef.current !== null) {
          window.clearInterval(timerPoigneeRef.current);
          timerPoigneeRef.current = null;
        }
        return;
      }
      envoyerAbonnement();
    }, INTERVALLE_POIGNEE_DE_MAIN_MS);
  }, [envoyerAbonnement]);

  // L'URL dépend de l'origine réelle du navigateur : l'iframe n'est donc
  // montée qu'après l'hydratation, pour ne pas rendre côté serveur une
  // URL différente de celle du client. L'origine ne changeant jamais, la
  // souscription est vide.
  const origine = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => null,
  );

  return (
    <div className="aspect-video w-full overflow-hidden rounded-carte bg-black/40">
      {origine === null ? (
        <p className="flex h-full items-center justify-center text-sm text-foreground-muted">
          Chargement du lecteur...
        </p>
      ) : (
        <iframe
          ref={iframeRef}
          className="h-full w-full"
          src={urlEmbarquementYouTube(identifiantChaine, origine)}
          title={`Lecteur YouTube : ${titre}`}
          onLoad={surChargement}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          // Le bac à sable ne concède que ce dont le lecteur a besoin
          // pour fonctionner ; allow-same-origin le laisse dans l'origine
          // youtube.com, sans aucun accès à la nôtre.
          sandbox="allow-scripts allow-same-origin allow-presentation"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </div>
  );
}
