"use client";

import { useEffect, useState } from "react";
import { ErreurApi } from "@/lib/api";
import { creerContenu, depublierContenu, listerContenus, modifierContenu, publierContenu, type ContenuAdmin, type TypeContenuAdmin } from "@/lib/admin";

const types: TypeContenuAdmin[] = ["LANDING", "LEGAL", "ANNOUNCEMENT", "FAQ", "MEDIA"];

export function GestionContenu() {
  const [contenus, setContenus] = useState<ContenuAdmin[]>([]);
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<TypeContenuAdmin>("LANDING");
  const [locale, setLocale] = useState<"fr" | "en">("fr");
  const [json, setJson] = useState('{"title":""}');
  const [erreur, setErreur] = useState<string | null>(null);

  async function charger() {
    try { setContenus(await listerContenus()); } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Content loading failed."); }
  }
  useEffect(() => {
    void listerContenus()
      .then(setContenus)
      .catch((exception: unknown) => setErreur(exception instanceof ErreurApi ? exception.message : "Content loading failed."));
  }, []);

  async function creer() {
    try {
      const data = JSON.parse(json) as Record<string, unknown>;
      await creerContenu({ slug: slug.trim(), type, locale, data });
      setSlug("");
      await charger();
    } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Content JSON is invalid."); }
  }

  async function changer(contenu: ContenuAdmin, action: "publish" | "unpublish") {
    const resultat = action === "publish" ? await publierContenu(contenu.id) : await depublierContenu(contenu.id);
    setContenus((anciens) => anciens.map((item) => item.id === resultat.id ? resultat : item));
  }

  return <section className="skuup-admin-card" aria-labelledby="content-management-title">
    <h2 id="content-management-title" className="text-xl font-bold text-foreground">Gestion de contenu</h2>
    <p className="mt-2 text-sm text-foreground-muted">Crée des brouillons par type et langue, puis publie ou dépublie chaque version.</p>
    {erreur && <p role="alert" className="mt-3 text-sm text-red-200">{erreur}</p>}
    <div className="mt-4 grid gap-3 md:grid-cols-4">
      <label className="skuup-admin-field">Identifiant<input className="skuup-admin-input" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="hero-principal" /></label>
      <label className="skuup-admin-field">Type<select className="skuup-admin-input" value={type} onChange={(event) => setType(event.target.value as TypeContenuAdmin)}>{types.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="skuup-admin-field">Langue<select className="skuup-admin-input" value={locale} onChange={(event) => setLocale(event.target.value as "fr" | "en")}><option value="fr">FR</option><option value="en">EN</option></select></label>
      <label className="skuup-admin-field md:col-span-4">Données JSON<textarea className="skuup-admin-input min-h-24 font-mono text-xs" value={json} onChange={(event) => setJson(event.target.value)} /></label>
    </div>
    <button className="skuup-button skuup-admin-button mt-3" type="button" onClick={() => void creer()}>Créer le brouillon</button>
    <ul className="mt-6 grid gap-2" aria-label="Contenus administrables">
      {contenus.map((contenu) => <li key={contenu.id} className="skuup-admin-list-item flex flex-wrap items-center justify-between gap-3"><span><strong>{contenu.slug}</strong><span className="ml-2 text-foreground-muted">{contenu.type} · {contenu.locale} · v{contenu.version}</span></span><span className="flex gap-2"><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void changer(contenu, contenu.status === "PUBLISHED" ? "unpublish" : "publish")}>{contenu.status === "PUBLISHED" ? "Dépublier" : "Publier"}</button><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void modifierContenu(contenu.id, contenu.data)}>Nouvelle version</button></span></li>)}
      {contenus.length === 0 && <li className="text-sm text-foreground-muted">Aucun contenu versionné.</li>}
    </ul>
  </section>;
}
