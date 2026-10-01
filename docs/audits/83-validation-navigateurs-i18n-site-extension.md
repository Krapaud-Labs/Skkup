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

L’extension est volontairement limitée à Chrome pour cette version et n’est
pas encore publiée. Firefox, Opera et Safari ne font donc pas partie de la
Definition of Done P09. La validation P09 porte sur le paquet Chrome avant
publication : manifest MV3, catalogues FR/EN, popup, service worker,
content script, lint, typecheck, tests et build.

## Corrections

Les contrôles statiques et de compilation de l’extension restent réussis. Le
site a été relu en anglais dans Chrome avec un viewport mobile de 390 × 844
pixels sans changement d’arbre d’accessibilité ni débordement observable. La
production conserve un libellé ARIA français sur le nav après passage en
anglais, alors que le code local fournit le libellé anglais. Ce point reste
ouvert car il nécessite un déploiement de la branche puis une nouvelle
vérification en production.

La popup sera soumise à une validation manuelle après publication dans une
carte dédiée au déploiement de l’extension. Aucun résultat de publication
n’est déclaré dans P09.

## Conclusion

La preuve P09 couvre le site FR/EN dans Chrome et la validation complète du
paquet d’extension Chrome avant publication. Les validations Firefox, Opera,
Safari et la popup publiée sont hors périmètre de cette carte.
