# Audit assets et Framer Motion DASH-V3

Statut : needs-review

## Périmètre

Audit ciblé des assets visibles, des miniatures de streams et de la présence
effective de Framer Motion dans les écrans DASH-V3. Aucun nouvel asset n'a été
créé et aucune image de substitution n'est autorisée.

## Provenance vérifiée

| Usage | Source réellement présente | Format et dimensions | Règle d'utilisation |
| --- | --- | --- | --- |
| Logo Skkup | `frontend/public/branding/skkup-wordmark-transparent.png` | PNG RGBA, 2072 × 759 | logo transparent, rendu via `next/image` |
| Icônes métier générées | `frontend/public/branding/generated/skkup-icon-*.png` | PNG RGBA, 256 × 256 | uniquement pour les KPI et illustrations dédiées déjà prévues |
| Icônes vectorielles | `frontend/public/branding/icons/*.svg` et `frontend/public/branding/v3/*.svg` | SVG | rendues par `SkkupIcon`, avec texte accessible voisin |
| Cartes de récompense | `frontend/public/branding/dashboard/reward-art-sprite-v1.png` | PNG RGB, 768 × 768 | sprite documenté, sans dériver de fausse donnée métier |
| Miniatures de streams | URL `thumbnailUrl` renvoyée par l'API, avec dérivation Twitch documentée dans `frontend/src/lib/streams.ts` | média distant contractuel | si indisponible, fallback icône, jamais de miniature fictive |

Les fichiers de référence de maquettes dans `docs/design/skkup-dashboard-references/`
servent uniquement à la comparaison visuelle et ne sont pas servis comme
assets produit.

## Framer Motion effectivement présent

- `frontend/src/components/dashboard/TableauDeBord.tsx` utilise `motion` pour
  les groupes KPI, contenu principal, récompenses et historique.
- `frontend/src/app/admin/page.tsx` et
  `frontend/src/components/admin/AdminSectionPage.tsx` utilisent `motion` et
  `useReducedMotion` pour l'entrée des surfaces.
- La dépendance est déclarée dans `frontend/package.json`.

## Écarts disjoints constatés

1. `TableauDeBord.tsx` anime ses surfaces sans appeler `useReducedMotion`.
   La baseline documentaire exige une réduction effective côté composant, pas
   seulement une règle CSS globale.
2. `frontend/src/app/dashboard/extension/page.tsx` affiche Firefox comme
   compatible avec la même icône générique que les autres navigateurs. Aucun
   asset Firefox validé n'est présent dans le registre, et le cahier V1 exclut
   Firefox. Il faut retirer ou neutraliser cette présentation plutôt que créer
   un faux logo.
3. Les deux avertissements `<img>` de `RafflesAdminV3.tsx` concernent des URLs
   média API distantes. Ils doivent rester contractuels ou être migrés après
   vérification de la configuration d'images distantes, sans inventer de domaine.

## Limite de cette passe

Le script `bash .codex/scripts/verify-specialist-plan.sh` n'a pas pu obtenir le
plan réel `frontend + qa + auditeur`, car l'orchestrateur d'agents spécialistes
n'est pas exposé dans cette session. Aucun correctif produit n'est donc déclaré
dans cette passe. Une modification des trois écarts nécessite la reprise par
les rôles spécialisés prévus par le contrat d'orchestration.

## Contrôles exécutés

- `bash .codex/scripts/check-kit-update.sh` : vérification distante indisponible
  par DNS, kit local 1.14.12 conservé.
- `bash .codex/scripts/doctor.sh` : OK.
- `bash .codex/scripts/verify-specialist-plan.sh` : échec, plan spécialiste
  non exposé.
- Recherche statique Framer Motion et inventaire `file` des assets : réalisés le
  2026-10-05.
