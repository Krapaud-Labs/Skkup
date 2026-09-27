# Validation navigateur de l’internationalisation

Date : 2026-09-27
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

## Extension

La popup de l’extension n’est pas exposée comme une page contrôlable par l’automatisation navigateur disponible. Aucun test navigateur réel de la popup dans Chrome, Firefox, Opera ou Safari n’est déclaré. Les contrôles extension déjà couverts par le code et la CI restent distincts d’un test manuel réel de popup.

## Corrections

Aucune correction de traduction n’a été nécessaire sur les parcours réellement observés. Les limites de couverture sont conservées explicitement afin de ne pas transformer une absence de preuve en validation.

## Conclusion

La preuve est partielle : site FR/EN confirmé dans Firefox, site EN confirmé dans Chrome, mais Opera, Safari, le basculement FR de Chrome et la popup de l’extension restent à valider dans un environnement navigateur accessible. Ce rapport ne modifie pas Trello.
