---
last_updated: 2026-10-23
owner: Mickael MUR
---

# Design readiness

Status: review

## Décision owner plateformes — 2026-10-22

Le responsable produit confirme Twitch, YouTube et Kick comme plateformes visées par le MVP; la décision et son état de preuve sont consignés dans le [registre de traçabilité](design-traceability-and-open-actions-2026-10-18.md#décision-owner-du-2026-10-22---plateformes-de-visionnage) et dans la spécification fonctionnelle. L’extension prend désormais en charge ces trois plateformes; Facebook reste hors de la cible de visionnage. Les documents sont alignés sur la décision. `Status: review` et toutes les cases d’approbation restent inchangés; l’alignement du code ne vaut pas validation globale.

## Actualisation ACT-11 — 2026-10-22

Le [scan ACT-11 après neuf fichiers suivis modifiés](../quality/evidence/act11-marker-scan-doc-reconciliation-2026-10-22.md) couvre le HEAD de base et le worktree correspondant : HEAD et fichiers suivis, 94/38/13; worktree complet, 95/51/14. Le verdict indépendant `accepted` porte uniquement sur l’inventaire et le classement du scan. ACT-11 reste ouvert; les décisions des owners et les preuves attendues restent à obtenir. Cette actualisation ne change pas la readiness ni son approbation.

## Sources de reprise

Le statut global de conception reste `review`. Les obligations `ACT-01` à
`ACT-13`, leurs responsables proposés et les preuves attendues sont maintenus
dans le [registre de traçabilité](design-traceability-and-open-actions-2026-10-18.md).
Cette page conserve le statut global et ses critères de décision. La
[matrice P0](../quality/p0-evidence-matrix.md) est la source des résultats QA
et limites par story. Une preuve locale ne constitue pas une approbation
indépendante.

La conception DASH-V3 est cadrée dans [dashboard-redesign-2.0.md](dashboard-redesign-2.0.md). Les références structurelles sont dans [dashboard-wireframes-2.0.md](dashboard-wireframes-2.0.md) et le séquencement frontend est décrit dans le plan de migration de ce document. Ces éléments ne valent pas encore validation visuelle indépendante.

## Preuves Docker ajoutées le 2026-10-07

- Stack locale isolée construite avec `docker compose up -d --build` :
  backend, frontend, worker, PostgreSQL et Redis healthy; migration terminée
  sans migration en attente.
- Compte QA local et fixture DASH-V3 opt-in utilisés hors production.
- Six tests E2E authentifiés réussis sur `/dashboard` et `/admin` aux
  viewports 320, 768 et 1280; les six projets mobiles redondants sont ignorés
  par la suite.
- Sauvegarde PostgreSQL custom puis restauration dans une base temporaire
  `skuup_restore` réussie; l'inventaire restauré contient les tables
  applicatives attendues.
- Configuration Dokploy validée par `docker compose ... config --quiet`.

Ces preuves renforcent la validation locale, mais ne remplacent pas l'audit
indépendant, les preuves de conformité et la vérification de la Pull Request.

## Résultats QA par story

Les exécutions, artefacts bruts, limites et statuts QA par story sont maintenus
dans la [matrice P0](../quality/p0-evidence-matrix.md). Elle référence les
archives des runs unitaires du 2026-10-18 et la relance ciblée du 2026-10-23.
Ces preuves ne changent pas le statut global de conception.

## Campagne historique de relecture — HEAD `d64e5e3`

> **Repère historique.** Les références de branche, HEAD et campagnes ci-dessous
> décrivent des campagnes antérieures et ne sont pas une preuve fraîche du
> 2026-10-18. Elles sont conservées pour la traçabilité et doivent être
> revalidées avant toute clôture.

Le périmètre documentaire historiquement relu était la branche de livraison dédiée
`chore/dash-v3-delivery-ready-1-16-30`, HEAD `d64e5e3`. Les preuves brutes de la campagne locale
sont archivées dans
[`docs/quality/evidence/p0-live-2026-10-08/`](../quality/evidence/p0-live-2026-10-08/)
et leur rattachement story → parcours → artefact est détaillé dans
[`docs/quality/p0-evidence-matrix.md`](../quality/p0-evidence-matrix.md).
La campagne historique rattachée à ce HEAD rapporte 44 suites backend et 291 tests
réussis, une suite E2E backend réussie, 143 tests frontend réussis avec 6 tests
ignorés, 59 tests extension réussis et 112 scénarios Playwright live réussis sur
14 routes, aux largeurs 320/768/1280, en paysage et avec zoom 200 %.
La CI GitHub historique `38083799609` confirme six jobs verts sur le même SHA. Ces chiffres
établissent la reproductibilité technique de la campagne Docker et CI, pas la
fidélité perceptuelle complète.

La capture authentifiée de cette campagne antérieure sur les écrans `/dashboard` et `/admin` confirme
que le shell, les navigations et les états contractuels positifs sont rendus,
mais conserve des écarts visuels documentés : densité des données inférieure
aux références, médias métier limités par les fixtures, et panneaux détaillés
moins riches que les planches de référence. Ces écarts maintiennent les
13 lignes de `design-fidelity-matrix-2026-10-11.md` à `PARTIEL`.

Les preuves ne ferment pas les points suivants :

- relecture indépendante de chaque parcours P0, notamment inscription/
  connexion, expiration/révocation, permissions, erreurs et limites, cohérence
  métier et mutations admin;
- exercices d'isolation staging, alerting/astreinte, rollback et restauration,
  suivis post-MVP dans [l'issue #422](https://github.com/Krapaud-Labs/Skkup/issues/422);
- approbation formelle de la conception et décision indépendante de clôture de
  l'audit.

Le snapshot historique des portes dans
[`docs/quality/evidence/p0-live-2026-10-08/gate-snapshot.tsv`](../quality/evidence/p0-live-2026-10-08/gate-snapshot.tsv)
reste une référence historique de statut : `design-gate=needs-review`,
`audit-gate=needs-review` et `delivery-gate=pending`. Les preuves locales ne
justifient ni `Status: approved`, ni `verified`, ni l'ouverture d'une PR.

## Validation

- [x] Cahier des charges accepté et périmètre MVP/Post-MVP arrêté
- [ ] Vision, stories et parcours cohérents : cible owner confirmée (Twitch, YouTube, Kick), code de l’extension aligné et sources documentaires alignées; les preuves indépendantes et la validation globale restent à produire
- [x] Architecture, données, contrats et sécurité documentés pour relecture
- [x] Direction visuelle et médias définis si applicable, avec preuves restantes tracées
- [x] Diagrammes, roadmap et décisions à jour
- [ ] Audit de conception effectué et accepté par un relecteur indépendant
- [ ] Aucun marqueur de complétion non traité : contrôle à refaire après l'audit de conception complet

## Décision historique des relectures — 2026-10-07/08

- Relectures indépendantes : les rapports du 2026-10-07 et du 2026-10-08 concluent `rework`; cette mise à jour documentaire prépare la prochaine relecture sans la préjuger.
- Écarts confirmés : disponibilité et exploitation, données et rollback, rapprochement API/code, preuves de sécurité, preuves P0, parcours admin, médias, traçabilité et marqueurs d'incertitude.
- Auditeur : relecteur indépendant distinct du concepteur; nouvelle relecture requise après corrections
- Date : 2026-10-07
- Décision : Non approuvé. Les corrections du plan et une nouvelle relecture indépendante restent requises.
