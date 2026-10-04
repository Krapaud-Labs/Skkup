"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { ErreurApi } from "@/lib/api";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { gratterCarte, recupererCartesAGratter, recupererProfil, recupererTicketsTirage, type CarteAGratter, type TicketsTirage } from "@/lib/dashboard";

type Filtre = "TOUTES" | "DISPONIBLES" | "UTILISEES";

export function CentreRecompenses() {
  const { langue } = useLanguage();
  const anglais = langue === "en";
  const [cartes, setCartes] = useState<CarteAGratter[] | null>(null);
  const [tickets, setTickets] = useState<TicketsTirage | null>(null);
  const [solde, setSolde] = useState<number | null>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [tentative, setTentative] = useState(0);
  const [filtre, setFiltre] = useState<Filtre>("TOUTES");
  const [carteEnCours, setCarteEnCours] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [tri, setTri] = useState<"recent" | "value">("recent");

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const [cartesRecues, ticketsRecus, profil] = await Promise.all([recupererCartesAGratter(), recupererTicketsTirage(1, 6), recupererProfil()]);
      setCartes(cartesRecues);
      setTickets(ticketsRecus);
      setSolde(profil.soldePoints);
      setSelection((courante) => courante && cartesRecues.some((carte) => carte.id === courante) ? courante : cartesRecues[0]?.id ?? null);
    } catch (exception: unknown) {
      setErreur(exception instanceof ErreurApi ? exception.message : (anglais ? "Rewards are temporarily unavailable." : "Les récompenses sont temporairement indisponibles."));
    }
  }, [anglais]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void charger(); }, 0);
    return () => window.clearTimeout(timer);
  }, [charger, tentative]);

  async function gratter(carte: CarteAGratter) {
    if (carte.grattee || carteEnCours !== null) return;
    setCarteEnCours(carte.id);
    setMessage(null);
    try {
      const resultat = await gratterCarte(carte.id);
      setCartes((courantes) => courantes?.map((item) => item.id === carte.id ? resultat.carte : item) ?? courantes);
      setMessage(resultat.carte.gainMontant === null ? (anglais ? "Card opened successfully." : "Carte ouverte avec succès.") : `${anglais ? "You won" : "Tu as gagné"} ${resultat.carte.gainMontant} points.`);
    } catch (exception: unknown) {
      setMessage(exception instanceof ErreurApi ? exception.message : (anglais ? "This card could not be opened." : "Cette carte ne peut pas être ouverte pour le moment."));
    } finally {
      setCarteEnCours(null);
    }
  }

  const disponibles = useMemo(() => cartes?.filter((carte) => !carte.grattee) ?? [], [cartes]);
  const utilisees = useMemo(() => cartes?.filter((carte) => carte.grattee) ?? [], [cartes]);
  const libelleCarte = useCallback((carte: CarteAGratter) => {
    if (carte.grattee) return anglais ? "Used reward" : "Récompense utilisée";
    if (carte.gainType === "TICKET") return anglais ? "Draw ticket" : "Ticket de tirage";
    if (carte.streakPalier >= 14) return anglais ? "Streak bonus" : "Bonus de série";
    return anglais ? "Classic scratch card" : "Carte classique";
  }, [anglais]);
  const visibles = useMemo(() => {
    const source = filtre === "DISPONIBLES" ? disponibles : filtre === "UTILISEES" ? utilisees : cartes ?? [];
    const terme = recherche.trim().toLocaleLowerCase();
    return [...source].filter((carte) => !terme || libelleCarte(carte).toLocaleLowerCase().includes(terme)).sort((a, b) => tri === "value" ? (b.gainMontant ?? 0) - (a.gainMontant ?? 0) : b.createdAt.localeCompare(a.createdAt));
  }, [cartes, disponibles, filtre, libelleCarte, recherche, tri, utilisees]);
  const selectionnee = visibles.find((carte) => carte.id === selection) ?? visibles[0] ?? null;

  return <div className="skuup-dashboard-page">
    <header className="skuup-dashboard-page-header"><p className="skuup-kicker">{anglais ? "Your rewards" : "Tes récompenses"}</p><h1 className="skuup-dashboard-page-title">{anglais ? "Rewards" : "Récompenses"}</h1><p>{anglais ? "Use your points to unlock scratch cards and draw tickets." : "Utilise tes points pour débloquer des cartes à gratter et des tickets de tirage."}</p></header>
    {erreur ? <div role="alert" className="skuup-viewer-error"><p>{erreur}</p><button type="button" className="skuup-button skuup-button-outline mt-3" onClick={() => { setCartes(null); setTickets(null); setSolde(null); setTentative((value) => value + 1); }}>{anglais ? "Retry" : "Réessayer"}</button></div> : cartes === null || tickets === null || solde === null ? <p role="status" aria-live="polite" className="skuup-viewer-state">{anglais ? "Loading rewards…" : "Chargement des récompenses…"}</p> : <div className="skuup-rewards-layout">
      <div className="skuup-viewer-toolbar skuup-rewards-toolbar"><label>{anglais ? "Search" : "Rechercher"}<input value={recherche} onChange={(event) => setRecherche(event.target.value)} placeholder={anglais ? "Reward type" : "Type de récompense"} /></label><label>{anglais ? "Sort" : "Trier"}<select value={tri} onChange={(event) => setTri(event.target.value as typeof tri)}><option value="recent">{anglais ? "Most recent" : "Plus récentes"}</option><option value="value">{anglais ? "Highest value" : "Valeur la plus élevée"}</option></select></label></div>
      <CarteGlow className="skuup-viewer-section skuup-rewards-collection"><div className="skuup-secondary-heading"><div><p className="skuup-kicker">{anglais ? "Your collection" : "Ta collection"}</p><h2>{anglais ? "Scratch cards" : "Cartes à gratter"}</h2></div><SkkupIcon name="gift" size={30} /></div><div className="skuup-rewards-filters" role="tablist" aria-label={anglais ? "Reward filters" : "Filtres des récompenses"}>{([["TOUTES", anglais ? "All" : "Toutes", cartes.length], ["DISPONIBLES", anglais ? "Available" : "Disponibles", disponibles.length], ["UTILISEES", anglais ? "Used" : "Utilisées", utilisees.length]] as const).map(([value, label, count]) => <button key={value} type="button" role="tab" aria-selected={filtre === value} className={filtre === value ? "is-active" : ""} onClick={() => setFiltre(value)}>{label} <span>{count}</span></button>)}</div>{message && <p role="status" className="skuup-viewer-action-message">{message}</p>}<div className="skuup-rewards-grid">{visibles.map((carte) => <article className={`skuup-scratch-card ${carte.grattee ? "is-used" : ""} ${carte.id === selectionnee?.id ? "is-selected" : ""}`} key={carte.id} tabIndex={0} onClick={() => setSelection(carte.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelection(carte.id); } }}><div className="skuup-scratch-art" aria-hidden="true"><SkkupIcon name={carte.grattee ? "check" : "gift"} size={42} /></div><h3>{libelleCarte(carte)}</h3><p>{carte.gainMontant === null ? (carte.streakPalier > 0 ? `${carte.streakPalier} jours de série` : "Récompense issue de ton activité validée") : `${carte.gainMontant} points`}</p>{carte.grattee ? <span className="skuup-badge">Utilisée</span> : <button type="button" className="skuup-button skuup-button-primary" disabled={carteEnCours !== null} onClick={(event) => { event.stopPropagation(); void gratter(carte); }}>{carteEnCours === carte.id ? "Ouverture…" : "Gratter maintenant"}</button>}</article>)}</div>{visibles.length === 0 && <p className="skuup-viewer-empty">Aucune récompense ne correspond à ce filtre.</p>}</CarteGlow>
      <CarteGlow className="skuup-viewer-section skuup-rewards-balance"><p className="skuup-kicker">Ton solde</p><h2>{solde.toLocaleString("fr-FR")} points</h2><p className="mt-2 text-foreground-muted">{tickets.total} tickets obtenus</p><a className="skuup-button skuup-button-outline mt-5 inline-flex" href="/dashboard/historique">Voir l’historique<SkkupIcon name="arrow" size={17} /></a></CarteGlow>
      <CarteGlow className="skuup-viewer-section skuup-rewards-how"><div className="skuup-secondary-heading"><div><p className="skuup-kicker">Repère</p><h2>Comment ça marche ?</h2></div><SkkupIcon name="points" size={25} /></div><ol className="skuup-rewards-how-list"><li><b>1</b><span>Gagne des points en regardant les streams compatibles.</span></li><li><b>2</b><span>Échange tes points contre les récompenses disponibles.</span></li><li><b>3</b><span>Retrouve chaque opération dans ton historique.</span></li></ol></CarteGlow>
      <CarteGlow className="skuup-viewer-section skuup-rewards-selected"><p className="skuup-kicker">Récompense sélectionnée</p>{selectionnee ? <><div className="skuup-rewards-selected-art" aria-hidden="true"><SkkupIcon name={selectionnee.grattee ? "check" : "gift"} size={42} /></div><div className="skuup-rewards-selected-heading"><div><h2>{libelleCarte(selectionnee)}</h2><p>{selectionnee.grattee ? "Cette carte a déjà été utilisée." : "Cette carte est disponible selon le contrat de ton compte."}</p></div><span className="skuup-badge">{selectionnee.gainMontant === null ? "Gain variable" : `${selectionnee.gainMontant} pts`}</span></div><dl className="skuup-rewards-selected-facts"><div><dt>Palier</dt><dd>{selectionnee.streakPalier > 0 ? `${selectionnee.streakPalier} jours` : "Activité validée"}</dd></div><div><dt>Créée le</dt><dd>{new Date(selectionnee.createdAt).toLocaleDateString(anglais ? "en-US" : "fr-FR")}</dd></div></dl>{!selectionnee.grattee && <button type="button" className="skuup-button skuup-button-primary w-full" disabled={carteEnCours !== null} onClick={() => void gratter(selectionnee)}>{carteEnCours === selectionnee.id ? "Ouverture…" : "Gratter maintenant"}</button>}</> : <p className="skuup-viewer-empty mt-4">Sélectionne une carte récompense.</p>}</CarteGlow>
    </div>}
  </div>;
}
