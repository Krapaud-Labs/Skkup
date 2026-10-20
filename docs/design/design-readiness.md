---
last_updated: 2026-10-18
owner: Mickael MUR
---

# Design readiness

Status: review

## Plan de reprise issu de l'audit indépendant

Le dossier est en `review` après intégration des corrections et preuves locales. Cette liste et cette transition ne valent pas approbation.

1. Réconcilier le périmètre MVP/Post-MVP entre vision, roadmap et readiness.
2. Compléter architecture, déploiement, observabilité, erreurs, disponibilité et dépendances externes.
3. Compléter le modèle de données avec attributs, intégrité, rétention, export, suppression et rollback.
4. Aligner les contrats API sur les endpoints implémentés et leurs erreurs, permissions, limites et tests.
5. Compléter les preuves de sécurité concernant secrets, sessions, limites, audit admin, sauvegardes et préproduction.
6. Relier les stories P0 à des tests ou preuves précis.
7. Décrire les parcours admin, révocation, erreurs de plateforme, plafond et reprise.
8. Compléter la direction visuelle, les états UI, le clavier, les contrastes et `prefers-reduced-motion`.
9. Compléter la provenance et la preuve d'usage de chaque média; pour les assets
   générés par IA, conserver la déclaration produit et le brief ou la décision
   associée, tandis que les médias distants restent soumis aux conditions de
   leur plateforme.
10. Tracer les décisions ouvertes et leurs responsables.
11. Résoudre ou formaliser les mentions restantes « à vérifier », « à planifier » et « à définir ».
12. Ajouter la traçabilité vision → stories → parcours → architecture → API/données → preuves.
13. Faire relire les corrections par un auditeur distinct.
14. Maintenir `Status: review` pendant les corrections et les audits; seulement
    après réception et relecture des preuves restantes, examiner séparément une
    éventuelle transition vers `approved`, sans la présumer.

La conception DASH-V3 est cadrée dans [dashboard-redesign-2.0.md](dashboard-redesign-2.0.md). Les références structurelles sont dans [dashboard-wireframes-2.0.md](dashboard-wireframes-2.0.md) et le séquencement frontend est décrit dans le plan de migration de ce document. Ces éléments ne valent pas encore validation visuelle indépendante.

La première matrice de traçabilité P0 est conservée dans
`docs/quality/p0-evidence-matrix.md`. Elle distingue les preuves techniques
existantes des preuves navigateur et indépendantes encore manquantes.

La matrice de conception datée du 2026-10-18 est conservée dans
[`design-traceability-and-open-actions-2026-10-18.md`](design-traceability-and-open-actions-2026-10-18.md).
Elle relie les sept stories du produit aux parcours, composants, entités,
interfaces et preuves attendues, puis attribue un owner proposé à chaque point
restant. Les points nécessitant une décision métier, juridique, conformité,
sécurité, opérations ou une revue indépendante restent explicitement
`needs-review`; cette matrice ne crée ni ne modifie un contrat d'API.

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

## Reprise unitaire isolée du 2026-10-18

Après génération réussie de Prisma 7.10.0 dans le worktree isolé au HEAD
`6d9cc76`, la suite backend a réussi : 44 suites et 296 tests, sans échec ni
pending. La suite frontend Vitest 4.1.11 a également terminé avec le code 0 :
88 suites, 231 tests réussis, 6 skipped et aucun échec. Les JSON bruts,
versions, hashes, répartition des suites et limites sont consignés dans
[`p0-backend-unit-2026-10-18/README.md`](../quality/evidence/p0-backend-unit-2026-10-18/README.md).

Ces runs unitaires ne démontrent pas HTTP réel, DB/PostgreSQL, Redis/BullMQ,
E2E, navigation ou rendu navigateur, ni authentification production. Les six
scénarios Notifications/annonces skipped restent ouverts. `Status: review` et
les cases d'approbation non cochées restent inchangés; ces preuves ne valent
pas approbation indépendante.

## Traçabilité de la relecture en cours

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
- environnement de préproduction réellement exécuté, alertes observées,
  canal de notification et responsable d'astreinte;
- rollback applicatif et restauration complète exercés et datés;
- approbation formelle de la conception et décision indépendante de clôture de
  l'audit.

Le snapshot historique des portes dans
[`docs/quality/evidence/p0-live-2026-10-08/gate-snapshot.tsv`](../quality/evidence/p0-live-2026-10-08/gate-snapshot.tsv)
reste une référence historique de statut : `design-gate=needs-review`,
`audit-gate=needs-review` et `delivery-gate=pending`. Les preuves locales ne
justifient ni `Status: approved`, ni `verified`, ni l'ouverture d'une PR.

## Validation

- [x] Cahier des charges accepté et périmètre MVP/Post-MVP arrêté
- [x] Vision, stories et parcours cohérents
- [x] Architecture, données, contrats et sécurité documentés pour relecture
- [x] Direction visuelle et médias définis si applicable, avec preuves restantes tracées
- [x] Diagrammes, roadmap et décisions à jour
- [ ] Audit de conception effectué et accepté par un relecteur indépendant
- [ ] Aucun marqueur de complétion non traité : contrôle à refaire après l'audit de conception complet

