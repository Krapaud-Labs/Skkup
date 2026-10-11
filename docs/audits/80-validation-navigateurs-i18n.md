# Validation navigateur FR/EN du site et de l’extension

## Périmètre

Validation du check Trello « Valider le site et les extensions Chrome, Firefox, Opera et Safari dans le navigateur ».

## Observations réelles

La vitrine publique `https://skkup.fr/` a été ouverte dans les navigateurs réellement accessibles pendant la session.

### Chrome

- FR observé : navigation, sélecteur, hero, statistiques, sections, liens et textes alternatifs en français.
- EN observé : navigation, sélecteur, hero, statistiques, sections, liens et textes alternatifs en anglais.
- Le sélecteur expose un nom accessible (« Langue » / « Language ») et l’arbre d’accessibilité expose les titres et liens attendus.

### Firefox

- EN observé au chargement : navigation, hero, sections, boutons et textes alternatifs en anglais.
- FR observé après sélection de `FR` : navigation, hero, sections, boutons et textes alternatifs en français.
- Le sélecteur affichait bien les deux options et la valeur sélectionnée correspondait au rendu.

### Opera

- EN observé au chargement : navigation, hero, sections, boutons et textes alternatifs en anglais.
- FR observé après sélection de `FR` : navigation, hero, sections, boutons et textes alternatifs en français.
- Le sélecteur affichait bien les deux options et sa valeur suivait le rendu.

## Fallback et extension

- Le fallback de l’extension est implémenté dans `extension/src/popup/popup.ts` et couvert par les tests de l’extension.
- Le code utilise la langue mémorisée lorsqu’elle est `fr` ou `en`, puis `navigator.language`; une langue non française retombe sur `en`.
- Le contexte popup de l’extension n’est pas exposé comme une page d’extension contrôlable dans cette session. Aucun rendu navigateur de la popup, ni changement FR/EN dans son contexte d’extension, n’est donc déclaré.

## Limites

- Safari n’est pas présent dans l’inventaire des applications disponibles : aucun résultat Safari n’est déclaré.
- Aucun redimensionnement de viewport, test mobile ou audit axe n’a été réalisé dans cette session.
- Le check Trello reste ouvert : la preuve est partielle (site observé dans Chrome, Firefox et Opera ; Safari et popup de l’extension non vérifiables).
