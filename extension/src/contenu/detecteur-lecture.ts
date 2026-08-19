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

// ─── Contrat minimal attendu d'un lecteur ────────────────────────────────────

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
 * Un flux interrompu par le réseau garde `paused === false` : rien dans
 * l'état de l'élément ne distingue une lecture réelle d'une mise en
 * mémoire tampon prolongée. Seuls les événements le disent, d'où le
 * suivi séparé de cet état, remis à zéro dès que la lecture reprend.
 */
const EVENEMENTS_TAMPON = ["waiting", "stalled"] as const;

/** Événements qui attestent d'une lecture effective ou de son arrêt net. */
const EVENEMENTS_ETAT = [
  "play",
  "playing",
  "pause",
  "ended",
  "emptied",
  "seeked",
] as const;

const EVENEMENTS_SURVEILLES = [...EVENEMENTS_ETAT, ...EVENEMENTS_TAMPON];

// ─── Détecteur ───────────────────────────────────────────────────────────────

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
  let enTampon = false;
  let dernierEtat: EtatLecture = { enLecture: false, positionSecondes: 0 };
  const ecouteurs = new Map<string, () => void>();

  function calculerEtat(): EtatLecture {
    if (element === null) {
      return { enLecture: false, positionSecondes: 0 };
    }
    return {
      enLecture:
        !element.paused && !element.ended && !enTampon && pageVisible(),
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
      const ecouteur = () => {
        enTampon = (EVENEMENTS_TAMPON as readonly string[]).includes(evenement);
        reevaluer();
      };
      ecouteurs.set(evenement, ecouteur);
      nouvelElement.addEventListener(evenement, ecouteur);
    }
    reevaluer();
  }

  function detacher(): void {
    if (element === null) {
      return;
    }
    for (const [evenement, ecouteur] of ecouteurs) {
      element.removeEventListener(evenement, ecouteur);
    }
    ecouteurs.clear();
    element = null;
    enTampon = false;
    reevaluer();
  }

  return {
    attacher,
    detacher,
    reevaluer,
    etatCourant: () => dernierEtat,
  };
}
