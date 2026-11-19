---
last_updated: 2026-11-19
---

# Relevé ACT-11 des marqueurs du worktree

Date : 2026-11-18
Branche : `codex-architecture-docs-preserve-stack-2026-11-18`
Révision HEAD : `d3679cac73630e0e61ad840ac503952290e3e93f` (`origin/dev`)
Nature : inventaire documentaire, aucun arbitrage métier ni approbation de conception.

## Méthode et résultat

Le corpus comprend les fichiers Markdown sous `docs/`, hors tout chemin ayant
un segment `archive` ou `evidence`. Les chemins HEAD proviennent de
`git ls-tree -r --name-only HEAD -- docs` et leur contenu est lu avec
`git show HEAD:<chemin>`. Les chemins du worktree proviennent de
`git ls-files -co --exclude-standard -- docs` et leur contenu est lu sur disque.
La recherche, insensible à la casse, compte chaque occurrence de
`à vérifier|à planifier|à définir|TODO|FIXME|HACK` et le marqueur réservé
de complétion entre doubles crochets, y compris
dans les explications de méthode et les sources historiques.

| Corpus | Fichiers Markdown | Occurrences | Fichiers touchés |
|---|---:|---:|---:|
| HEAD `d3679cac73630e0e61ad840ac503952290e3e93f` | 90 | 34 | 13 |
| Worktree non ignoré, recalculé le 2026-11-19 | 91 | 33 | 13 |
| Delta worktree moins HEAD | +1 | -1 | 0 |

L'unique occurrence en moins se trouve dans le registre de traçabilité, dans
la reformulation du statut des prix de récompenses V1.1. Le prix demeure à
renseigner; aucune décision produit n’est réputée prise. Le worktree comprend
un fichier de plus que HEAD : `docs/design/adr-017-auth-realtime-module-boundary.md`.
Cette proposition ne contient aucun marqueur de la recherche. Le nombre de
fichiers touchés reste 13.

## Classement des occurrences du worktree

Les nombres indiquent le total des occurrences aux lignes citées. Les entrées
« décision/proof ouverte » restent à suivre par leur owner; les mentions
« historique/méthode » ne sont pas de nouvelles tâches produit.

| Source | Occ. | Classement et disposition |
|---|---:|---|
| `docs/01-features.md:59` | 1 | Décision Produit sur le nom marketing des points; conserver ouverte (ACT-01/11). |
| `docs/03-data-model.md:320` | 1 | Données personnelles et rétention à qualifier par Data/Conformité (ACT-03). |
| `docs/05-security.md:737` | 1 | Preuves de sécurité restant à produire par Sécurité/Conformité (ACT-05). |
| `docs/08-docker-infra.md:159` | 1 | État Dokploy à vérifier par DevOps (ACT-02); le scan ne prouve pas l’état de production. |
| `docs/audits/dashboard-v3-admin-independent-visual-audit-2026-10-05-r2.md:68` | 1 | Note d’un audit de route ancien; historique, ne prouve pas le rendu courant. |
| `docs/audits/dashboard-v3-assets-accessibility-2026-10-03.md:10` | 1 | Terme TODO cité comme chaîne de recherche dans un audit ancien; métadonnée. |
| `docs/audits/frontend-static-notifications-prototype-2026-10-18.md:118` | 1 | Vérifications futures du prototype statique; historique, aucune preuve navigateur actuelle. |
| `docs/audits/frontend-static-notifications-prototype-2026-10-18.md:138` | 1 | Preuve de rendu encore requise pour ce prototype; garder le statut `needs-review` (ACT-08/11). |
| `docs/audits/qa-story-criteria-crosscheck-2026-10-18.md:255` | 1 | Résultat de comptage rapporté par une QA historique; métadonnée, pas une tâche active. |
| `docs/code-style-audit.md:32` | 3 | `TODO`, `FIXME`, `HACK` sont cités comme termes d’une recherche ancienne; métadonnée. |
| `docs/design/adr-011-viewer-notifications-announcements-modal-2026-10-18.md:72` | 1 | Formulation de l’ADR à vérifier; décision/conception à maintenir ouverte (ACT-04/11). |
| `docs/design/adr-011-viewer-notifications-announcements-modal-2026-10-18.md:97` | 1 | Point de contrôle historique; statut `needs-review` conservé, preuve actuelle non présumée. |
| `docs/design/api-contract-audit-2026-10-18.md:81` | 1 | Lacune d’intégration API encore suivie (ACT-04/05/06). |
| `docs/design/api-contract-audit-2026-10-18.md:278` | 1 | Cas d’intégration et d’erreur sans preuve complète; garder ouvert (ACT-04/05/06). |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:110` | 2 | Vocabulaire de la taxonomie ACT-11; les deux occurrences décrivent le registre, pas deux exigences produit. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:549` | 1 | Décompte de tests d’un relevé historique; ne vaut pas validation actuelle. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:747` | 1 | Preuve globale d’accessibilité/références encore à produire; aucune approbation du design gate (ACT-08). |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:871` | 3 | Termes de recherche cités par un rapport de style daté; métadonnée historique. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:872` | 1 | Vérification conditionnelle sur une ancienne route; préserver l’historique, ne pas prétendre l’avoir rejouée. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:884` | 5 | Expressions de la méthode du précédent scan; référence méthodologique historique. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:895` | 1 | État Dokploy à confirmer par DevOps; suivi ACT-02 toujours ouvert. |
| `docs/product/user-flows.md:14` | 1 | Règles métier FLOW-004 sur participation/tickets non décidées; Produit, `needs-review` (US-009/ACT-11). |
| `docs/product/user-flows.md:15` | 1 | Règles de gestion et de publication FLOW-005 non décidées; Produit, `needs-review` (US-010/ACT-11). |
| `docs/product/user-flows.md:16` | 1 | Déclencheur et réclamation FLOW-006 incomplets; Produit/Data, `needs-review` (US-011/ACT-03/11). |

## Limites

Ce relevé classe les marqueurs du corpus documentaire, mais ne valide pas les
choix métier, le code exécuté, les preuves QA, l’accessibilité, la conformité
juridique, Dokploy ou le design. Il ne ferme aucune ligne ACT et ne modifie pas
`docs/design/design-readiness.md`. Revue indépendante le 2026-11-18 : PASS sur
les comptes HEAD/worktree, le classement des 33 occurrences et les liens vers
le relevé courant. Cette revue est limitée à l’inventaire ACT-11; elle ne ferme
aucune décision owner ni le design gate.
