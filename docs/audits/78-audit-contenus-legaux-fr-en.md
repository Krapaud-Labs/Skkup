# Audit des contenus légaux FR/EN

## Périmètre

Audit technique du règlement du jeu, de la politique de confidentialité et des liens de navigation utilisés par le site.

## Constats et corrections

- La politique de confidentialité affichait toujours son contenu français lorsque l'utilisateur sélectionnait EN. Le contenu de la page est maintenant rendu selon la langue active, avec une traduction anglaise explicitement présentée comme un brouillon soumis à revue juridique.
- Le lien « Lire le règlement du jeu » pointait vers `/dashboard/reglement`, une route protégée par le sas d'authentification. Il pointe désormais vers `/reglement`, route publique, afin qu'un visiteur puisse consulter le document depuis la politique de confidentialité.
- Le règlement reste publié en français. En mode EN, l'interface et l'avertissement sont en anglais, mais le document source français est conservé jusqu'à validation humaine de sa traduction.

## Limites et validation requise

Cette modification est une correction technique et UX. Elle ne constitue ni une validation juridique, ni une certification de conformité RGPD, ni une approbation du règlement. Une revue humaine par un juriste reste obligatoire avant publication définitive ou ouverture d'un tirage. Les mentions d'identité, de médiation, de conservation et les traductions doivent être confirmées par cette revue.

## Validation locale

- `git diff --check` : réussi.
- Lint, typecheck, tests et build frontend : non exécutables dans l'environnement courant, `node` et `npm` indisponibles.
- `verify-before-push.sh` : à exécuter dans un environnement disposant des outils du projet avant toute PR.
