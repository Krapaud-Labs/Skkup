# Relevé ACT-11 des marqueurs dans le worktree

Date : 2026-11-07<br>
Révision HEAD : `e0bdd463197f54d84531ac9017625090554fd02f` (`dev`)
Nature : inventaire documentaire, aucun arbitrage métier ni approbation de conception.

## Méthode et résultats

Corpus Markdown sous `docs/`, en excluant tout chemin contenant un segment
`archive` ou `evidence`. Le corpus de HEAD est énuméré par `git ls-tree`; le
corpus du worktree comprend les chemins suivis et non suivis, non ignorés,
énumérés par `git ls-files -co --exclude-standard`. La recherche est
insensible à la casse et compte chaque occurrence des expressions
`à vérifier|à planifier|à définir|TODO|FIXME|HACK|[[A_COMPLETER]]`.
L’occurrence est comptée même si elle apparaît dans une explication historique
ou dans une description de la méthode; ces cas sont classés ci-dessous comme
métadonnées ou historique, pas comme tâches produit nouvelles.

| Corpus | Fichiers Markdown | Occurrences | Fichiers touchés |
|---|---:|---:|---:|
| HEAD `e0bdd463197f54d84531ac9017625090554fd02f` | 89 | 35 | 13 |
| Worktree non ignoré | 90 | 40 | 14 |
| Delta | +1 | +5 | +1 |

Comparaison des comptes par chemin et expression détectée : cinq occurrences
nouvelles, aucune retirée. Les cinq nouveautés sont toutes dans des ajouts
documentaires; aucune ne masque la décision `needs-review`. Les lignes ont
pu être reformulées depuis HEAD; la comparaison par ligne brute n'est donc pas
utilisée pour le delta.

## Deltas depuis HEAD

| Source | Occurrences nouvelles | Classe et suivi |
|---|---:|---|
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:56` | 1 | US-009, exigences de tickets encore inconnues. Décision attendue du Produit; conserver `needs-review`, ne pas déduire acquisition, coût, éligibilité, consommation, limites ou priorité. Suivi ACT-01/04/11 dans le registre canonique. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:747` | 1 | ACT-08, preuve globale de références et d’accessibilité restant à établir. C’est une limite de preuve et non une approbation; conserver `needs-review`. Frontend, Accessibilité et Auditeur gardent les actions consignées dans le registre. |
| `docs/product/user-flows.md:14` | 1 | FLOW-004, règles de participation inconnues. Décision attendue du Produit; conserver `needs-review` et le lien US-009/ACT-11. |
| `docs/product/user-flows.md:15` | 1 | FLOW-005, règles d’administration des tirages non spécifiées. Décision attendue du Produit; conserver `needs-review` et le lien US-010/ACT-11. |
| `docs/product/user-flows.md:16` | 1 | FLOW-006, déclencheur de notification et procédure de réclamation incomplets. Décision attendue du Produit; conserver `needs-review` et le lien US-011/ACT-03/11. |

## Classement des occurrences du worktree

Les chemins ci-dessous sont relatifs à la racine du dépôt. Le nombre indique
les occurrences sur la ligne ou le groupe de lignes indiqué. Les états
`needs-review` préservent les décisions ou preuves manquantes. Les mentions
historiques et les chaînes de recherche sont classées explicitement afin de ne
pas les confondre avec des décisions métier actives.

| Source | Occ. | Classe, owner/action et disposition |
|---|---:|---|
| `docs/01-features.md:59` | 1 | Nom marketing à confirmer; Produit décide. ACT-01/11, `needs-review`. |
| `docs/01-features.md:137-140` | 4 | Valeurs commerciales V1.1 différées; Produit consigne une décision si elles entrent dans le périmètre. Hors MVP, aucune valeur inventée. |
| `docs/01-features.md:156` | 1 | Règles de ticket à gratter inconnues; Produit, ACT-11, `needs-review`. |
| `docs/03-data-model.md:250` | 1 | Rétention/export à examiner; Data et Conformité, ACT-03, `needs-review`. |
| `docs/05-security.md:714` | 1 | Contrôles ouverts; Sécurité et Conformité, ACT-05, `needs-review`. |
| `docs/08-docker-infra.md:149` | 1 | Vérification opérateur Dokploy à réaliser; DevOps, ACT-02, ouverte. |
| `docs/audits/dashboard-v3-admin-independent-visual-audit-2026-10-05-r2.md:68` | 1 | Ancien contrôle de route, preuve historique datée; ne décrit pas une nouvelle tâche active. |
| `docs/audits/dashboard-v3-assets-accessibility-2026-10-03.md:10` | 1 | Terme de recherche dans un audit historique; métadonnée de méthode, pas une action produit. |
| `docs/audits/frontend-static-notifications-prototype-2026-10-18.md:118,138` | 2 | Vérifications futures du prototype; historique, à ne pas présenter comme preuve navigateur actuelle. |
| `docs/audits/qa-story-criteria-crosscheck-2026-10-18.md:248` | 1 | Résultat historique de décompte nul; métadonnée d’audit. |
| `docs/code-style-audit.md:32` | 3 | Expressions d’une ancienne recherche négative; historique/métadonnée, aucun TODO produit. |
| `docs/design/adr-011-viewer-notifications-announcements-modal-2026-10-18.md:50` | 1 | Limite de preuve du comportement cible; Produit/QA, conserver le suivi ACT-08/11. |
| `docs/design/adr-011-viewer-notifications-announcements-modal-2026-10-18.md:72` | 1 | ADR en brouillon, incohérence de statut à résoudre par le propriétaire de décision et le Concepteur; ACT-04/11, `needs-review`. |
| `docs/design/api-contract-audit-2026-10-18.md:81,278` | 2 | Lacunes de preuve API; Backend/QA, ACT-04/05/06, ouvertes. |
| `docs/design/api-contracts.md:108` | 1 | Preuve de branche de livraison manquante; Release/QA, ACT-04/12, ouverte. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:56` | 1 | Nouveau delta US-009; décision Produit, ACT-01/04/11, `needs-review`. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:110` | 2 | Vocabulaire déclencheur dans la taxonomie ACT-11; métadonnée explicative, pas deux exigences produit. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:549` | 1 | Ancien résultat de test du décompte; historique, à interpréter avec son rapport source. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:747` | 1 | Nouveau delta ACT-08; preuve globale d’accessibilité non close, owners Frontend/Accessibilité/Auditeur, `needs-review`. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:871` | 3 | Vocabulaire du relevé historique; méthode/métadonnée, pas trois nouvelles tâches. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:872` | 1 | Revalidation historique d’une route si l’écran est repris; conditionnelle, à conserver dans le registre, sans la déclarer réalisée. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:884` | 5 | Termes de recherche de l’ancien rapport; référence méthodologique historique. |
| `docs/design/design-traceability-and-open-actions-2026-10-18.md:895` | 1 | Action Dokploy ACT-02; owner DevOps, toujours ouverte. |
| `docs/product/user-flows.md:14-16` | 3 | Nouveaux deltas FLOW-004/005/006; règles Produit non décidées, lier aux US concernées, garder `needs-review`. |

## Limites

Ce scan vérifie le corpus documentaire et ses marqueurs, pas la validité des
décisions métier, le code exécuté, les contrôles d’accessibilité, l’état
juridique ni l’approbation de conception. Il ne ferme aucune ligne ACT et ne
modifie pas `docs/design/design-readiness.md`. Le 2026-11-07, l’Auditeur a
accepté indépendamment l’inventaire et le classement des occurrences; ce
verdict limité ne ferme aucune décision owner ni la readiness globale.
