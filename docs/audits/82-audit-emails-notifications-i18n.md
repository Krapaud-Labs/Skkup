# Audit des emails et notifications pour l’internationalisation

Date de l’audit : 2026-09-27
Branche d’audit : `feature/audit-email-notifications` (créée depuis `dev`)

## Conclusion

Le projet ne contient pas de canal d’envoi d’emails implémenté. Aucun transport SMTP, fournisseur transactionnel, template d’email, worker d’envoi ou configuration de credentials n’a été trouvé dans le backend, le frontend ou l’extension.

Le projet contient en revanche un canal de notifications temps réel Socket.IO relayé par Redis. Il couvre les points, les séries, le déblocage de cartes et le résultat des tirages pour les clients connectés. Ce canal ne remplace pas un email : il ne garantit ni la remise hors connexion ni la notification d’un gagnant après déconnexion.

## Éléments vérifiés

- `backend/src/realtime/realtime.service.ts` expose uniquement les événements temps réel `points`, `streak`, `carte débloquée`, `statut de tirage` et `résultat de tirage`.
- `backend/src/realtime/realtime.bridge.ts` et `backend/src/worker.ts` publient les événements via Redis/Socket.IO ; aucun envoi SMTP ou HTTP vers un fournisseur email n’est effectué.
- `backend/src/worker.ts` ne planifie que les jobs de tirage et de maintenance.
- Les occurrences d’email dans le modèle et l’authentification servent à identifier le compte, pas à expédier un message.
- Les textes du règlement et de la politique mentionnant le contact d’un gagnant par email décrivent une exigence métier non couverte techniquement.
- Aucun module, template, endpoint ou test d’envoi d’email n’existe dans le périmètre audité.

## Décision pour la carte d’internationalisation

Le check « emails, notifications et messages visibles » ne peut pas être coché comme terminé : le canal email n’est pas implémenté. Les notifications temps réel existantes ne doivent pas être présentées comme des emails traduits.

Pour les messages exposés par l’API, le contrat retenu reste : messages techniques en anglais ; adaptation UX FR/EN côté frontend et extension lorsque le message est présenté à l’utilisateur. Cette règle est applicable au canal temps réel lorsqu’un texte est ajouté à son payload, mais les payloads actuels sont principalement structurés.

## Work item à prévoir

Créer et traiter une carte dédiée « Implémenter les emails transactionnels et notifications hors connexion FR/EN » avant de valider ce check. Elle devra au minimum couvrir :

1. choix et configuration d’un fournisseur email transactionnel ;
2. templates FR/EN versionnés pour confirmation, gagnant, changement sensible et erreurs de livraison ;
3. file d’envoi avec reprise, idempotence, journalisation sans données sensibles et observabilité ;
4. préférence utilisateur et consentement lorsque requis ;
5. fallback et déduplication avec les notifications temps réel ;
6. tests unitaires, intégration et livraison contrôlée sur un environnement de test ;
7. validation des textes légaux et vérification de délivrabilité en production.

Le check restera ouvert jusqu’à la preuve de ce work item et d’une validation FR/EN sur chaque canal effectivement livré.
