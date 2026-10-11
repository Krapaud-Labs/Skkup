# Test en conditions réelles de l’extension et cumul des points

**Carte Trello** : [Test en conditions réelles de l’extension et cumul des points](https://trello.com/c/mL23HRxe)

**Branche** : `feature/qa-extension-real-world`

**Date de l’audit** : 2026-09-27

## Périmètre

L’audit couvre le contrat de l’extension MV3, l’association par code, la
détection d’une lecture visible, l’ouverture et la clôture d’une session, les
heartbeats, ainsi que le crédit idempotent des points côté backend. Aucun
compte réel, jeton, code d’association ou secret n’est conservé dans ce
document.

## Validations exécutées

Les commandes ont été exécutées avec le runtime Node local version 26.8.2,
sans modifier les données d’un environnement distant :

```text
extension: npm test                         9 fichiers, 56 tests OK
backend:   npm test -- --runInBand src/extension src/me/me.service.spec.ts
                                             4 suites, 49 tests OK
extension: npm run lint                     OK
extension: npm run typecheck                OK
extension: npm run build                    OK, extension/dist généré
backend:   npm run typecheck               OK
git diff --check                            OK
```

Les tests backend couvrent notamment l’appariement, l’authentification de
l’extension, l’ouverture de session, les heartbeats, l’absence de crédit
répété et les règles de streak. Les tests extension couvrent la détection de
lecture, la visibilité de la page, l’orchestration, la reprise et le stockage
du jeton.

## Résultat technique

- L’extension n’attribue pas elle-même les points : elle transmet des signaux
  de lecture et le backend reste l’autorité du crédit.
- Une session d’extension porte une source `EXTENSION` et est soumise aux
  contrôles serveur de durée, de cadence et d’idempotence.
- Les changements d’onglet, la pause, la fin de lecture, le changement de
  chaîne et le silence prolongé sont traités par l’orchestrateur.
- Aucun correctif produit n’a été nécessaire pendant cet audit.

## Limites et preuve manquante

Le test E2E demandé avec un compte viewer dédié, un navigateur propre, une
extension chargée et des logs de déploiement n’a pas pu être exécuté dans cet
environnement :

- `browser-act` n’est pas installé ;
- `uv`, requis par le skill navigateur pour l’installer, n’est pas installé ;
- le navigateur connecté expose le site mais ne permet pas ici de charger et
  piloter le paquet local de l’extension ;
- aucun compte de test ni accès aux logs ou à la base de test n’a été fourni.

En conséquence, les checks « installation et association », « streams réels
Twitch/YouTube/Facebook Live », « cumul observé dans le Dashboard et via
l’API » et « captures/logs d’un compte de test » restent ouverts dans Trello.
Cette limitation est intentionnelle : aucune donnée d’un compte réel n’a été
transmise, et aucun secret n’a été écrit dans Git ou Trello.

## Suite requise

Un testeur autorisé doit exécuter le scénario avec un compte viewer dédié sur
un environnement de test, joindre des captures non sensibles, les identifiants
de session anonymisés et les logs expurgés, puis relire les points avant et
après chaque heartbeat. La carte ne doit pas être clôturée avant cette preuve.