## Actions, owners et preuves attendues

Le détail des actions `ACT-01` à `ACT-13`, de leurs owners proposés, de leurs
preuves attendues et des inconnues externes est maintenu dans
[`design-traceability-and-open-actions-2026-10-18.md`](design-traceability-and-open-actions-2026-10-18.md).
La présence de ce registre améliore la traçabilité documentaire mais ne clôt
aucune obligation et ne vaut pas approbation.

## Preuves et approbation

- Relectures indépendantes : les rapports du 2026-10-07 et du 2026-10-08 concluent `rework`; cette mise à jour documentaire prépare la prochaine relecture sans la préjuger.
- Écarts confirmés : disponibilité et exploitation, données et rollback, rapprochement API/code, preuves de sécurité, preuves P0, parcours admin, médias, traçabilité et marqueurs d'incertitude.
- Auditeur : relecteur indépendant distinct du concepteur; nouvelle relecture requise après corrections
- Date : 2026-10-07
- Décision : Non approuvé. Les corrections du plan et une nouvelle relecture indépendante restent requises.

## Snapshot local antérieur — 2026-10-20 (supersédé)

Le relevé ci-dessous est conservé pour son historique. Il précède l'observation
locale plus récente consignée dans la [revue navigateur Notifications du
2026-10-20](../quality/evidence/notifications-browser-review-2026-10-20.md);
ses résultats ne décrivent donc pas le dernier état local rapporté. Les
constats plus récents et leurs limites sont résumés après ce snapshot.

Le responsable a demandé que les essais soient conduits sur Docker local et dans
son Chrome. Après connexion manuelle de Krapaud, le dashboard a été observé sur
`http://localhost:3000/dashboard`; aucune donnée n'a été modifiée et aucune
notification individuelle n'a été ouverte.

- Docker Desktop confirme que l'URL est servie par la stack `skkup-signup`,
  conteneur `frontend-1`, image `skkup-signup-frontend`, ID
  `sha256:5a2ec532f217ce83c5237d5445eabbe4c6d44bae79c564d2c80ca758bd260d4a`;
  l'image est datée de deux jours. La stack `skkup` est arrêtée. Aucun SHA Git
  source n'est exposé par le menu ou l'image observée.
- Le `docker-compose.yml` et `frontend/Dockerfile` du checkout ne déclarent
  aucun argument/label de version ou de SHA de source; une recherche du code
  pour `APP_VERSION`, `BUILD_SHA`, `GIT_COMMIT`, `SOURCE_SHA` et `BUILD_ID`
  ne trouve aucun identifiant de build.
- Le menu Notifications rendu affiche deux événements de points/série, un
  compteur « 2 non lues » et une action de marquage comme lu; aucune annonce
  admin ni modal titre + texte brut n'y apparaît.
- L'API locale `GET /announcements/active` renvoie trois annonces de démonstration;
  la route cible `GET /viewer/announcements` répond 404.
- Le menu du pseudo ne révèle aucune version ni identité de build, ce qui
  empêche de relier ce rendu à un commit ou à une image Docker précise.

Ces observations antérieures contredisaient le contrat Notifications consigné
dans ADR-011. Elles sont supersédées comme description de l'état local le plus
récent par le relevé référencé ci-dessus, mais restent conservées comme
historique. Elles ne valent pas approbation. La demande d'identité de build est suivie séparément dans l'issue
[#418](https://github.com/Krapaud-Labs/Skkup/issues/418), hors des critères
acceptés de MVP-001. Voir aussi la [matrice des exigences et preuves](mvp001-requirements-evidence-matrix.md).

## Observation locale plus récente — 2026-10-20

Le relevé daté dans la [revue navigateur Notifications](../quality/evidence/notifications-browser-review-2026-10-20.md)
rapporte six services Docker (`skkup-frontend-1`, `skkup-backend-1`,
`skkup-worker-1`, `skkup-postgres-1`, `skkup-redis-1` et `skkup-proxy-1`)
`healthy`; `GET /announcements/active` a répondu `200` avec un seul élément;
`GET /viewer/announcements` sans session a répondu `401`. Ce `401` ne prouve
pas le résultat avec une session viewer authentifiée. Dans Chrome authentifié,
Notifications présentait deux boutons sans badge; le modal affichait le titre
et le texte brut, et `Escape` rendait le focus au bouton déclencheur.

Cette observation locale reste limitée: le rapport frontend relève dans les
sources un focus initial sur le bouton Fermer au lieu du contenu, ainsi qu'une
fermeture par clic backdrop contraire à ADR-011. Aucun SHA ni identifiant
d'image servi n'est établi; le checkout source est modifié et son intégration
à `dev` n'est pas démontrée; les tests n'ont pas été rejoués et la capture
screenshot/AX vue en session n'est pas archivée comme fichier. Ces éléments
maintiennent `Status: review`; ils ne constituent ni une approbation ni une
preuve de livraison.
