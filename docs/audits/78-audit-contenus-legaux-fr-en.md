# Audit des contenus légaux FR/EN

## Mise à jour technique

Le règlement est maintenant disponible dans une source française et une source
anglaise structurées avec les mêmes 13 articles. La langue active sélectionne la
version correspondante sur la page publique `/reglement` et dans le Dashboard.
La traduction anglaise est technique et destinée à l’UX ; elle ne constitue pas
un avis juridique et aucune validation juridique humaine n’est déclarée.

La parité des articles est couverte par `frontend/src/content/reglement.test.ts`.

## Périmètre

Audit technique du règlement du jeu, de la politique de confidentialité et des liens de navigation utilisés par le site.

## Constats et corrections

- La politique de confidentialité affichait toujours son contenu français lorsque l'utilisateur sélectionnait EN. Le contenu de la page est maintenant rendu selon la langue active, avec une traduction anglaise explicitement présentée comme un brouillon soumis à revue juridique.
- Le lien « Lire le règlement du jeu » pointait vers `/dashboard/reglement`, une route protégée par le sas d'authentification. Il pointe désormais vers `/reglement`, route publique, afin qu'un visiteur puisse consulter le document depuis la politique de confidentialité.
- Le règlement dispose maintenant de deux sources parallèles FR/EN. En mode EN, le document anglais est affiché sur les routes publique et Dashboard, avec un avertissement explicite indiquant qu'il s'agit d'une traduction technique en attente de revue juridique.

## Limites et validation requise

Cette modification est une correction technique et UX. Elle ne constitue ni une validation juridique, ni une certification de conformité RGPD, ni une approbation du règlement. Une revue humaine par un juriste reste obligatoire avant publication définitive ou ouverture d'un tirage. Les mentions d'identité, de médiation, de conservation et les traductions doivent être confirmées par cette revue.

## Validation locale

- `git diff --check` : réussi.
- Lint, typecheck, tests et build frontend : non exécutables dans l'environnement courant, `node` et `npm` indisponibles.
- `verify-before-push.sh` : réussi en mode external, avec validation du kit et des fichiers publiables.
