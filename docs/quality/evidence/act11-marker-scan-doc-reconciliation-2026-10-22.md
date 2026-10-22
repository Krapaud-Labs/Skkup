---
last_updated: 2026-10-22
agent_role: concepteur
agent_id: /root/design_draft_semantics
artifact_kind: kit-marker-scan
status: accepted
scope: ACT-11 Markdown markers under docs at base HEAD 94fe5a25a2858d5cfd87c91bd3ced23adfbf24d5 and current worktree, excluding evidence/archive
head: 94fe5a25a2858d5cfd87c91bd3ced23adfbf24d5
head_totals: "94 Markdown files; 38 occurrences; 13 files"
tracked_worktree_totals: "94 Markdown files; 38 occurrences; 13 files"
worktree_totals: "95 Markdown files; 51 occurrences; 14 files"
tracked_modified_files_initial_snapshot: "5 tracked files at the initial scan; counts and marker inventory are a historical snapshot"
tracked_modified_files_before_audit_corrections: "7 tracked files before this audit correction, including the two later readiness and traceability documents"
tracked_modified_files_current: "9 tracked files after this audit correction; the two new product sources are added to the prior seven, while README remains in the initial five"
untracked_aggregate: "3 local untracked Markdown files including this report; 2 pre-existed, of which 1 eligible historic file contributes 13 occurrences and 1 lies under excluded evidence; this report also lies under excluded evidence; no historic file path, line, or content is reproduced"
evidence: "Read-only reproduction from git blobs at HEAD and present worktree; exact current tracked inventory totals 38, plus 13 aggregate-only hits from one local untracked Markdown file; previous baseline report was 90/31/10"
next_action: "Poursuivre les décisions owner et preuves ACT ouvertes; conserver ACT-11 et design-readiness en review malgré l’acceptation limitée du scan."
repo_modified: true
---

# Scan ACT-11 après réconciliation documentaire

## Périmètre et résultats

HEAD de base vérifié : `94fe5a25a2858d5cfd87c91bd3ced23adfbf24d5`.

| État | Corpus Markdown admissible sous `docs` | Occurrences | Fichiers avec occurrences |
| --- | ---: | ---: | ---: |
| HEAD seulement | 94 | 38 | 13 |
| Worktree, fichiers suivis uniquement | 94 | 38 | 13 |
| Worktree, incluant les fichiers locaux non suivis admissibles | 95 | 51 | 14 |

Le premier snapshot de cette passe comptait cinq fichiers suivis modifiés : `docs/00-overview.md`, `docs/01-features.md`, `docs/README.md`, `docs/delivery/roadmap.md` et `docs/design/data-model.md`. Avant les corrections de cet audit, le compte était de sept après les modifications ultérieures de `docs/design/design-readiness.md` et `docs/design/design-traceability-and-open-actions-2026-10-18.md`. Après les corrections de `docs/product/user-stories.md` et `docs/product/vision-and-scope.md`, le compte courant est de neuf fichiers suivis modifiés; README demeure l'un des cinq du snapshot initial. Les totaux de marqueurs du corpus suivi restent à 94/38/13. Les changements de readiness, registre, stories et vision ne modifient pas les occurrences du scan.

Trois fichiers Markdown locaux non suivis sont présents au moment de la rédaction : les deux préexistants et le présent rapport. Un seul des deux préexistants appartient au corpus admissible et explique les `+13` occurrences et le fichier supplémentaire du worktree; l'autre se trouve dans un répertoire `evidence` exclu. Le présent rapport se trouve aussi sous `evidence` et est exclu. Pour le fichier historique local non suivi, ce rapport ne reproduit aucun nom, chemin, ligne, extrait ou contenu, seulement son agrégat.

Le relevé de baseline précédent annonçait `90 fichiers / 31 occurrences / 10 fichiers`. Le delta HEAD-only est donc `+4 / +7 / +3`; le delta du worktree complet est `+5 / +20 / +4`, dont les `+13 / +1` issus du fichier local non suivi admissible. La baseline est conservée comme comparaison historique, sans attribuer les écarts à une dette active.

## Méthode reproductible

Corpus : fichiers `*.md` sous `docs`, en excluant tout chemin contenant un segment `evidence` ou `archive`. Les fichiers non suivis sont exclus de la comparaison HEAD et du sous-total worktree-suivi. La recherche, insensible à la casse, compte séparément chaque occurrence de `à vérifier`, `à planifier`, `à définir`, `TODO`, `FIXME` ou `HACK`; plusieurs termes sur une ligne comptent chacun. Aucun scan de code source ou autre format n'est inclus.

Pour reproduire le HEAD : obtenir `git ls-tree -r --name-only 94fe5a25a2858d5cfd87c91bd3ced23adfbf24d5 docs`, garder les chemins Markdown admissibles, lire chaque blob avec `git show <HEAD>:<path>`, puis compter les correspondances ligne par ligne. Pour le worktree suivi, parcourir `git ls-files docs` admissibles et lire les fichiers présents. Pour le total worktree, ajouter les fichiers Markdown non suivis admissibles; dans ce rapport, en publier uniquement le nombre agrégé pour le fichier historique local. La regex de référence est `à vérifier|à planifier|à définir|TODO|FIXME|HACK` avec l'option insensible à la casse.

## Inventaire occurrence par occurrence des fichiers suivis au worktree (38)

