---
title: Audit des emails, notifications et messages visibles
last_updated: 2026-09-27
status: needs-review
---

# Audit des emails, notifications et messages visibles

## Périmètre et date

Audit réalisé le 27 septembre 2026 dans le cadre du check « emails,
notifications et messages visibles » de la carte d'internationalisation.

## Résultat

### Emails

Aucun canal d'envoi d'emails n'est implémenté dans le périmètre actuel :

- aucune dépendance SMTP, fournisseur transactionnel ou SDK d'envoi n'est
  déclarée dans `backend/package.json` ;
- aucun module, service, worker ou configuration SMTP/API d'envoi n'a été
  trouvé dans `backend/src` ;
- les références aux emails dans le règlement et la politique de
  confidentialité décrivent des besoins ou des coordonnées, pas un flux
  technique actif.

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

Les messages API visibles sont en anglais. Le frontend conserve la
responsabilité de présenter les états et libellés UX dans la langue active.
Une matrice exhaustive de chaque erreur backend affichée dans chaque écran
reste à prévoir dans le work item UX dédié.

## Validations et limites

La recherche statique couvre `backend/src`, `frontend/src`, `extension/src` et
`docs`. Les commandes locales `npm run lint`, `npm run typecheck`, `npm test`
et `npm run build` n'ont pas pu être exécutées dans cet environnement : `npm`
est indisponible. Le lint du kit ne peut pas être exécuté non plus avec le
Python système actuel, car `tomllib` est absent de Python 3.9.

Le présent rapport ne remplace ni une CI verte ni une validation navigateur.
Les emails, les annonces bilingues et la traduction UX restent des work items
ouverts.

## Décision

Le check reste ouvert : l'absence d'emails est prouvée, mais les work items
correspondants ne sont pas implémentés et la validation locale complète est
indisponible.
