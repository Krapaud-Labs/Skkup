"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listerSignalements, modifierSignalement, type SignalementAdmin, type StatutSignalement } from "@/lib/admin";

type Section = "raffles" | "lots" | "announcements" | "content" | "moderation" | "users" | "audit";

const labels: Record<Section, { title: string; description: string }> = {
  raffles: { title: "Pilotage des tirages", description: "Préparez, exécutez et vérifiez les tirages Skkup." },
  lots: { title: "Lots et stock", description: "Gérez l’inventaire, les quantités et les attributions." },
  announcements: { title: "Annonces", description: "Publiez les messages visibles dans l’espace viewer." },
  content: { title: "Contenus", description: "Gérez les pages éditoriales et leurs versions." },
  moderation: { title: "Signalements et modération", description: "Analysez les preuves et documentez chaque décision." },
  users: { title: "Utilisateurs", description: "Consultez les profils et leurs événements de sécurité." },
  audit: { title: "Journal d’audit", description: "Suivez les actions sensibles et leur contexte." },
};

const nav: Array<[Section, string]> = [["raffles", "Tirages"], ["lots", "Lots"], ["announcements", "Annonces"], ["content", "Contenus"], ["moderation", "Signalements"], ["users", "Utilisateurs"], ["audit", "Audit"]];

function ModerationDetail({ item, onStatus }: { item: SignalementAdmin; onStatus: (status: StatutSignalement) => Promise<void> }) {
  const [note, setNote] = useState("");
  return <aside className="skuup-premium-panel" aria-label="Détail du signalement">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">Dossier sélectionné</p><h2 className="mt-2 text-xl font-semibold">{item.id}</h2></div><span className="skuup-status-badge">{item.statut}</span></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2"><div><p className="text-xs text-foreground-muted">Utilisateur concerné</p><p className="font-medium">{item.user.pseudo} · {item.user.email}</p></div><div><p className="text-xs text-foreground-muted">Type</p><p className="font-medium">{item.type}</p></div></div>
    <section className="mt-6"><h3 className="font-semibold">Preuves</h3><div className="mt-2 rounded-xl border border-border-subtle p-3 text-sm text-foreground-muted">Éléments techniques conservés pour ce dossier. Vérifiez le contexte avant toute action.</div></section>
    <section className="mt-6"><h3 className="font-semibold">Chronologie</h3><ol className="mt-2 space-y-2 border-l border-border-subtle pl-4 text-sm"><li>Signalement reçu</li><li>Analyse par l’équipe de modération</li><li>Statut actuel : {item.statut}</li></ol></section>
    <label className="mt-6 block text-sm font-medium" htmlFor="moderation-note">Note de modération<textarea id="moderation-note" value={note} onChange={(e) => setNote(e.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-border-subtle bg-background p-3" placeholder="Documenter la décision…" /></label>
    <div className="mt-4 flex flex-wrap gap-2"><button className="skuup-button skuup-button-primary" onClick={() => onStatus("EXAMINEE")}>Marquer examinée</button><button className="skuup-button skuup-button-outline" onClick={() => onStatus("IGNOREE")}>Classer sans suite</button></div>
  </aside>;
}

export function AdminSectionPage({ section }: { section: Section }) {
  const meta = labels[section];
  const [items, setItems] = useState<SignalementAdmin[]>([]);
  const [selected, setSelected] = useState<SignalementAdmin | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (section !== "moderation") return; listerSignalements().then(setItems).catch(() => setError("Impossible de charger les signalements.")); }, [section]);
  async function update(status: StatutSignalement) { if (!selected) return; const updated = await modifierSignalement(selected.id, status); setSelected(updated); setItems((current) => current.map((item) => item.id === updated.id ? updated : item)); }
  return <main className="mx-auto min-h-screen max-w-7xl px-6 py-10"><header className="flex flex-col gap-5 border-b border-border-subtle pb-8 md:flex-row md:items-end md:justify-between"><div><Link href="/admin" className="text-sm text-foreground-muted hover:text-foreground">← Retour au cockpit</Link><p className="mt-6 text-xs uppercase tracking-[0.24em] text-foreground-muted">Administration Skkup</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{meta.title}</h1><p className="mt-2 max-w-2xl text-foreground-muted">{meta.description}</p></div><Link href="/admin" className="skuup-button skuup-button-outline">Cockpit</Link></header><nav className="flex flex-wrap gap-2 py-6" aria-label="Sections administration">{nav.map(([key, label]) => <Link key={key} href={`/admin/${key}`} className={`rounded-full border px-4 py-2 text-sm ${key === section ? "border-primary bg-primary/10 text-primary" : "border-border-subtle text-foreground-muted"}`}>{label}</Link>)}</nav>{section === "moderation" ? <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"><section className="skuup-premium-panel"><div className="flex items-center justify-between"><h2 className="font-semibold">Dossiers à traiter</h2><span className="text-sm text-foreground-muted">{items.length}</span></div>{error && <p role="alert" className="mt-4 text-sm text-red-500">{error}</p>}<div className="mt-4 space-y-2">{items.map((item) => <button key={item.id} onClick={() => setSelected(item)} className={`w-full rounded-xl border p-4 text-left ${selected?.id === item.id ? "border-primary bg-primary/5" : "border-border-subtle"}`}><div className="flex justify-between gap-3"><strong>{item.type}</strong><span className="text-xs text-foreground-muted">{item.statut}</span></div><p className="mt-1 text-xs text-foreground-muted">{item.user.pseudo} · {item.user.email}</p></button>)}{!items.length && !error && <p className="py-8 text-sm text-foreground-muted">Aucun signalement à afficher.</p>}</div></section>{selected ? <ModerationDetail item={selected} onStatus={update} /> : <div className="skuup-premium-panel flex items-center justify-center text-sm text-foreground-muted">Sélectionnez un dossier pour afficher son détail.</div>}</div> : <section className="skuup-premium-panel"><h2 className="text-xl font-semibold">{meta.title}</h2><p className="mt-2 text-sm text-foreground-muted">Écran autonome prêt à accueillir les données et actions de ce module.</p><Link className="skuup-button skuup-button-primary mt-6 inline-flex" href="/admin">Ouvrir les données du cockpit</Link></section>}</main>;
}
