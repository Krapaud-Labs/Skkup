# Règlement et plateformes

- Périmètre : remplacer Facebook Live par Kick dans le point 4 du règlement et les textes produit incohérents.
- Exclusion : la future règle relative au téléphone n'est pas traitée.
- Definition of Done : aucune occurrence Facebook Live dans les contenus produit concernés, tests de contenu verts, commit atomique.

## Preuves

- `frontend/src/content/reglement.ts` et `reglement-en.ts` : article 4 aligné sur Twitch, Kick et YouTube Gaming.
- Les textes légaux, FAQ, extension et documentation produit ont été alignés.
- Le connecteur technique Facebook et les identifiants `FACEBOOK` restent inchangés : leur migration vers Kick est un lot backend/extension distinct.
- `npm test -- src/content/reglement.test.ts` : 2 tests passés.
- `npm run typecheck` : passé.
