# Passe frontend DASH-V3, écrans secondaires

Date: 2026-10-10
Branche: `chore/dash-v3-delivery-ready-1-16-30`
Référence: HEAD `f5c26b7` avant correction

## Périmètre

Les écrans vérifiés sont `/dashboard/streams` et `/dashboard/tirages`.

## Écart retenu

Le catalogue streams expose déjà uniquement les filtres couverts par son
contrat. Les champs catégorie, langue, LIVE et spectateurs ne sont pas
inventés côté client et restent signalés comme indisponibles.

Sur les tirages, `dateTirage` est un champ contractuel déjà consommé par le
détail. La liste affichait cette date mais ne reprenait pas le temps restant
recalculé chaque minute du détail et n'exposait pas cette information comme
annonce accessible.

## Correction

Pour chaque tirage ouvert, la carte de liste utilise `dateTirage` pour afficher
le même temps restant que le détail. L'annonce porte `role=status`,
`aria-live=polite` et `aria-atomic=true`. Les tirages clos ou publiés
conservent leur date localisée. Aucun champ API nouveau ni donnée fictive n'a
été ajouté.

## Fichiers

- `frontend/src/components/raffles/ListeTirages.tsx`
- `frontend/src/components/raffles/ListeTirages.test.tsx`
- `frontend/README.md`

## Vérifications

- `npm test -- --run src/components/raffles/ListeTirages.test.tsx src/components/streams/ListeStreams.test.tsx`: PASS, 2 fichiers, 15 tests.
- `npx eslint src/components/raffles/ListeTirages.tsx src/components/raffles/ListeTirages.test.tsx src/components/streams/ListeStreams.tsx src/components/streams/ListeStreams.test.tsx`: PASS, 0 erreur, 1 avertissement existant sur `img` dans `ListeStreams.tsx`.
- `npm run typecheck`: PASS.
- `git diff --check`: PASS.

## Limites

Les enrichissements visuels des streams nécessitant des champs absents du
contrat restent ouverts et ne sont pas implémentés dans cette passe.
