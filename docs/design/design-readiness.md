---
last_updated: 2026-11-19
owner: Mickael MUR
---

# Design readiness

Status: review

## Décision owner plateformes — 2026-10-22

Le responsable produit confirme Twitch, YouTube et Kick comme plateformes visées par le MVP; la décision et son état de preuve sont consignés dans le [registre de traçabilité](design-traceability-and-open-actions-2026-10-18.md#décision-owner-du-2026-10-22---plateformes-de-visionnage) et dans la spécification fonctionnelle. L’extension prend désormais en charge ces trois plateformes; Facebook reste hors de la cible de visionnage. Les documents sont alignés sur la décision. `Status: review` et toutes les cases d’approbation restent inchangés; l’alignement du code ne vaut pas validation globale.

## Actualisation ACT-11 — 2026-10-22

Le [scan ACT-11 après neuf fichiers suivis modifiés](../quality/evidence/act11-marker-scan-doc-reconciliation-2026-10-22.md) couvre le HEAD de base et le worktree correspondant : HEAD et fichiers suivis, 94/38/13; worktree complet, 95/51/14. Le verdict indépendant `accepted` porte uniquement sur l'inventaire et le classement du scan. ACT-11 reste ouvert; les décisions des owners et les preuves attendues restent à obtenir. Cette actualisation ne change pas la readiness ni son approbation.

## Scan ACT-11 — 2026-11-18

Le [relevé ACT-11 du 2026-11-18](../quality/evidence/act11-marker-scan-2026-11-18/README.md)
compare le HEAD `d3679cac` au worktree non ignoré tel qu'il était le 2026-11-18,
avant l'ajout d'ADR-017 : 90 fichiers Markdown et 34 occurrences dans HEAD,
90 fichiers et 33 occurrences dans ce snapshot du worktree. Le recalcul du
2026-11-19, après l'ajout d'ADR-017, est consigné dans la section ci-dessous.
L’unique occurrence retirée suit une reformulation documentaire; la décision
associée reste ouverte. Revue indépendante PASS limitée aux comptes, au
classement et aux liens. Les owners et preuves de fond restent ouverts, et
`Status: review` ainsi que les cases d’approbation restent inchangés.

## Preuves QA ciblées — 2026-11-18

La [matrice P0](../quality/p0-evidence-matrix.md) consigne cinq suites E2E
backend exécutées sous Docker, 8 tests réussis au total, ainsi qu’un smoke
Playwright desktop de la vitrine, 1/1, avec son artefact conservé. Ces résultats
restent limités aux parcours testés : ils ne constituent ni une revue juridique,
ni une revue responsive ou navigateur complète, et ne ferment aucune story ou
gate. `Status: review` est maintenu et la case d’audit indépendant complet reste
décochée.

## Relecture indépendante globale — 2026-11-18

La dernière relecture documentaire indépendante ne relève plus de contradiction
entre la checklist, le registre de traçabilité et la matrice P0 dans le périmètre
vérifié; les entrées US-005/006 sont désormais alignées sur les runs du
2026-11-18. Son verdict global reste `REWORK`: l'audit de conception n'est pas
accepté, ACT-10 attend des owners, vérificateurs, jalons et critères de sortie.
La baseline produit prudente US-009..011 a été mandatée le 2026-11-19 et
consignée dans `docs/delivery/readiness-decision-request.md`; les validations
juridiques, Data/Conformité, implémentation et preuves restent ouvertes, comme
ACT-03/09 et ERR-HEARTBEAT. La revue confirme donc `Status: review` et
ne ferme aucune case. La proposition d'architecture interne conserve la stack;
sa section d'invariants et de critères de sortie a reçu un PASS indépendant
limité à la cohérence avec l'architecture documentée. Les changements
structurels restent soumis au gate de conception.

## Relecture indépendante globale — 2026-11-19

Verdict global `REWORK`; `Status: review` et la case d'audit indépendant
accepté restent inchangés. La relecture a vérifié le cahier accepté, le
registre ACT-01..13, la matrice P0, les références DASH-V3, les preuves
ACT-11/P0 et l'issue GitHub #422. L'issue #422 est ouverte et classée
POST-MVP; elle ne constitue pas un prérequis MVP.

Les blocages globaux restants pour le work item architecture sont : ACT-10
(owners, vérificateurs, jalons et critères de sortie), ACT-13 (décision
indépendante formelle), ainsi que les preuves ou
réconciliations encore ouvertes pour ACT-02, ACT-04, ACT-05, ACT-06/07, ACT-08
et ACT-12. En particulier, la sémantique `ERR-HEARTBEAT`, les preuves de
sécurité et de révocation, les parcours P0 intégrés et l'accessibilité globale
ne sont pas déclarés clos. ACT-03, ACT-09 et US-009..011 restent ouverts au
niveau global; l'instruction du 2026-11-19 a autorisé la consignation d'une
baseline produit, mais ne vaut ni avis juridique, ni preuve, ni approbation.

Le scan ACT-11 du 2026-11-18 a été recalculé sur le worktree le 2026-11-19 :
HEAD comporte 90 fichiers Markdown, 34 occurrences et 13 fichiers touchés;
le worktree en comporte 91, 33 et 13. L'unique ajout est ADR-017, sans
marqueur. Les chiffres corrigés sont consignés dans le [relevé ACT-11](../quality/evidence/act11-marker-scan-2026-11-18/README.md).
Le PASS de ce scan reste limité à son inventaire et ne ferme pas les actions
ACT ni le gate global. Cette relecture ne vaut ni approbation owner, ni
autorisation d'implémentation structurelle.

## Décision owner ciblée ADR-017 — 2026-11-19

Après la relecture indépendante ciblée `PASS` de l'ADR-017, le responsable
produit approuve explicitement cette proposition de frontière Auth/Realtime.
Cette décision est consignée dans l'ADR et le journal des décisions. Elle ne
vaut pas approbation globale : `Status: review`, le verdict global `REWORK`,
la case d'audit indépendant et les gates ACT ouverts restent inchangés. Aucun
refactor structurel n'est autorisé avant l'approbation globale vérifiée.

## Confirmation ciblée ACT-12 — 2026-11-19

Une relecture indépendante de suivi a confirmé que le rapport ACT-12 de travail
distinct étaye les deux références du registre : revue limitée des liens/ancres, des
statuts ACT-11 et US-003/004, des décisions, des owners et des preuves. Le
rapport maintient ACT-12 en `needs-review` et n'affirme aucune approbation
globale. Cette confirmation corrige le signalement initial d'absence de rapport;
elle ne change ni la checklist ni le verdict global `REWORK`. Le rapport ne
nomme pas son auteur, ce qui limite la vérification de provenance à son contenu
et à la délégation enregistrée.

## Audit indépendant des obligations ouvertes — 2026-11-19

Une revue read-only des obligations ACT-02..13 et US-009..011 confirme que la
readiness globale reste `REWORK`. Les éléments vérifiables et les owners
attendus sont :

- **Ops (ACT-02)** : la configuration locale existe; l'état courant de
  production, les alertes reçues, la sauvegarde distante et la restauration ne
  sont pas prouvés. Les exercices staging de #422 restent post-MVP.
- **Data, sécurité et droits (ACT-03/05/09)** : les preuves techniques
  d'inventaire, rétention, révocation, CSRF, limites, secrets et provenance des
  médias sont incomplètes. Data/Backend, Security/Ops et Design/asset owner
  doivent fournir leurs preuves; Conformité/juriste décide des questions
  légales et de droits.
- **API et parcours intégrés (ACT-04/07)** : les E2E récents couvrent une
  partie des anciens écarts heartbeat/tirage. API-004 a aussi une suite HTTP
  ciblée 3/3 pour anonyme `401` et `VIEWER`/`ADMIN` `200`, mais l'agrégateur et
  Prisma y sont mockés. ACT-07/US-007 a maintenant un E2E HTTP/PostgreSQL
  isolé (2/2) pour permissions, désactivation/réactivation, état de compte,
  révocation de session et audits persistés. L'E2E `realtime-redis-adapter`
  passe aussi 1/1 avec Redis réel et vérifie la déconnexion d'une room propagée
  entre deux serveurs Socket.IO génériques; il ne couvre pas le câblage
  `SessionRevocationService`/gateway ni plusieurs processus déployés. Un E2E
  auth-lifecycle 2/2 au HEAD code `198cdc0b` utilise désormais le vrai Gateway,
  `SessionRevocationService`, socket cookie et session DB; après logout, le
  client reçoit `io server disconnect`. Cette preuve est single-process et
  locale. Le 2026-11-19, un scénario E2E test-only local ajoute la désactivation
  admin avec socket JWT et session PostgreSQL active : le client reçoit
  `io server disconnect`, le compte passe à `actif=false` et la session est
  révoquée. Run isolé 2/2, 12 migrations, au worktree basé sur `a9ccdbc1` avec
  le test ensuite commité dans `73a9ae98`; portée single-process, sans Redis
  inter-processus, déploiement ni CI au SHA de livraison. Les preuves restantes concernent notamment les quotas, l'échec
  d'audit, d'autres parcours admin, les autres voies de révocation socket et
  la propagation inter-processus/déployée. La sémantique `ERR-HEARTBEAT` et les comportements
  admin ouverts attendent Product; Backend et QA produisent ensuite les preuves
  intégrées.
- **Notifications viewer (ACT-04/08/11)** : l'E2E HTTP `announcements-viewer`
  passe 7/7 au SHA `8431aa7d`; la relance 8/8 au SHA `a3965bb7` ajoute un JWT
  valide dont la session simulée révoquée reçoit `401` sans appel au contenu.
  Prisma/AnnouncementsService et AuthSession restent mockés; ces tests ne
  prouvent pas le cycle PostgreSQL, l'expiration réellement persistée, le
  throttling `429` ni le rendu/accessibilité du modal. Les exigences et la
  readiness restent ouvertes.
- **QA, visuel et accessibilité (ACT-06/08)** : les résultats ciblés existent,
  mais les artefacts bruts liés au SHA, la couverture détaillée des stories,
  ainsi que les preuves actuelles de rendu, contraste, zoom, clavier, lecteur
  d'écran, reduced motion et modal restent à compléter par QA,
  Frontend/Accessibilité puis auditeur.
- **Gouvernance et traçabilité (ACT-10/11/12/13)** : ACT-11 et ACT-12 ont des
  PASS limités, sans clôture globale. ACT-10 attend owners/vérificateurs
  nommés, jalons et critères validés. Après résolution des autres écarts,
  l'auditeur doit rendre le verdict ACT-13 et la personne habilitée prendre la
  décision explicite.
- **Baseline Produit (US-009..011)** : boutique limitée aux récompenses
  garanties; tirages et jeux à gratter désactivés publiquement jusqu'à une
  validation juridique écrite du mécanisme et du règlement. La participation
  gratuite unique reste une option conditionnelle, pas un parcours actuellement
  ouvert. Le cycle des lots/contenus et le parcours gagnant sont consignés dans
  `docs/delivery/readiness-decision-request.md` à la demande du propriétaire.
  Juriste, Data/Conformité, QA et les owners doivent valider les points de leur
  rôle et produire les preuves; l'auditeur ne rend pas d'avis juridique et ne
  ferme pas ces actions.

Cette revue n'a exécuté aucun test, n'a modifié aucun comportement et n'a
approuvé aucune obligation. Sources détaillées : `docs/design/ops-audit-2026-10-18.md`,
`docs/design/api-contract-audit-2026-10-18.md`, le registre de traçabilité,
`docs/quality/p0-evidence-matrix.md` et `docs/product/user-stories.md`.

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
- [x] Vision, stories et parcours cohérents : cible owner confirmée (Twitch, YouTube, Kick), extension alignée et cahier accepté relié à US-001..011 / FLOW-001..008. Les décisions inconnues sont explicitement `needs-review`, sans règle ni priorité inférée. Les ajouts stories/parcours/crosswalk ont été acceptés en revue Produit et Auditeur indépendante le 2026-11-07; cette fermeture ciblée ne change pas la readiness globale.
- [x] Architecture, données, contrats et sécurité documentés pour relecture
- [x] Direction visuelle et médias définis si applicable, avec preuves restantes tracées
- [x] Diagrammes, roadmap et décisions à jour
- [ ] Audit de conception effectué et accepté par un relecteur indépendant
- [x] Aucun marqueur de complétion non traité dans le scan ACT-11 du 2026-11-18 : les 33 occurrences du worktree sont classées et rattachées à des décisions ouvertes, des actions owner ou des mentions historiques/méthodologiques; revue indépendante PASS limitée à cet inventaire. Refaire ce contrôle après l'audit de conception complet. Les décisions et preuves de fond restent ouvertes.

## Décision historique des relectures — 2026-10-07/08

- Relectures indépendantes : les rapports du 2026-10-07 et du 2026-10-08 concluent `rework`; cette mise à jour documentaire prépare la prochaine relecture sans la préjuger.
- Écarts confirmés : disponibilité et exploitation, données et rollback, rapprochement API/code, preuves de sécurité, preuves P0, parcours admin, médias, traçabilité et marqueurs d'incertitude.
- Auditeur : relecteur indépendant distinct du concepteur; nouvelle relecture requise après corrections
- Date : 2026-10-07
- Décision : Non approuvé. Les corrections du plan et une nouvelle relecture indépendante restent requises.
