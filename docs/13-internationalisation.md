# Internationalisation FR/EN

## Langues supportées

La version 1 supporte le français (`fr`) et l’anglais (`en`). Toute autre langue utilise le français comme langue de repli côté site et l’anglais comme repli de l’extension lorsque le navigateur n’est pas configuré en français.

## Détection et préférence

Le site consulte `navigator.languages`, puis mémorise le choix manuel dans `localStorage` avec la clé `skkup-language`. L’extension conserve sa préférence dans son stockage local avec la clé `skkupLanguage`.

## Règles de traduction

- Les libellés d’interface, erreurs et états sont traduits.
- La navigation globale, les formulaires de connexion et d’inscription, ainsi
  que les indicateurs de contraintes du mot de passe suivent la langue active.
- À l’inscription, les contraintes affichées reflètent le contrat backend actuel
  : huit caractères minimum, une majuscule, une minuscule et un chiffre.
- Les pseudos, noms de chaînes, contenus libres et données provenant des plateformes ne sont jamais traduits automatiquement.
- Les contenus légaux doivent être relus et validés avant publication dans chaque langue.
- Une nouvelle langue doit ajouter ses entrées au provider du site et au dictionnaire de la popup, puis fournir des tests de fallback et de changement manuel.

## Validation

Avant livraison, exécuter les lint, typecheck et tests frontend et extension. Vérifier également le rendu des pages publiques, du dashboard et de la popup dans les navigateurs supportés.

## État de la carte

- Les pages publiques, l’authentification, le dashboard, l’administration et la popup de l’extension disposent d’entrées FR/EN et d’un repli explicite.
- Les messages d’erreur de suivi de l’extension sont convertis dans la langue active de la popup.
- La politique de confidentialité dispose d’une version FR/EN, mais les deux versions restent soumises à une relecture juridique avant publication.
- Le règlement du jeu reste stocké comme contenu juridique français en attendant sa traduction juridique validée.
- Les validations de build et de rendu multi-navigateurs restent à exécuter dans un environnement disposant de Node.js et des navigateurs cibles. L’environnement local actuel ne fournit pas Node.js.
- Contrôle production du 2026-09-26 dans Chrome : `skkup.fr` répond, Dokploy répond sur le VPS et le sélecteur FR/EN fonctionne pour la navigation. En revanche, le contenu principal de la page d’accueil reste en français après le passage en anglais. Le code source de `feature/i18n-complete` contient bien les composants localisés de la page d’accueil ; la production observée ne sert donc pas cette révision. Le déploiement de la branche de production doit être vérifié et approuvé avant de considérer le rendu EN comme validé.
---
last_updated: 2026-09-26
---