| Chemin:ligne | Nombre et contexte bref | Classement et disposition |
| --- | ---: | --- |
| `docs/01-features.md:55` | 1; nom marketing des points | Décision owner ACT-01/11; en attente, aucun nom à inventer. |
| `docs/01-features.md:131` | 1; coût d'un code de réduction V1.1 | Valeur commerciale différée hors MVP; ne bloque pas MVP. |
| `docs/01-features.md:132` | 1; coût d'un bon d'achat V1.1 | Valeur commerciale différée hors MVP; ne bloque pas MVP. |
| `docs/01-features.md:133` | 1; coût d'un ticket hebdomadaire boutique V1.1 | Valeur commerciale différée hors MVP; ne bloque pas MVP. |
| `docs/01-features.md:134` | 1; coût d'un ticket mensuel boutique V1.1 | Valeur commerciale différée hors MVP; ne bloque pas MVP. |
| `docs/01-features.md:150` | 1; renvoi générique au coût du ticket boutique, section V1.1 | Référence redondante aux mêmes paramètres commerciaux différés que lignes 131-134; ne constitue pas une décision owner distincte. |
| `docs/03-data-model.md:244` | 1; catégories et éléments d'export à examiner | Action de conception/conformité déjà attribuée ACT-03; ne pas convertir en décision ACT-11. |
| `docs/08-docker-infra.md:149` | 1; état de configuration Dokploy | Vérification opérateur déjà attribuée ACT-02; pas une preuve fraîche. |
| `docs/13-code-style-audit.md:28` | 3; TODO/FIXME/HACK dans le constat de recherche négative | Historique limité à son audit daté; aucune dette active déduite. |
| `docs/README.md:40` | 1; critères QA par story encore à vérifier | Action QA existante ACT-06; le marqueur ne prouve pas une tâche additionnelle. |
| `docs/README.md:50` | 1; expiration et reconnexion extension publiée | Preuve déjà attribuée ACT-06/US-003 et ACT-07. |
| `docs/README.md:59` | 1; roadmap, stories annonces, calendrier et budget | Rattachement annonces→stories : action documentaire autonome; calendrier/budget : décision owner ACT-10 toujours `needs-review`. |
| `docs/audits/dashboard-v3-admin-independent-visual-audit-2026-10-05-r2.md:68` | 1; branchement de route à vérifier après intégration | Constat historique de campagne; revalider seulement si l'écran est repris. |
| `docs/audits/dashboard-v3-assets-accessibility-2026-10-03.md:10` | 1; TODO dans une recherche négative de placeholders | Historique/négatif, non action actuelle. |
| `docs/audits/frontend-static-notifications-prototype-2026-10-18.md:118` | 1; ajustements de rendu ultérieur | Revue responsive du prototype déjà rattachée ACT-08; ne démontre pas le rendu produit. |
| `docs/audits/frontend-static-notifications-prototype-2026-10-18.md:138` | 1; limites du prototype à examiner | Preuve de rendu/accessible ACT-08 encore limitée; action déjà suivie. |
| `docs/audits/qa-story-criteria-crosscheck-2026-10-18.md:248` | 1; `todo` dans un décompte de résultats de test | Rapport historique; valeur zéro, pas un TODO produit. |
| `docs/design/adr-011-viewer-notifications-announcements-modal-2026-10-18.md:50` | 1; décisions cibles à vérifier | Métaréférence à l'état des preuves, pas une décision métier. |
| `docs/design/adr-011-viewer-notifications-announcements-modal-2026-10-18.md:72` | 1; le modèle observé n'a pas de statut brouillon | Action/proof gap de contrat ACT-04/11; le cycle cible est spécifié, son code reste à prouver. |
| `docs/design/api-contract-audit-2026-10-18.md:76` | 1; vérifications HTTP, permissions, quotas et audit | Preuves déjà attribuées ACT-04/05/06. |
| `docs/design/design-readiness.md:31` | 3; termes énumérés dans le critère général du gate | Métaréférence ACT-11/13; trois libellés, pas trois décisions actives. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:88` | 2; libellés des catégories du registre ACT-11 | Métaréférences de scan, pas deux actions autonomes. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:446` | 1; `todo` dans un relevé de tests à zéro | Résultat historique/négatif. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:730` | 3; marqueurs cités dans le constat d'audit code du 2026-09-09 | Méthode/historique; ne vaut pas scan courant du code. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:731` | 1; « après intégration » dans l'audit visuel du 2026-10-05 | Constat historique; revalider seulement si l'écran est repris. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:743` | 5; expressions citées dans la méthode du précédent scan | Métaréférences de méthode, pas cinq marqueurs produit. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:754` | 1; renvoi à l'état Dokploy | Métaréférence au contrôle opérateur déjà affecté ACT-02. |

Somme vérifiée : 38 occurrences dans 13 fichiers Markdown suivis. Les totaux incluent les termes multiples sur une même ligne.

## Disposition

Les marqueurs actuels restent classés comme décisions owner différées, actions déjà attribuées, mentions historiques/négatives ou métaréférences. Aucun n'est converti en tâche produit uniquement parce que le motif de scan le trouve. Les décisions owner restent `needs-review`; les valeurs commerciales hors MVP ne sont pas des blockers de cette carte. L'ajout de ce scan ne modifie ni le README, ni le registre traceability, ni les autres fichiers. Il ne ferme pas ACT-11 et ne change pas `design-readiness`.

## Validation et limite

La relecture indépendante est `accepted` pour l’inventaire et le classement de ce scan uniquement. Elle ne vaut pas approbation globale et ne ferme ni ACT-11, ni les décisions owner, ni les preuves attendues; `design-readiness` reste en `review`.
