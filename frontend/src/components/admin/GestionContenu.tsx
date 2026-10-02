"use client";

import { useEffect, useState } from "react";
import { ErreurApi } from "@/lib/api";
import { creerContenu, depublierContenu, listerAuditContenu, listerContenus, listerVersionsContenu, modifierContenu, publierContenu, restaurerVersionContenu, type AuditContenuAdmin, type ContenuAdmin, type TypeContenuAdmin, type VersionContenuAdmin } from "@/lib/admin";

const types: TypeContenuAdmin[] = ["LANDING", "LEGAL", "ANNOUNCEMENT", "FAQ", "MEDIA"];

export function GestionContenu() {
  const [contenus, setContenus] = useState<ContenuAdmin[]>([]);
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<TypeContenuAdmin>("LANDING");
  const [locale, setLocale] = useState<"fr" | "en">("fr");
  const [json, setJson] = useState('{"title":""}');
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [versions, setVersions] = useState<Record<string, VersionContenuAdmin[]>>({});
  const [previsualisation, setPrevisualisation] = useState(false);
  const [audit, setAudit] = useState<AuditContenuAdmin[]>([]);

  async function charger() {
    try {
      const [contenusRecus, auditRecu] = await Promise.all([listerContenus(), listerAuditContenu()]);
      setContenus(contenusRecus);
      setAudit(auditRecu);
    } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Content loading failed."); }
  }
  useEffect(() => {
    void Promise.all([listerContenus(), listerAuditContenu()])
      .then(([contenusRecus, auditRecu]) => { setContenus(contenusRecus); setAudit(auditRecu); })
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

  async function afficherVersions(contenu: ContenuAdmin) {
    try {
      const resultat = await listerVersionsContenu(contenu.id);
      setVersions((actuelles) => ({ ...actuelles, [contenu.id]: resultat }));
    } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Version history loading failed."); }
  }

  async function restaurer(contenu: ContenuAdmin, version: VersionContenuAdmin) {
    try {
      const resultat = await restaurerVersionContenu(contenu.id, version.id);
      setContenus((anciens) => anciens.map((item) => item.id === resultat.id ? resultat : item));
      setConfirmation(`Version ${version.version} restaurée comme nouveau brouillon.`);
    } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Version restoration failed."); }
  }

  return <section className="skuup-admin-card" aria-labelledby="content-management-title">
    <h2 id="content-management-title" className="text-xl font-bold text-foreground">Gestion de contenu</h2>
    <p className="mt-2 text-sm text-foreground-muted">Crée des brouillons par type et langue, puis publie ou dépublie chaque version.</p>
    {erreur && <p role="alert" className="mt-3 text-sm text-red-200">{erreur}</p>}
    {confirmation && <p role="status" className="mt-3 text-sm text-emerald-200">{confirmation}</p>}
    <div className="mt-4 grid gap-3 md:grid-cols-4">
      <label className="skuup-admin-field">Identifiant<input className="skuup-admin-input" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="hero-principal" /></label>
      <label className="skuup-admin-field">Type<select className="skuup-admin-input" value={type} onChange={(event) => setType(event.target.value as TypeContenuAdmin)}>{types.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="skuup-admin-field">Langue<select className="skuup-admin-input" value={locale} onChange={(event) => setLocale(event.target.value as "fr" | "en")}><option value="fr">FR</option><option value="en">EN</option></select></label>
      <label className="skuup-admin-field md:col-span-4">Données JSON<textarea className="skuup-admin-input min-h-24 font-mono text-xs" value={json} onChange={(event) => setJson(event.target.value)} /></label>
    </div>
    <button className="skuup-button skuup-admin-button mt-3" type="button" onClick={() => void creer()}>Créer le brouillon</button>
    <button className="skuup-button skuup-button-outline ml-2 mt-3" type="button" onClick={() => setPrevisualisation((visible) => !visible)} aria-expanded={previsualisation}>{previsualisation ? "Masquer la prévisualisation" : "Prévisualiser"}</button>
    {previsualisation && <aside className="mt-4 rounded-xl border border-white/10 bg-black/10 p-4" aria-label="Prévisualisation du contenu"><p className="skuup-kicker">Prévisualisation · {locale.toUpperCase()}</p><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-sm text-foreground-muted">{json}</pre></aside>}
    <ul className="mt-6 grid gap-2" aria-label="Contenus administrables">
      {contenus.map((contenu) => <li key={contenu.id} className="skuup-admin-list-item grid gap-2"><div className="flex flex-wrap items-center justify-between gap-3"><span><strong>{contenu.slug}</strong><span className="ml-2 text-foreground-muted">{contenu.type} · {contenu.locale} · v{contenu.version}</span></span><span className="flex gap-2"><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void changer(contenu, contenu.status === "PUBLISHED" ? "unpublish" : "publish")}>{contenu.status === "PUBLISHED" ? "Dépublier" : "Publier"}</button><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void modifierContenu(contenu.id, contenu.data)}>Nouvelle version</button><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void afficherVersions(contenu)}>Historique</button></span></div>{versions[contenu.id] && <ul className="grid gap-1 border-l border-white/10 pl-3 text-xs" aria-label={`Historique de ${contenu.slug}`}>{versions[contenu.id].map((version) => <li key={version.id} className="flex items-center justify-between gap-2"><span>Version {version.version} · {version.status}</span><button className="skuup-button skuup-button-outline px-2 py-1 text-xs" type="button" onClick={() => void restaurer(contenu, version)}>Restaurer</button></li>)}</ul>}</li>)}
      {contenus.length === 0 && <li className="text-sm text-foreground-muted">Aucun contenu versionné.</li>}
    </ul>
    <section className="mt-6 border-t border-white/10 pt-4" aria-labelledby="content-audit-title">
      <h3 id="content-audit-title" className="text-lg font-semibold text-foreground">Journal d’audit</h3>
      <ul className="mt-3 grid gap-2" aria-label="Journal d’audit du contenu">
        {audit.slice(0, 10).map((evenement) => <li key={evenement.id} className="skuup-admin-list-item flex flex-wrap justify-between gap-2 text-xs"><span>{evenement.action} · {evenement.entityType} · {evenement.entityId}</span><time dateTime={evenement.createdAt}>{new Date(evenement.createdAt).toLocaleString("fr-FR")}</time></li>)}
        {audit.length === 0 && <li className="text-sm text-foreground-muted">Aucune action récente.</li>}
      </ul>
    </section>
  </section>;
}
