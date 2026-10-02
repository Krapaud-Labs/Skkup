# Validation P10

## Objet

La carte P10 améliore la compréhension des contraintes du formulaire d'inscription et teste une variante de fond mauve plus clair demandée par le client.

## Changements validés

- Le mot de passe exige au minimum 12 caractères, une majuscule, une minuscule, un chiffre et un symbole.
- Les cinq contraintes sont affichées en français et en anglais et leur état évolue pendant la saisie.
- Le formulaire bloque l'inscription tant qu'une contrainte est absente.
- La même politique est appliquée par l'API.
- Le fond de la vitrine utilise une variante mauve éclaircie tout en conservant les surfaces sombres et le contraste du contenu.

## Visuels générés par IA

Les photos et illustrations de la vitrine générées avec une IA doivent être identifiées comme contenu généré par IA dans les supports de validation et dans toute présentation publique concernée. Cette exigence est suivie dans la checklist Trello P10.

## Vérifications

- Tests frontend, lint, vérification de types et build réussis.
- Tests backend, lint, vérification de types et build réussis.
- Vérification réelle dans Chrome de la page d'inscription en français.
- Vérification réelle de l'état des cinq contraintes avec un mot de passe incomplet.
- Vérification du diff Git avec `git diff --check`.

## Limites

La publication de l'extension Chrome ne fait pas partie de cette carte. La mention des visuels générés par IA est une exigence documentaire et de présentation, pas une modification du pipeline de génération d'images.
