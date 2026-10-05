"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ErreurApi } from "@/lib/api";
import { creerContenu, depublierContenu, listerAuditContenu, listerContenus, listerVersionsContenu, modifierContenu, publierContenu, restaurerVersionContenu, type AuditContenuAdmin, type ContenuAdmin, type TypeContenuAdmin, type VersionContenuAdmin } from "@/lib/admin";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type Section = { heading: string; body: string };
type FaqItem = { question: string; answer: string };
type EditorData = { title: string; intro: string; sections: Section[]; faq: FaqItem[]; imageUrl: string; imageAlt: string; caption: string };

const types: TypeContenuAdmin[] = ["LANDING", "LEGAL", "ANNOUNCEMENT", "FAQ", "MEDIA"];
const emptyData: EditorData = { title: "", intro: "", sections: [{ heading: "", body: "" }], faq: [{ question: "", answer: "" }], imageUrl: "", imageAlt: "", caption: "" };
function toEditorData(value: Record<string, unknown>): EditorData {
  const sections = Array.isArray(value.sections) ? value.sections.flatMap((item) => typeof item === "object" && item !== null ? [{ heading: String((item as Record<string, unknown>).heading ?? ""), body: String((item as Record<string, unknown>).body ?? "") }] : []) : emptyData.sections;
  const faq = Array.isArray(value.faq) ? value.faq.flatMap((item) => typeof item === "object" && item !== null ? [{ question: String((item as Record<string, unknown>).question ?? ""), answer: String((item as Record<string, unknown>).answer ?? "") }] : []) : emptyData.faq;
  return { title: String(value.title ?? ""), intro: String(value.intro ?? value.description ?? ""), sections: sections.length ? sections : emptyData.sections, faq: faq.length ? faq : emptyData.faq, imageUrl: String(value.imageUrl ?? ""), imageAlt: String(value.imageAlt ?? ""), caption: String(value.caption ?? "") };
}

function toApiData(data: EditorData, type: TypeContenuAdmin): Record<string, unknown> {
  if (type === "FAQ") return { title: data.title, intro: data.intro, faq: data.faq };
  if (type === "MEDIA") return { title: data.title, caption: data.caption, imageUrl: data.imageUrl, imageAlt: data.imageAlt };
  return { title: data.title, intro: data.intro, sections: data.sections };
}

