# Passe frontend DASH-V3, écrans secondaires admin

Date: 2026-10-10
Branche: `chore/dash-v3-delivery-ready-1-16-30`

## Périmètre vérifié

`/admin/lots`, `/admin/announcements`, `/admin/content`, `/admin/moderation`,
`/admin/users` et `/admin/audit`.

## Écart actionnable retenu

Dans `/admin/lots`, le contrat admin autorise une `imageUrl` facultative. Le
composant prévoyait un fallback si l'URL était absente, mais une URL fournie
qui échouait au chargement laissait une image cassée dans l'inventaire.

## Correction

Le média d'un lot est maintenant isolé dans un composant local. Quand le
chargement échoue, l'interface revient à l'icône neutre et annonce que l'image
est indisponible. Une URL ou un contenu n'est pas inventé. Le comportement
des cinq autres écrans n'est pas modifié, car leurs données et états existants
sont déjà couverts par les contrats et les tests présents.

## Fichiers modifiés

- `frontend/src/components/admin/LotsAdminV3.tsx`
- `frontend/src/components/admin/AdminSectionPage.test.tsx`
- `frontend/README.md`
- `.codex/work-items/2026-10-03-initialisation-reprise/frontend-secondary-admin-2026-10-10.md`

## Contrôles

- `npm test -- --run src/components/admin/AdminSectionPage.test.tsx`: PASS, 1 fichier, 16 tests.
- `npx eslint src/components/admin/LotsAdminV3.tsx src/components/admin/AdminSectionPage.test.tsx`: PASS, aucune erreur.
- `npm run typecheck`: PASS.
- `git diff --check`: PASS.

## Limites

Les écarts de densité visuelle et les champs absents des contrats admin restent
documentés mais ne sont pas fabriqués côté client.
