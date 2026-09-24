# Internationalisation FR/EN

## Langues supportées

La version 1 supporte le français (`fr`) et l’anglais (`en`). Toute autre langue utilise le français comme langue de repli côté site et l’anglais comme repli de l’extension lorsque le navigateur n’est pas configuré en français.

## Détection et préférence

Le site consulte `navigator.languages`, puis mémorise le choix manuel dans `localStorage` avec la clé `skkup-language`. L’extension conserve sa préférence dans son stockage local avec la clé `skkupLanguage`.

## Règles de traduction

- Les libellés d’interface, erreurs et états sont traduits.
- Les pseudos, noms de chaînes, contenus libres et données provenant des plateformes ne sont jamais traduits automatiquement.
- Les contenus légaux doivent être relus et validés avant publication dans chaque langue.
- Une nouvelle langue doit ajouter ses entrées au provider du site et au dictionnaire de la popup, puis fournir des tests de fallback et de changement manuel.

## Validation

Avant livraison, exécuter les lint, typecheck et tests frontend et extension. Vérifier également le rendu des pages publiques, du dashboard et de la popup dans les navigateurs supportés.
