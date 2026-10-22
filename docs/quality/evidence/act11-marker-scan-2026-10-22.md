---
last_updated: 2026-10-22
agent_role: concepteur
agent_id: /root/design_draft_semantics
artifact_kind: kit-marker-scan
status: accepted
scope: "ACT-11 scan; separate Git HEAD corpus from worktree corpus"
head: 46ea5e67902f555f72e1adf82883d5b0c1d1a528
head_totals: "94 Markdown files; 38 occurrences; 13 files"
worktree_totals: "95 Markdown files; 51 occurrences; 14 files"
worktree_only_file: docs/project-management/mvp-001-conversation-history-2026-10-20.md
worktree_only_contribution: "13 occurrences in 1 untracked Markdown file; absent from specified HEAD"
baseline_2026_10_18: "90 files; 31 occurrences; 10 files"
evidence: "HEAD scan reads blobs via git ls-tree/git show; worktree scan reads present files. The untracked conversation history is isolated as a separate 13-hit delta; evidence/archive directories excluded in both."
next_action: "Poursuivre la revue des décisions owner et des preuves ACT attribuées; conserver ACT-11 needs-review et design-readiness review."
repo_modified_during_scan: false
---

# Scan ACT-11 révisé — séparation HEAD / worktree

## Résultat et méthode

HEAD demandé et vérifié : 46ea5e67902f555f72e1adf82883d5b0c1d1a528.

Corpus HEAD-only : 94 fichiers Markdown, 38 occurrences dans 13 fichiers. Corpus worktree : 95 fichiers Markdown, 51 occurrences dans 14 fichiers. L’unique différence de corpus non exclue est le fichier non suivi `docs/project-management/mvp-001-conversation-history-2026-10-20.md`, absent du HEAD et porteur de 13 occurrences. Un second fichier non suivi sous `docs/quality/evidence/` est exclu comme evidence.

Le scan est insensible à la casse et cherche exactement : « à vérifier », « à planifier », « à définir », TODO, FIXME, HACK. Une correspondance de terme vaut une occurrence; plusieurs termes sur la même ligne sont comptés séparément. Sont exclus tous les chemins sous les répertoires evidence et archive.

Reproduction HEAD : parcourir `git ls-tree -r --name-only 46ea5e67902f555f72e1adf82883d5b0c1d1a528 docs`, garder les chemins `.md` qui ne contiennent pas un segment `/evidence/` ou `/archive/`, lire chacun par `git show <HEAD>:<path>`, puis pour chaque ligne compter les matches `re.finditer(r'à vérifier|à planifier|à définir|TODO|FIXME|HACK', line, re.I)`. Le même algorithme sur les fichiers présents dans le worktree donne 95/51/14. Aucune empreinte n’est publiée : le précédent manifeste ne décrivait pas correctement son périmètre Git HEAD.

Le relevé versionné précédent du 2026-10-18 annonçait 90 fichiers, 31 occurrences, 10 fichiers. Comparaison au HEAD-only actuel : +4 fichiers, +7 occurrences, +3 fichiers avec hits. Comparaison au worktree : +5 fichiers, +20 occurrences, +4 fichiers avec hits; les +13 hits/+1 fichier additionnels sont entièrement le fichier d’historique non suivi identifié ci-dessus.

## Occurrences présentes au HEAD demandé (38)

