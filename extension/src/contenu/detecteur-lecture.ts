/**
 * Détection de l'état de lecture du lecteur natif d'une plateforme.
 *
 * Le module ne connaît ni Twitch, ni YouTube, ni Facebook : les trois
 * plateformes s'appuient sur un élément média HTML, et c'est le seul
 * contrat dont on dépend ici. Il n'utilise pas non plus les types du DOM
 * directement, afin de rester vérifiable sans navigateur : un élément
 * vidéo réel satisfait naturellement `ElementLecture`.
 *
 * Le temps ne compte que si l'utilisateur est effectivement devant la
 * page : un direct qui tourne dans un onglet d'arrière-plan ne doit rien
 * créditer, c'est la règle anti-fraude de docs/05-security.md. La
 * visibilité est fournie par l'appelant plutôt que lue ici, pour que
 * cette condition soit testable elle aussi.
 */

// ─── Contrat minimal attendu d'un lecteur ─────────────────────────────────────

export interface ElementLecture {
  readonly paused: boolean;
  readonly ended: boolean;
  readonly currentTime: number;
  addEventListener(type: string, ecouteur: () => void): void;
  removeEventListener(type: string, ecouteur: () => void): void;
}

export interface EtatLecture {
  enLecture: boolean;
  positionSecondes: number;
}

/**
 * Événements média qui changent l'état observable. `waiting` (mise en
 * mémoire tampon) et `stalled` sont inclus parce qu'un direct interrompu
 * réseau reste `paused === false` : sans eux, une coupure passerait pour
 * du visionnage.
 */
const EVENEMENTS_SURVEILLES = [
  "play",
  "playing",
  "pause",
  "ended",
  "waiting",
  "stalled",
  "emptied",
  "seeked",
] as const;

// ─── Détecteur ────────────────────────────────────────────────────────────────

export interface OptionsDetecteur {
  /** Vrai quand la page est au premier plan et visible pour l'utilisateur. */
  pageVisible: () => boolean;
  /** Appelé uniquement quand l'état de lecture change réellement. */
  surChangement: (etat: EtatLecture) => void;
}

export interface DetecteurLecture {
  attacher: (element: ElementLecture) => void;
  detacher: () => void;
  /** Réévalue l'état sans événement média (changement de visibilité). */
  reevaluer: () => void;
  etatCourant: () => EtatLecture;
}

export function creerDetecteurLecture({
  pageVisible,
  surChangement,
}: OptionsDetecteur): DetecteurLecture {
  let element: ElementLecture | null = null;
  let dernierEtat: EtatLecture = { enLecture: false, positionSecondes: 0 };

  function calculerEtat(): EtatLecture {
    if (element === null) {
      return { enLecture: false, positionSecondes: 0 };
    }
    return {
      enLecture: !element.paused && !element.ended && pageVisible(),
      positionSecondes: Math.max(0, Math.floor(element.currentTime)),
    };
  }

  function reevaluer(): void {
    const etat = calculerEtat();
    // Seul le passage lecture/pause déclenche une notification : la
    // position avance en continu et n'a pas à réveiller le service
    // worker, qui la relira au moment d'envoyer un heartbeat.
    if (etat.enLecture === dernierEtat.enLecture) {
      dernierEtat = etat;
      return;
    }
    dernierEtat = etat;
    surChangement(etat);
  }

  function attacher(nouvelElement: ElementLecture): void {
    if (nouvelElement === element) {
      return;
    }
    detacher();
    element = nouvelElement;
    for (const evenement of EVENEMENTS_SURVEILLES) {
      nouvelElement.addEventListener(evenement, reevaluer);
    }
    reevaluer();
  }

  function detacher(): void {
    if (element === null) {
      return;
    }
    for (const evenement of EVENEMENTS_SURVEILLES) {
      element.removeEventListener(evenement, reevaluer);
    }
    element = null;
    reevaluer();
  }

  return {
    attacher,
    detacher,
    reevaluer,
    etatCourant: () => dernierEtat,
  };
}
