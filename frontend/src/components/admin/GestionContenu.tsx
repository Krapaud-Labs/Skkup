"use client";

import { useEffect, useState } from "react";
import { ErreurApi } from "@/lib/api";
import { creerContenu, depublierContenu, listerAuditContenu, listerContenus, listerVersionsContenu, modifierContenu, publierContenu, restaurerVersionContenu, type AuditContenuAdmin, type ContenuAdmin, type TypeContenuAdmin, type VersionContenuAdmin } from "@/lib/admin";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const types: TypeContenuAdmin[] = ["LANDING", "LEGAL", "ANNOUNCEMENT", "FAQ", "MEDIA"];

export function GestionContenu() {
  const { langue } = useLanguage();
  const texte = langue === "en" ? {
    title: "Content management", description: "Create drafts by type and language, then publish or unpublish each version.", id: "Identifier", type: "Type", language: "Language", data: "JSON data", create: "Create draft", preview: "Preview", hidePreview: "Hide preview", previewLabel: "Content preview", publish: "Publish", unpublish: "Unpublish", newVersion: "New version", history: "History", restore: "Restore", noContent: "No versioned content.", audit: "Audit log", auditLabel: "Content audit log", noAudit: "No recent action.", loadingError: "Content loading failed.", restoreSuccess: (version: number) => `Version ${version} restored as a new draft.`
  } : {
    title: "Gestion de contenu", description: "Crée des brouillons par type et langue, puis publie ou dépublie chaque version.", id: "Identifiant", type: "Type", language: "Langue", data: "Données JSON", create: "Créer le brouillon", preview: "Prévisualiser", hidePreview: "Masquer la prévisualisation", previewLabel: "Prévisualisation du contenu", publish: "Publier", unpublish: "Dépublier", newVersion: "Nouvelle version", history: "Historique", restore: "Restaurer", noContent: "Aucun contenu versionné.", audit: "Journal d’audit", auditLabel: "Journal d’audit du contenu", noAudit: "Aucune action récente.", loadingError: "Content loading failed.", restoreSuccess: (version: number) => `Version ${version} restaurée comme nouveau brouillon.`
  };
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
    } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : texte.loadingError); }
  }
  useEffect(() => {
    void Promise.all([listerContenus(), listerAuditContenu()])
      .then(([contenusRecus, auditRecu]) => { setContenus(contenusRecus); setAudit(auditRecu); })
      .catch((exception: unknown) => setErreur(exception instanceof ErreurApi ? exception.message : langue === "en" ? "Content loading failed." : "Échec du chargement du contenu."));
  }, [langue]);

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
      setConfirmation(texte.restoreSuccess(version.version));
    } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Version restoration failed."); }
  }

  return <section className="skuup-admin-card" aria-labelledby="content-management-title">
    <h2 id="content-management-title" className="text-xl font-bold text-foreground">{texte.title}</h2>
    <p className="mt-2 text-sm text-foreground-muted">{texte.description}</p>
    {erreur && <p role="alert" className="mt-3 text-sm text-red-200">{erreur}</p>}
    {confirmation && <p role="status" className="mt-3 text-sm text-emerald-200">{confirmation}</p>}
    <div className="mt-4 grid gap-3 md:grid-cols-4">
      <label className="skuup-admin-field">{texte.id}<input className="skuup-admin-input" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="hero-principal" /></label>
      <label className="skuup-admin-field">{texte.type}<select className="skuup-admin-input" value={type} onChange={(event) => setType(event.target.value as TypeContenuAdmin)}>{types.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="skuup-admin-field">{texte.language}<select className="skuup-admin-input" value={locale} onChange={(event) => setLocale(event.target.value as "fr" | "en")}><option value="fr">FR</option><option value="en">EN</option></select></label>
      <label className="skuup-admin-field md:col-span-4">{texte.data}<textarea className="skuup-admin-input min-h-24 font-mono text-xs" value={json} onChange={(event) => setJson(event.target.value)} /></label>
    </div>
    <button className="skuup-button skuup-admin-button mt-3" type="button" onClick={() => void creer()}>{texte.create}</button>
    <button className="skuup-button skuup-button-outline ml-2 mt-3" type="button" onClick={() => setPrevisualisation((visible) => !visible)} aria-expanded={previsualisation}>{previsualisation ? texte.hidePreview : texte.preview}</button>
    {previsualisation && <aside className="mt-4 rounded-xl border border-white/10 bg-black/10 p-4" aria-label={texte.previewLabel}><p className="skuup-kicker">{texte.preview} · {locale.toUpperCase()}</p><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-sm text-foreground-muted">{json}</pre></aside>}
    <ul className="mt-6 grid gap-2" aria-label={texte.title}>
      {contenus.map((contenu) => <li key={contenu.id} className="skuup-admin-list-item grid gap-2"><div className="flex flex-wrap items-center justify-between gap-3"><span><strong>{contenu.slug}</strong><span className="ml-2 text-foreground-muted">{contenu.type} · {contenu.locale} · v{contenu.version}</span></span><span className="flex gap-2"><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void changer(contenu, contenu.status === "PUBLISHED" ? "unpublish" : "publish")}>{contenu.status === "PUBLISHED" ? texte.unpublish : texte.publish}</button><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void modifierContenu(contenu.id, contenu.data)}>{texte.newVersion}</button><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void afficherVersions(contenu)}>{texte.history}</button></span></div>{versions[contenu.id] && <ul className="grid gap-1 border-l border-white/10 pl-3 text-xs" aria-label={`${texte.history} ${contenu.slug}`}>{versions[contenu.id].map((version) => <li key={version.id} className="flex items-center justify-between gap-2"><span>Version {version.version} · {version.status}</span><button className="skuup-button skuup-button-outline px-2 py-1 text-xs" type="button" onClick={() => void restaurer(contenu, version)}>{texte.restore}</button></li>)}</ul>}</li>)}
      {contenus.length === 0 && <li className="text-sm text-foreground-muted">{texte.noContent}</li>}
    </ul>
    <section className="mt-6 border-t border-white/10 pt-4" aria-labelledby="content-audit-title">
      <h3 id="content-audit-title" className="text-lg font-semibold text-foreground">{texte.audit}</h3>
      <ul className="mt-3 grid gap-2" aria-label={texte.auditLabel}>
        {audit.slice(0, 10).map((evenement) => <li key={evenement.id} className="skuup-admin-list-item flex flex-wrap justify-between gap-2 text-xs"><span>{evenement.action} · {evenement.entityType} · {evenement.entityId}</span><time dateTime={evenement.createdAt}>{new Date(evenement.createdAt).toLocaleString("fr-FR")}</time></li>)}
        {audit.length === 0 && <li className="text-sm text-foreground-muted">{texte.noAudit}</li>}
      </ul>
    </section>
  </section>;
}
