# Audit des emails, notifications et messages visibles

## Périmètre et date

Audit réalisé le 27 septembre 2026 sur `feature/i18n-email-audit`, créée depuis
`dev`, dans le cadre du check « emails, notifications et messages visibles »
de la carte Trello d’internationalisation.

## Résultat

### Emails

Aucun canal d'envoi d'emails n'est implémenté dans le périmètre actuel :

- aucune dépendance SMTP, fournisseur transactionnel ou SDK d'envoi n'est
  déclarée dans `backend/package.json` ;
- aucun module, service, worker ou configuration SMTP/API d'envoi n'a été
  trouvé dans `backend/src` ;
- les références aux emails dans le règlement et la politique de confidentialité
  décrivent des besoins ou des coordonnées, pas un flux technique actif.

Le check « emails » ne peut donc pas être coché. Il doit devenir un work item
dédié avant toute promesse d'email de bienvenue, de réinitialisation de mot de
passe, de résultat de tirage ou de notification transactionnelle.

### Notifications temps réel

Un canal de notification existe : Socket.IO, relayé par Redis pour le worker.
Il expose des événements techniques (`points:updated`, `streak:updated`,
`scratch-card:unlocked` et événements de tirage) et non des phrases destinées
à l'utilisateur. Les données restent donc indépendantes de la langue ; le
libellé UX doit être produit par le client selon la langue active.

Les annonces administratives sont persistées et exposées par l'API comme du
contenu éditorial. Leur titre et leur texte ne disposent pas encore d'une
structure FR/EN : elles ne sont pas déclarées comme traduites par cet audit.

### Messages API et UX

Le commit `cfa87e9` standardise les messages API visibles en anglais. Le
frontend conserve la responsabilité de présenter les états et libellés UX dans
la langue active. Les tests existants couvrent la propagation des messages API
et les composants localisés, mais une matrice exhaustive de chaque erreur
backend affichée dans chaque écran reste à prévoir dans le work item UX dédié.

## Validations

La recherche statique a été exécutée sur `backend/src`, `frontend/src`,
`extension/src` et `docs`. Les commandes locales `npm run lint`,
`npm run typecheck`, `npm test -- --runInBand` et `npm run build` n'ont pas pu
être exécutées dans cet environnement : `npm` est indisponible.

Le commit API provient d'une branche dédiée antérieure et ses validations CI
étaient documentées dans sa PR ; cette branche ajoute la preuve de périmètre
et ne prétend pas remplacer une nouvelle exécution locale.

## Work items à prévoir

1. Ajouter un fournisseur d'email transactionnel, une file d'envoi, des
   templates FR/EN, la gestion des erreurs, la confidentialité et des tests
   avec fournisseur simulé.
2. Ajouter un modèle de contenu d'annonce FR/EN et définir le comportement
   quand une traduction manque.
3. Ajouter une couche UX centralisée qui mappe les codes d'erreur API anglais
   vers les messages FR/EN, puis tester chaque écran consommateur.
4. Exécuter les validations locales et un test navigateur sur les états de
   notification après installation de Node/npm.

## Décision Trello

Le check reste ouvert : l'absence d'emails est prouvée, mais les work items
ci-dessus ne sont pas implémentés et la validation locale complète est
indisponible.
