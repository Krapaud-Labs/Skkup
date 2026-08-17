import { beforeEach, describe, expect, it } from "vitest";
import { creerDetecteurLecture } from "./detecteur-lecture";
import type { ElementLecture, EtatLecture } from "./detecteur-lecture";

/** Élément média minimal piloté à la main, sans DOM ni navigateur. */
function lecteurFactice() {
  const ecouteurs = new Map<string, Set<() => void>>();
  const lecteur = {
    paused: true,
    ended: false,
    currentTime: 0,
    addEventListener(type: string, ecouteur: () => void) {
      const existants = ecouteurs.get(type) ?? new Set();
      existants.add(ecouteur);
      ecouteurs.set(type, existants);
    },
    removeEventListener(type: string, ecouteur: () => void) {
      ecouteurs.get(type)?.delete(ecouteur);
    },
    emettre(type: string) {
      for (const ecouteur of ecouteurs.get(type) ?? []) {
        ecouteur();
      }
    },
  };
  return lecteur as ElementLecture & {
    paused: boolean;
    ended: boolean;
    currentTime: number;
    emettre: (type: string) => void;
  };
}

describe("creerDetecteurLecture", () => {
  let visible: boolean;
  let changements: EtatLecture[];

  beforeEach(() => {
    visible = true;
    changements = [];
  });

  function detecteur() {
    return creerDetecteurLecture({
      pageVisible: () => visible,
      surChangement: (etat) => changements.push(etat),
    });
  }

  it("signale le démarrage puis la mise en pause de la lecture", () => {
    const lecteur = lecteurFactice();
    const observateur = detecteur();
    observateur.attacher(lecteur);

    lecteur.paused = false;
    lecteur.currentTime = 12.7;
    lecteur.emettre("playing");
    expect(changements).toEqual([{ enLecture: true, positionSecondes: 12 }]);

    lecteur.paused = true;
    lecteur.emettre("pause");
    expect(changements).toHaveLength(2);
    expect(changements[1]?.enLecture).toBe(false);
  });

  it("ne signale rien quand seule la position avance", () => {
    const lecteur = lecteurFactice();
    const observateur = detecteur();
    observateur.attacher(lecteur);
    lecteur.paused = false;
    lecteur.emettre("playing");
    changements = [];

    lecteur.currentTime = 60;
    observateur.reevaluer();

    expect(changements).toEqual([]);
    expect(observateur.etatCourant()).toEqual({
      enLecture: true,
      positionSecondes: 60,
    });
  });

  it("ne compte pas la lecture quand la page n'est pas au premier plan", () => {
    const lecteur = lecteurFactice();
    const observateur = detecteur();
    observateur.attacher(lecteur);
    lecteur.paused = false;
    lecteur.emettre("playing");

    visible = false;
    observateur.reevaluer();

    expect(observateur.etatCourant().enLecture).toBe(false);
    expect(changements.at(-1)?.enLecture).toBe(false);
  });

  it("traite une coupure réseau comme un arrêt, puis la reprise comme une lecture", () => {
    const lecteur = lecteurFactice();
    const observateur = detecteur();
    observateur.attacher(lecteur);
    lecteur.paused = false;
    lecteur.emettre("playing");

    // Un direct interrompu garde `paused === false` : seul l'événement de
    // mise en mémoire tampon révèle l'arrêt.
    lecteur.emettre("waiting");
    expect(observateur.etatCourant().enLecture).toBe(false);

    lecteur.emettre("playing");
    expect(observateur.etatCourant().enLecture).toBe(true);
  });

  it("cesse d'observer un lecteur détaché et signale l'arrêt", () => {
    const lecteur = lecteurFactice();
    const observateur = detecteur();
    observateur.attacher(lecteur);
    lecteur.paused = false;
    lecteur.emettre("playing");
    changements = [];

    observateur.detacher();
    expect(changements.at(-1)?.enLecture).toBe(false);

    lecteur.emettre("pause");
    expect(changements).toHaveLength(1);
  });
});