| Chemin:ligne | Nombre et contexte | Classement / disposition |
| --- | --- | --- |
| `docs/01-features.md:56` | 1; nom marketing des points à décider avec le client | Décision owner en attente; ACT-01/11, ne pas inventer. |
| `docs/01-features.md:72` | 1; paliers, récompenses, probabilités et expérience des cartes | Décision métier owner ACT-11; règles et valeur à fournir. |
| `docs/01-features.md:139` | 1; coût du code réduction | Décision commerciale owner/Post-MVP ACT-11. |
| `docs/01-features.md:140` | 1; coût du bon d’achat | Décision commerciale owner/Post-MVP ACT-11. |
| `docs/01-features.md:141` | 1; prix ticket hebdomadaire | Décision commerciale owner/Post-MVP ACT-11. |
| `docs/01-features.md:142` | 1; prix ticket mensuel et valeur de premier jet | Décision owner ACT-11; le premier jet n’est pas une valeur décidée. |
| `docs/03-data-model.md:244` | 1; données dérivées et éléments d’export à examiner | Action de conception/conformité existante ACT-03, pas une décision ACT-11. Nouveau hit vs relevé précédent. |
| `docs/08-docker-infra.md:149` | 1; état de configuration Dokploy | Action opérateur ACT-02; ancienne ligne 148 décalée. |
| `docs/13-code-style-audit.md:28` | 3; TODO/FIXME/HACK cités comme termes d’une recherche négative datée | Historique/négatif, aucune dette active déduite. |
| `docs/README.md:40` | 1; couverture QA des stories, tests restants | Action QA attribuée ACT-06; hit nouveau vs relevé précédent. |
| `docs/README.md:50` | 1; expiration/reconnexion extension publiée | Action existante ACT-06/US-003 et ACT-07; ancienne ligne 47 décalée. |
| `docs/README.md:58` | 1; calendrier de roadmap | Décision owner ACT-10; ancienne ligne 54 décalée. |
| `docs/audits/dashboard-v3-admin-independent-visual-audit-2026-10-05-r2.md:68` | 1; branchement route à vérifier après intégration | Mention historique de campagne/branche; revalider seulement si écran repris. |
| `docs/audits/dashboard-v3-assets-accessibility-2026-10-03.md:10` | 1; TODO cité dans recherche de placeholder négative | Historique/négatif. |
| `docs/audits/frontend-static-notifications-prototype-2026-10-18.md:118` | 1; layout topbar/menu/scroll à vérifier dans rendu ultérieur | Action de revue responsive du prototype ACT-08; hit nouveau vs baseline. |
| `docs/audits/frontend-static-notifications-prototype-2026-10-18.md:138` | 1; limites de rendu et d’accessibilité du prototype | Action/proof gap ACT-08; hit nouveau vs baseline, ne vaut pas validation produit. |
| `docs/audits/qa-story-criteria-crosscheck-2026-10-18.md:248` | 1; todo dans le décompte de test à zéro | Résultat historique, pas tâche active; hit nouveau vs baseline. |
| `docs/design/adr-011-viewer-notifications-announcements-modal-2026-10-18.md:50` | 1; la décision définit une cible à vérifier | Métaréf d’état de preuve/readiness. |
| `docs/design/adr-011-viewer-notifications-announcements-modal-2026-10-18.md:72` | 1; brouillons/archivage et représentation du modèle restent à vérifier | Action de conception ACT-04/11; le cycle cible est documenté, code/tests restent à vérifier. Reclassé depuis l’ancien repère ADR session/permission; ajoute un hit net. |
| `docs/design/api-contract-audit-2026-10-18.md:76` | 1; HTTP, permissions, quotas et audit à vérifier | Actions de preuve existantes ACT-04/05/06. |
| `docs/design/design-readiness.md:27` | 3; termes listés dans le critère générique de gate | Métaréf ACT-11/13; une checklist, pas trois tâches. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:88` | 2; libellés ACT-11 entre guillemets | Métaréf de registre, pas deux actions nouvelles. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:446` | 1; todo dans résultats de test à zéro | Résultat historique/négatif; hit nouveau vs baseline. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:730` | 3; termes de recherche cités dans renvoi à l’audit de code 2026-09-09 | Métaréf historique/négatif, non marqueurs actifs. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:731` | 1; constat visuel « après intégration » | Historique/négatif de campagne ancienne; rendu à revalider seulement si repris. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:743` | 5; expressions énumérées dans la méthode du scan précédent | Métaréf de méthode; cinq hits prévus. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:754` | 1; renvoi au contrôle Dokploy | Métaréf de lien vers action ACT-02 existante. |

Total HEAD : 38 occurrences dans 13 fichiers. Le tableau compte tous les termes multiples par ligne.

## 13 occurrences worktree-only

