# Validation navigateur de l’internationalisation

Date : 2026-10-01
Branche contrôlée : `feature/i18n-complete` (`5bf3845`)
URL contrôlée : `https://skkup.fr/`

## Résultats réels

### Chrome

- Page d’accueil chargée sur `https://skkup.fr/`.
- Rendu anglais observé : navigation, accroche, appels à l’action, sections « What Skkup makes visible » et « How does it work? ».
- Le contrôle de langue affichait `EN`.
- Le basculement interactif vers `FR` n’a pas pu être confirmé avec le contrôle natif exposé par la session Chrome.

### Firefox

- Page d’accueil chargée en `FR`.
- Rendu français observé sur la navigation, l’accroche, les appels à l’action et les sections de contenu.
- Sélecteur FR/EN ouvert réellement.
- Basculement `FR` vers `EN` confirmé : navigation, accroche, métriques, sections, étapes et appel à l’action ont été remplacés par les textes anglais.

### Opera

- L’application Opera était détectée et une fenêtre Skkup apparaissait dans l’inventaire initial.
- La fenêtre est devenue indisponible avant la lecture du contenu. Aucun résultat Opera n’est donc déclaré.

### Safari

- Safari n’était pas disponible dans la session d’automatisation.
- Aucun résultat Safari n’est donc déclaré.

## Extension Chrome

L’extension est volontairement limitée à Chrome pour cette version. Firefox,
Opera et Safari ne font donc pas partie de la Definition of Done P09 et ne
doivent pas être présentés comme des plateformes supportées. La popup Chrome
n’est pas encore déclarée validée par un parcours manuel réel dans cette
session ; les contrôles de lint, typecheck, tests et build restent validés.

## Corrections

Les contrôles statiques et de compilation de l’extension restent réussis. La
production conserve un libellé ARIA français sur le nav après passage en
anglais, alors que le code local fournit le libellé anglais. Ce point reste
ouvert car il nécessite un déploiement de la branche puis une nouvelle
vérification en production.

Le test réel de la popup Chrome reste limité aux navigateurs accessibles
manuellement. Aucune preuve non observée n’est déclarée comme réussie.

## Conclusion

La preuve est partielle : le site FR/EN est observé, mais le basculement FR
de Chrome et la popup Chrome restent à valider dans un environnement
navigateur accessible. Les validations Firefox, Opera et Safari sont hors
périmètre produit pour cette version.
