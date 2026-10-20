---
date: 2026-10-20
scope: revue documentaire des preuves locales Notifications, ACT-04 et ACT-08
status: rework
---

# Revue navigateur Notifications — 2026-10-20

## Observation locale rapportée

Le relevé `current-evidence.md` du 2026-10-20 rapporte six services Docker
`skkup-frontend-1`, `skkup-backend-1`, `skkup-worker-1`, `skkup-postgres-1`,
`skkup-redis-1` et `skkup-proxy-1` en état `healthy`. La requête
`GET /announcements/active` répond `200` avec un seul élément. La requête
`GET /viewer/announcements` sans session répond `401 Unauthorized`. Ce `401`
établit uniquement le refus de la requête anonyme; il ne prouve pas le contenu
ni le statut HTTP de la réponse avec une session viewer authentifiée.

Dans Chrome, sur `/dashboard` avec une session authentifiée, le bouton
Notifications est affiché sans badge ni compteur. Le menu contient deux
boutons, dont « QA · Annonce de validation DASH-V3 ». L'ouverture observée
montre un modal contenant le titre et le texte brut de l'annonce. `Escape`
ferme le modal et restitue le focus au bouton annonce.

Les constats antérieurs de stack `skkup-signup`, de route viewer en `404`, de
trois éléments sur `/announcements/active`, de badge « 2 non lues » et de
notifications « Série mise à jour » / « Points mis à jour » sont conservés
comme observations antérieures. Ils ne décrivent pas le relevé du 2026-10-20.

## Comparaison à ADR-011

Le rendu local rapporté concorde avec plusieurs critères visibles: absence de
badge, modal avec titre et texte brut, fermeture par `Escape` et restitution
du focus au déclencheur. La comparaison des sources frontend avec ADR-011
relève toutefois deux écarts vérifiables:

1. Le focus initial est placé sur le bouton Fermer plutôt que sur le contenu
   du modal, alors que l'ADR exige le focus initial sur le conteneur du titre
   et du texte.
2. Le clic sur le backdrop ferme le modal, alors que l'ADR exige explicitement
   qu'il ne le ferme pas.

Les critères d'inclusion des annonces futures et expirées, d'exclusion des
annonces archivées, de contrôle explicite du rôle `VIEWER` et de rechargement
à chaque ouverture ne sont pas établis par ces observations.

## Rapports spécialisés vérifiés

Les trois rapports ci-dessous ont été contrôlés par
`.codex/scripts/verify-agent-report.sh`; leurs verdicts sont bornés à leurs
revues et ne constituent pas une approbation globale.

| Rôle | Identifiant | Statut | Portée et constat |
| --- | --- | --- | --- |
| Frontend | `01a1598f-530c-7120-b21a-929771efc213` | `rework` | Revue des sources UI et de l'observation; focus initial et fermeture backdrop à corriger; preuves responsive/accessibilité non établies. |
| QA | `01a1598f-53d0-77e3-9368-9a3e19738c63` | `rework` | Revue documentaire; dates, archives, rôle `VIEWER`, rechargement et plusieurs états/comportements restent sans preuve suffisante. Aucun test exécuté. |
| Auditeur | `01a1598f-5216-7300-9ee1-1894e85d7548` | `rework` | Réconciliation ACT et issue #297; gates et cases de conception/revues toujours ouverts; demande la correction des affirmations périmées et les preuves restantes. |

## Provenance et limites

- Source de l'observation: `/private/tmp/skkup-mvp001-review-reports.vp0Xtz/current-visual-review/current-evidence.md`.
- Rapports: `current-visual-review/adr-rereview/frontend.md`, `qa.md` et
  `auditeur.md` dans le même dossier de rapports temporaire.
- Le screenshot et l'information d'accessibilité (AX) ont été vus dans la
  session, mais ne sont pas archivés comme fichiers dans cet artefact.
- Aucun SHA ni identifiant d'image servi n'est établi. Le checkout source est
  modifié sur `fix/restore-generated-points-coin` et n'est pas établi comme
  intégré à `dev`.
- Aucun test n'a été rejoué pour cette mise à jour documentaire. Les réponses
  HTTP et le rendu observé sont des preuves locales distinctes.

## État de décision

Cette revue ne transforme aucun verdict `rework` en approbation globale.
`design-readiness` reste `Status: review`; les cases et les autres actions ACT
restent ouvertes. ADR-011 n'est pas modifié ni déclaré approuvé. Les preuves
authentifiées, d'identité de build, responsive et d'accessibilité, ainsi que
les corrections frontend et les validations indépendantes restent à produire.