| Chemin:ligne | Nombre et contexte | Classement |
| --- | --- | --- |
| `docs/project-management/mvp-001-conversation-history-2026-10-20.md:42` | 1; ancien cadrage sur documents manquants/à vérifier | Historique, non actif. |
| `docs/project-management/mvp-001-conversation-history-2026-10-20.md:766` | 1; prototype et captures demandés pour ancienne revue | Historique remplacé par checkpoints ultérieurs. |
| `docs/project-management/mvp-001-conversation-history-2026-10-20.md:875` | 1; provenance du chiffre/badge à vérifier | Ancien checkpoint d’enquête UI. |
| `docs/project-management/mvp-001-conversation-history-2026-10-20.md:883` | 1; capture antérieure et carte Annoncements | Historique d’audit; pas action courante nouvelle. |
| `docs/project-management/mvp-001-conversation-history-2026-10-20.md:909` | 1; provenance à vérifier | Ancien checkpoint, déjà suivi par ACT-08. |
| `docs/project-management/mvp-001-conversation-history-2026-10-20.md:946` | 1; calendrier roadmap à définir | Historique; décision owner actuelle documentée README:58. |
| `docs/project-management/mvp-001-conversation-history-2026-10-20.md:2473` | 1; point formulaire à vérifier | Ancienne reprise QA, pas action ACT-11 distincte. |
| `docs/project-management/mvp-001-conversation-history-2026-10-20.md:2737` | 3; TODO/FIXME/HACK cités dans demande de scan | Historique de délégation; la citation ne crée pas de dettes. |
| `docs/project-management/mvp-001-conversation-history-2026-10-20.md:4166` | 1; CI #411 restait à vérifier | Checkpoint ancien, ne prouve pas l’état CI vivant. |
| `docs/project-management/mvp-001-conversation-history-2026-10-20.md:4174` | 1; même état CI #411 | Historique ancien/duplicatif. |
| `docs/project-management/mvp-001-conversation-history-2026-10-20.md:10518` | 1; route/guards et version de code restaient à vérifier | Historique d’audit; revalider dans l’action ACT compétente si toujours requis. |

Total worktree-only : 13 occurrences dans ce seul fichier non suivi; toutes sont des traces historiques de conversation, pas de nouvelles décisions ou tâches produit. Cette différence ne doit pas être attribuée au HEAD.

## Delta et disposition

Les +7 occurrences HEAD vs relevé du 18 octobre sont localisées dans les nouveaux/reclassés : `docs/03-data-model.md:244` (+1), `docs/README.md:40` (+1), l’audit prototype statique (+2), le crosscheck QA au mot todo (+1), `docs/design/design-traceability-and-open-actions-2026-10-18.md:446` au mot todo (+1), et le nouvel hit ADR brouillons/modèle à la ligne 72 (+1). Les fichiers nouvellement touchés sont data model, audit frontend statique et audit QA, soit +3 fichiers; les autres anciens hits ont été déplacés avec insertions ou reclassés. L’ancienne occurrence ADR relative à la session n’est plus le même hit textuel.

Disposition : le rapport révisé est versionné et référencé dans le registre ACT-11 ainsi que dans `docs/README.md`, après la relecture indépendante acceptée. Les décisions métier restent en attente owner, les preuves ACT déjà attribuées restent ouvertes et ACT-11 demeure `needs-review`. Les occurrences historiques et les résultats négatifs sont conservés sans être convertis en tâches.

Le scan HEAD/worktree et le classement sont acceptés pour cette portée. Aucun fichier du dépôt n’a été édité. Ce rapport ne clôt ni les décisions owner, ni les actions ACT, ni la readiness globale.


## Relecture indépendante

- Rôle : Auditeur indépendant (`/root/draft_semantics_independent_audit`).
- Verdict : `accepted` pour la portée limitée de la relecture du scan, sans approbation globale.
- Vérification : reproduction HEAD 94/38/13 et worktree 95/51/14; les 13 occurrences supplémentaires proviennent du seul historique de conversation non suivi; méthode, inventaire, delta baseline et classements concordent. Aucune empreinte invérifiable n'est revendiquée.
- Limite : cette relecture ne clôt ni ACT-11, ni les décisions owner, ni les autres preuves ou portes de design-readiness.