export function GestionContenu() {
  const { langue } = useLanguage();
  const en = langue === "en";
  const text = {
    title: en ? "Editorial pages" : "Pages éditoriales", description: en ? "Select a page, then click a content block to edit it.": "Sélectionne une page, puis clique directement sur un bloc pour le modifier.", pages: en ? "Pages to manage" : "Pages à gérer", newPage: en ? "New page" : "Nouvelle page", pageId: en ? "Page identifier" : "Identifiant de page", type: en ? "Page type" : "Type de page", language: en ? "Language" : "Langue", save: en ? "Save draft" : "Enregistrer le brouillon", create: en ? "Create draft" : "Créer le brouillon", preview: en ? "Preview" : "Aperçu", publish: en ? "Publish" : "Publier", unpublish: en ? "Unpublish" : "Dépublier", edit: en ? "Edit block" : "Modifier le bloc", close: en ? "Close" : "Fermer", cancel: en ? "Cancel" : "Annuler", confirm: en ? "Apply changes" : "Appliquer les changements", pageTitle: en ? "Page title" : "Titre de la page", intro: en ? "Introduction" : "Introduction", heading: en ? "Section title" : "Titre de section", body: en ? "Section content" : "Contenu de la section", question: en ? "Question" : "Question", answer: en ? "Answer" : "Réponse", imageUrl: en ? "Image URL" : "URL de l’image", imageAlt: en ? "Alternative text" : "Texte alternatif", caption: en ? "Caption" : "Légende", addSection: en ? "Add section" : "Ajouter une section", addQuestion: en ? "Add question" : "Ajouter une question", remove: en ? "Remove" : "Supprimer", history: en ? "Version history" : "Historique des versions", restore: en ? "Restore" : "Restaurer", audit: en ? "Activity history" : "Historique des actions", noContent: en ? "No page yet." : "Aucune page pour le moment.", loadingError: en ? "Content loading failed." : "Échec du chargement du contenu." };
  const [contents, setContents] = useState<ContenuAdmin[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<TypeContenuAdmin>("LEGAL");
  const [locale, setLocale] = useState<"fr" | "en">(en ? "en" : "fr");
  const [data, setData] = useState<EditorData>(emptyData);
  const [modal, setModal] = useState<"title" | "intro" | "section" | "faq" | "media" | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [draftHeading, setDraftHeading] = useState("");
  const [draftQuestion, setDraftQuestion] = useState("");
  const [draftImageUrl, setDraftImageUrl] = useState("");
  const [draftImageAlt, setDraftImageAlt] = useState("");
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);
  const [versions, setVersions] = useState<Record<string, VersionContenuAdmin[]>>({});
  const [audit, setAudit] = useState<AuditContenuAdmin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cleChargement, setCleChargement] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<"ALL" | ContenuAdmin["status"]>("ALL");
  const [filtreType, setFiltreType] = useState<"ALL" | TypeContenuAdmin>("ALL");
  const modalCloseRef = useRef<HTMLButtonElement | null>(null);
  const modalTriggerRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void Promise.allSettled([listerContenus(), listerAuditContenu()]).then(async ([contenusResultat, auditResultat]) => {
      if (contenusResultat.status === "fulfilled") {
        const items = contenusResultat.value;
        setContents(items);
        if (!selectedId && items[0]) select(items[0]);
      }
      if (auditResultat.status === "fulfilled") setAudit(auditResultat.value);
      if (contenusResultat.status === "rejected" || auditResultat.status === "rejected") setError(text.loadingError);
    }).catch((exception: unknown) => setError(exception instanceof ErreurApi ? exception.message : text.loadingError));
  }, [langue, text.loadingError, cleChargement, selectedId]);
  function reset() { setSelectedId(null); setSlug(""); setType("LEGAL"); setLocale(en ? "en" : "fr"); setData(emptyData); setMessage(null); }
  function select(item: ContenuAdmin) { setSelectedId(item.id); setSlug(item.slug); setType(item.type); setLocale(item.locale); setData(toEditorData(item.data)); setMessage(null); }
  function openModal(kind: typeof modal, index = 0) { modalTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setSelectedIndex(index); if (kind === "title") setDraft(data.title); if (kind === "intro") setDraft(data.intro); if (kind === "section") { setDraftHeading(data.sections[index]?.heading ?? ""); setDraft(data.sections[index]?.body ?? ""); } if (kind === "faq") { setDraftQuestion(data.faq[index]?.question ?? ""); setDraft(data.faq[index]?.answer ?? ""); } if (kind === "media") { setDraftImageUrl(data.imageUrl); setDraftImageAlt(data.imageAlt); setDraft(data.caption); } setModal(kind); }
  function closeModal() { setModal(null); requestAnimationFrame(() => modalTriggerRef.current?.focus()); }
  useEffect(() => {
    if (!modal) return;
    requestAnimationFrame(() => modalCloseRef.current?.focus());
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeModal();
      if (event.key !== "Tab") return;
      const controls = modalRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]');
      if (!controls?.length) return;
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", closeWithEscape);
    return () => document.removeEventListener("keydown", closeWithEscape);
  }, [modal]);
  function applyModal() { if (modal === "title") setData((current) => ({ ...current, title: draft })); if (modal === "intro") setData((current) => ({ ...current, intro: draft })); if (modal === "section") setData((current) => ({ ...current, sections: current.sections.map((item, index) => index === selectedIndex ? { heading: draftHeading, body: draft } : item) })); if (modal === "faq") setData((current) => ({ ...current, faq: current.faq.map((item, index) => index === selectedIndex ? { question: draftQuestion, answer: draft } : item) })); if (modal === "media") setData((current) => ({ ...current, imageUrl: draftImageUrl, imageAlt: draftImageAlt, caption: draft })); closeModal(); }
  async function save() { setActionEnCours("save"); setError(null); try { const payload = toApiData(data, type); const result = selectedId ? await modifierContenu(selectedId, payload) : await creerContenu({ slug: slug.trim(), type, locale, data: payload }); setSelectedId(result.id); setContents((items) => selectedId ? items.map((item) => item.id === result.id ? result : item) : [result, ...items]); setMessage(en ? "Draft saved." : "Brouillon enregistré."); } catch (exception) { setError(exception instanceof ErreurApi ? exception.message : (en ? "Draft saving failed." : "Échec de l’enregistrement.")); } finally { setActionEnCours(null); } }
  async function statusChange() { if (!selectedId) return; const item = contents.find((current) => current.id === selectedId); if (!item) return; setActionEnCours("status"); setError(null); try { const result = item.status === "PUBLISHED" ? await depublierContenu(item.id) : await publierContenu(item.id); setContents((items) => items.map((current) => current.id === result.id ? result : current)); setMessage(item.status === "PUBLISHED" ? (en ? "Page unpublished." : "Page dépubliée.") : (en ? "Page published." : "Page publiée.")); } catch (exception) { setError(exception instanceof ErreurApi ? exception.message : "Status update failed."); } finally { setActionEnCours(null); } }
  async function showHistory() { if (!selectedId) return; try { const result = await listerVersionsContenu(selectedId); setVersions((current) => ({ ...current, [selectedId]: result })); } catch (exception) { setError(exception instanceof ErreurApi ? exception.message : "Version history loading failed."); } }
  async function restore(version: VersionContenuAdmin) { if (!selectedId) return; try { const result = await restaurerVersionContenu(selectedId, version.id); select(result); setMessage(en ? "Version restored as a draft." : "Version restaurée comme brouillon."); } catch (exception) { setError(exception instanceof ErreurApi ? exception.message : "Version restoration failed."); } }

  const selected = contents.find((item) => item.id === selectedId);
  const contenusVisibles = contents.filter((item) => {
    const terme = recherche.trim().toLocaleLowerCase();
    return (!terme || `${item.slug} ${item.type}`.toLocaleLowerCase().includes(terme)) && (filtreStatut === "ALL" || item.status === filtreStatut) && (filtreType === "ALL" || item.type === filtreType);
  });
  useEffect(() => {
    if (contenusVisibles.length > 0 && !contenusVisibles.some((item) => item.id === selectedId)) select(contenusVisibles[0]);
  }, [contenusVisibles, selectedId]);
  const block = "cursor-pointer rounded-xl border border-dashed border-fuchsia-300/50 bg-white/[0.03] p-4 text-left transition hover:border-fuchsia-200 hover:bg-fuchsia-500/10";
  const publishedCount = contents.filter((item) => item.status === "PUBLISHED").length;
  const draftCount = contents.filter((item) => item.status === "DRAFT").length;
  const localeCount = new Set(contents.map((item) => item.locale)).size;
  return <section className="skuup-admin-card" aria-labelledby="content-management-title">
    <h2 id="content-management-title" className="text-xl font-bold text-foreground">{text.title}</h2><p className="mt-2 text-sm text-foreground-muted">{text.description}</p>
    {error && <div className="mt-3 grid gap-2"><p role="alert" className="text-sm text-red-200">{error}</p><button className="skuup-button skuup-button-outline w-fit px-3 py-1 text-xs" type="button" onClick={() => { setError(null); setCleChargement((cle) => cle + 1); }}>Réessayer</button></div>}{message && <p role="status" className="mt-3 text-sm text-emerald-200">{message}</p>}
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs de contenu"><div className="skuup-admin-kpi"><span className="skuup-kicker">Bibliothèque</span><strong>{contents.length}</strong><span>pages API chargées</span></div><div className="skuup-admin-kpi"><span className="skuup-kicker">Publiées</span><strong>{publishedCount}</strong><span>versions visibles</span></div><div className="skuup-admin-kpi"><span className="skuup-kicker">Brouillons</span><strong>{draftCount}</strong><span>à relire</span></div><div className="skuup-admin-kpi"><span className="skuup-kicker">Langues</span><strong>{localeCount}</strong><span>locales présentes</span></div></div>
    <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Filtrer la bibliothèque de contenu"><button type="button" role="tab" aria-selected={filtreStatut === "ALL" && filtreType === "ALL"} className={`skuup-admin-tab ${filtreStatut === "ALL" && filtreType === "ALL" ? "is-active" : ""}`} onClick={() => { setFiltreStatut("ALL"); setFiltreType("ALL"); }}>Toutes ({contents.length})</button><button type="button" role="tab" aria-selected={filtreStatut === "DRAFT"} className={`skuup-admin-tab ${filtreStatut === "DRAFT" ? "is-active" : ""}`} onClick={() => { setFiltreStatut("DRAFT"); setFiltreType("ALL"); }}>Brouillons ({draftCount})</button><button type="button" role="tab" aria-selected={filtreStatut === "PUBLISHED"} className={`skuup-admin-tab ${filtreStatut === "PUBLISHED" ? "is-active" : ""}`} onClick={() => { setFiltreStatut("PUBLISHED"); setFiltreType("ALL"); }}>Publiées ({publishedCount})</button><button type="button" role="tab" aria-selected={filtreType === "FAQ"} className={`skuup-admin-tab ${filtreType === "FAQ" ? "is-active" : ""}`} onClick={() => { setFiltreStatut("ALL"); setFiltreType("FAQ"); }}>FAQ ({contents.filter((item) => item.type === "FAQ").length})</button></div>
    <div className="mt-5 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside><div className="flex items-center justify-between"><h3 className="font-semibold">{text.pages}</h3><button className="skuup-button skuup-button-outline px-2 py-1 text-xs" type="button" onClick={reset}>{text.newPage}</button></div><div className="mt-3 grid gap-2"><input className="skuup-admin-input" aria-label="Rechercher un contenu" value={recherche} onChange={(event) => setRecherche(event.target.value)} placeholder="Rechercher…" /><select className="skuup-admin-input" aria-label="Filtrer par statut" value={filtreStatut} onChange={(event) => setFiltreStatut(event.target.value as typeof filtreStatut)}><option value="ALL">Tous les statuts</option><option value="PUBLISHED">Publié</option><option value="DRAFT">Brouillon</option></select><select className="skuup-admin-input" aria-label="Filtrer par type" value={filtreType} onChange={(event) => setFiltreType(event.target.value as typeof filtreType)}><option value="ALL">Tous les types</option>{types.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><ul className="mt-3 grid gap-2">{contenusVisibles.map((item) => <li key={item.id}><button className={`w-full rounded-lg p-3 text-left text-sm ${selectedId === item.id ? "bg-fuchsia-500/20 ring-1 ring-fuchsia-300" : "bg-white/[0.03]"}`} type="button" onClick={() => select(item)}><strong>{item.slug}</strong><span className="mt-1 block text-xs text-foreground-muted">{item.locale.toUpperCase()} · <span className={item.status === "PUBLISHED" ? "text-emerald-300" : "text-amber-300"}>{item.status}</span> · v{item.version}</span></button></li>)}{contenusVisibles.length === 0 && <li className="text-sm text-foreground-muted">{text.noContent}</li>}</ul></aside>
      <div className="space-y-3"><div className="grid gap-3 md:grid-cols-3"><label className="skuup-admin-field">{text.pageId}<input className="skuup-admin-input" value={slug} disabled={Boolean(selectedId)} onChange={(event) => setSlug(event.target.value)} placeholder="politique-confidentialite" /></label><label className="skuup-admin-field">{text.type}<select className="skuup-admin-input" value={type} onChange={(event) => setType(event.target.value as TypeContenuAdmin)}>{types.map((item) => <option key={item}>{item}</option>)}</select></label><label className="skuup-admin-field">{text.language}<select className="skuup-admin-input" value={locale} onChange={(event) => setLocale(event.target.value as "fr" | "en")}><option value="fr">FR</option><option value="en">EN</option></select></label></div>
        <div className="rounded-2xl border border-white/10 bg-[#171039] p-5 shadow-2xl"><p className="skuup-kicker">{text.preview} · {locale.toUpperCase()}</p><button className={`${block} mt-3 w-full`} type="button" onClick={() => openModal("title")}><span className="text-xs text-fuchsia-200">{text.edit}</span><h3 className="mt-2 text-2xl font-bold">{data.title || text.pageTitle}</h3></button><button className={`${block} mt-3 w-full`} type="button" onClick={() => openModal("intro")}><span className="text-xs text-fuchsia-200">{text.edit}</span><p className="mt-2 whitespace-pre-wrap text-sm text-foreground-muted">{data.intro || text.intro}</p></button>{type === "FAQ" ? <div className="mt-3 grid gap-3">{data.faq.map((item, index) => <button className={block} type="button" key={`faq-${index}`} onClick={() => openModal("faq", index)}><span className="text-xs text-fuchsia-200">{text.edit}</span><h4 className="mt-2 font-semibold">{item.question || text.question}</h4><p className="mt-1 whitespace-pre-wrap text-sm text-foreground-muted">{item.answer || text.answer}</p></button>)}<button className="skuup-button skuup-button-outline text-xs" type="button" onClick={() => setData((current) => ({ ...current, faq: [...current.faq, { question: "", answer: "" }] }))}>{text.addQuestion}</button></div> : type === "MEDIA" ? <button className={`${block} mt-3 w-full`} type="button" onClick={() => openModal("media")}><span className="text-xs text-fuchsia-200">{text.edit}</span>{data.imageUrl && <Image className="mt-2 max-h-48 rounded-lg object-cover" src={data.imageUrl} alt={data.imageAlt} width={640} height={360} />}{data.caption && <p className="mt-2 text-sm text-foreground-muted">{data.caption}</p>}</button> : <div className="mt-3 grid gap-3">{data.sections.map((item, index) => <button className={block} type="button" key={`section-${index}`} onClick={() => openModal("section", index)}><span className="text-xs text-fuchsia-200">{text.edit}</span><h4 className="mt-2 font-semibold">{item.heading || text.heading}</h4><p className="mt-1 whitespace-pre-wrap text-sm text-foreground-muted">{item.body || text.body}</p></button>)}<button className="skuup-button skuup-button-outline text-xs" type="button" onClick={() => setData((current) => ({ ...current, sections: [...current.sections, { heading: "", body: "" }] }))}>{text.addSection}</button></div>}</div>
        <div className="flex flex-wrap gap-2"><button className="skuup-button skuup-admin-button" type="button" onClick={() => void save()} disabled={Boolean(actionEnCours)}>{actionEnCours === "save" ? (en ? "Saving…" : "Enregistrement…") : selectedId ? text.save : text.create}</button>{selected && <button className="skuup-button skuup-button-outline" type="button" onClick={() => void statusChange()} disabled={Boolean(actionEnCours)}>{actionEnCours === "status" ? (en ? "Updating…" : "Mise à jour…") : selected.status === "PUBLISHED" ? text.unpublish : text.publish}</button>}<button className="skuup-button skuup-button-outline" type="button" onClick={() => void showHistory()} disabled={Boolean(actionEnCours)}>{text.history}</button></div>
        {selectedId && versions[selectedId] && <ul className="grid gap-2 rounded-xl border border-white/10 p-3 text-xs">{versions[selectedId].map((version) => <li className="flex items-center justify-between gap-2" key={version.id}><span>Version {version.version} · {version.status}</span><button className="text-fuchsia-200" type="button" onClick={() => void restore(version)}>{text.restore}</button></li>)}</ul>}
      </div>
    </div>
    <section className="mt-6 border-t border-white/10 pt-4"><h3 className="font-semibold">{text.audit}</h3><ul className="mt-3 grid gap-2 text-xs">{audit.slice(0, 8).map((event) => <li className="skuup-admin-list-item" key={event.id}>{event.action} · {event.entityType}</li>)}</ul></section>
    {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="content-block-modal-title"><div ref={modalRef} className="w-full max-w-2xl rounded-2xl border border-fuchsia-300/40 bg-[#15102f] p-6 shadow-2xl"><div className="flex items-center justify-between"><h3 id="content-block-modal-title" className="text-xl font-bold">{text.edit}</h3><button ref={modalCloseRef} className="text-sm text-foreground-muted" type="button" onClick={closeModal}>{text.close}</button></div>{modal === "title" && <label className="skuup-admin-field mt-5">{text.pageTitle}<input className="skuup-admin-input" value={draft} onChange={(event) => setDraft(event.target.value)} /></label>}{modal === "intro" && <label className="skuup-admin-field mt-5">{text.intro}<textarea className="skuup-admin-input min-h-32" value={draft} onChange={(event) => setDraft(event.target.value)} /></label>}{modal === "section" && <div className="mt-5 grid gap-3"><label className="skuup-admin-field">{text.heading}<input className="skuup-admin-input" value={draftHeading} onChange={(event) => setDraftHeading(event.target.value)} /></label><label className="skuup-admin-field">{text.body}<textarea className="skuup-admin-input min-h-48" value={draft} onChange={(event) => setDraft(event.target.value)} /></label></div>}{modal === "faq" && <div className="mt-5 grid gap-3"><label className="skuup-admin-field">{text.question}<input className="skuup-admin-input" value={draftQuestion} onChange={(event) => setDraftQuestion(event.target.value)} /></label><label className="skuup-admin-field">{text.answer}<textarea className="skuup-admin-input min-h-48" value={draft} onChange={(event) => setDraft(event.target.value)} /></label></div>}{modal === "media" && <div className="mt-5 grid gap-3"><label className="skuup-admin-field">{text.imageUrl}<input className="skuup-admin-input" value={draftImageUrl} onChange={(event) => setDraftImageUrl(event.target.value)} /></label><label className="skuup-admin-field">{text.imageAlt}<input className="skuup-admin-input" value={draftImageAlt} onChange={(event) => setDraftImageAlt(event.target.value)} /></label><label className="skuup-admin-field">{text.caption}<textarea className="skuup-admin-input min-h-32" value={draft} onChange={(event) => setDraft(event.target.value)} /></label></div>}<div className="mt-5 flex justify-end gap-2"><button className="skuup-button skuup-button-outline" type="button" onClick={closeModal}>{text.cancel}</button><button className="skuup-button skuup-admin-button" type="button" onClick={applyModal}>{text.confirm}</button></div></div></div>}
  </section>;
}
