---
title: Audit des emails et notifications FR/EN
last_updated: 2026-10-01
status: verified-with-scope
---

# Audit des emails et notifications FR/EN

## Résultat

Le site dispose d'un canal de notifications temps réel via Socket.IO. Les
événements transportent uniquement des données structurées (points, série et
carte à gratter), sans phrase dépendante de la langue. Le tableau de bord
affiche désormais un message accessible dans la langue active :

- « Points mis à jour » et « Série mise à jour » en français ;
- « Points updated » et « Streak updated » en anglais ;
- message FR/EN lors du déblocage d'une carte à gratter.

Les valeurs et les noms d'événements restent indépendants de la langue. Cela
évite de traduire deux fois un même message et conserve l'anglais comme langue
du contrat API.

## Blocage emails

Aucun envoi d'email n'est actuellement implémenté : aucun fournisseur,
transport SMTP/API, template, file d'envoi ou worker de livraison n'est
déclaré dans le backend. Il n'est donc pas possible de valider les emails
transactionnels FR/EN sans choisir et configurer un fournisseur, définir les
templates, gérer les préférences et tester la délivrabilité.

Les emails de bienvenue, de réinitialisation de mot de passe, de résultat de
tirage et de remise de lot restent un work item séparé. Le présent changement
ne simule pas leur envoi et ne coche pas cette partie du check.

## Vérification

Le test du tableau de bord vérifie le message temps réel en français et en
anglais. Les messages d'erreur API métier ont été harmonisés en anglais et les
tests backend ont été alignés sur ce contrat.

Preuves du 1er octobre 2026 : lint backend réussi, typecheck réussi, 34 suites
Jest réussies, 252 tests réussis et build NestJS réussi. Aucun fournisseur
email n'existe dans le périmètre actuel ; la traduction des emails reste donc
hors périmètre et suivie séparément par P22.
