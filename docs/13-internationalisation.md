# Internationalisation FR/EN

## Langues supportées

La version 1 supporte le français (`fr`) et l’anglais (`en`). Toute autre langue utilise le français comme langue de repli côté site et l’anglais comme repli de l’extension lorsque le navigateur n’est pas configuré en français.

## Détection et préférence

Le site consulte `navigator.languages`, puis mémorise le choix manuel dans `localStorage` avec la clé `skkup-language`. L’extension conserve sa préférence dans son stockage local avec la clé `skkupLanguage`.

## Règles de traduction

- Les libellés d’interface, erreurs et états sont traduits.
- La navigation globale, les formulaires de connexion et d’inscription, ainsi
  que les indicateurs de contraintes du mot de passe suivent la langue active.
- Les actions de l’en-tête public adaptent aussi leur libellé à la page et à la
  langue active : inscription, connexion et accès aux streams.
- La formulation des gagnants d’un tirage suit également la langue active. Les
  messages provenant directement de l’API restent des contenus serveur et
  nécessitent une couverture dédiée des traductions côté backend. Les surfaces
  du site et de l’extension utilisent toutefois des libellés d’interface
  localisés pour leurs erreurs ; le hook de suivi ne réaffiche plus directement
  le message backend.
- À l’inscription, les contraintes affichées reflètent le contrat backend actuel
  : huit caractères minimum, une majuscule, une minuscule et un chiffre.
- Les pseudos, noms de chaînes, contenus libres et données provenant des plateformes ne sont jamais traduits automatiquement.
- Les contenus légaux doivent être relus et validés avant publication dans chaque langue.
- Une nouvelle langue doit ajouter ses entrées au provider du site et au dictionnaire de la popup, puis fournir des tests de fallback et de changement manuel.

## Validation

Avant livraison, exécuter les lint, typecheck et tests frontend et extension. Vérifier également le rendu des pages publiques, du dashboard et de la popup dans les navigateurs supportés.

## État de la carte

- Les pages publiques, l’authentification, le dashboard, l’administration et la popup de l’extension disposent d’entrées FR/EN et d’un repli explicite.
- La pagination du dashboard, les dates d’activité et les libellés de gains suivent maintenant la langue active.
- Les messages d’erreur de suivi de l’extension sont convertis dans la langue active de la popup.
- Les libellés d’accessibilité des indicateurs du dashboard suivent également la langue active, y compris les statistiques sans progression détaillée.
- La politique de confidentialité dispose d’une version FR/EN, mais les deux versions restent soumises à une relecture juridique avant publication.
- Le règlement du jeu reste stocké comme contenu juridique français en attendant sa traduction juridique validée.
- Les validations locales ont été exécutées avec Node.js 26.9.0 : frontend, lint, typecheck, 21 fichiers de tests / 65 tests et build ; extension, lint, typecheck, 9 fichiers de tests / 58 tests et build. Le script `verify-before-push.sh` et `git diff --check` passent.
- Le backend a également été validé avec Prisma généré : lint, typecheck, build et 34 suites / 252 tests passent. Les tests ont été exécutés avec autorisation d’ouvrir leurs ports HTTP locaux.
- Le frontend passe désormais le lint sans avertissement après correction de la dépendance de hook et de la directive eslint inutilisée.
- npm signale 5 vulnérabilités dans l’arbre frontend et 3 dans l’arbre extension. Aucune correction automatique n’a été appliquée dans cette carte ; elles doivent faire l’objet d’un work item de dépendances séparé.
- Les builds locaux ne constituent pas une validation multi-navigateurs : le rendu Chrome, Firefox, Opera et Safari, le responsive et l’accessibilité restent à exécuter et documenter.
- Les métadonnées publiques et les données structurées ont été alignées FR/EN sans fabriquer de `hreflang` : la sélection actuelle repose sur `localStorage`, donc un SEO bilingue par URL nécessite une évolution d’architecture.
- Contrôle production du 2026-09-26 dans Chrome : `skkup.fr` répond, Dokploy répond sur le VPS et le sélecteur FR/EN fonctionne pour la navigation. En revanche, le contenu principal de la page d’accueil reste en français après le passage en anglais. Le code source de `feature/i18n-complete` contient bien les composants localisés de la page d’accueil ; la production observée ne sert donc pas cette révision. Le déploiement de la branche de production doit être vérifié et approuvé avant de considérer le rendu EN comme validé.
- Commits de la branche : `4ada8e8` (métadonnées publiques), `5819d09` (stabilisation de la suite de tests frontend), précédés de `13bd7f8`, `720ee32` et `e084956` pour l’extension, les erreurs et l’authentification.
---
last_updated: 2026-09-26
---
