# Matrice QA des mises à jour WebSocket des dashboards

Date de l'audit 2026-10-13

## Périmètre vérifié

L'audit couvre le client Socket.IO, les événements émis par le backend et les
dashboards viewer et administrateur. Les données REST restent la source de
chargement initial et de rattrapage.

## Matrice événement → donnée → écran → preuve

| Événement | Source backend | Donnée attendue | Viewer | Admin | Test observé | Statut |
|---|---|---|---|---|---|---|
| `points:updated` | `RealtimeService.notifierPoints` | Solde de points et montant de l'opération | Solde mis à jour directement | Aucun abonnement | `TableauDeBord.test.tsx` vérifie le solde | Couvert viewer, absent admin |
| `streak:updated` | `RealtimeService.notifierStreak` | Série actuelle et série maximale | Série mise à jour directement | Aucun abonnement | Handler présent, assertion dédiée à renforcer | Partiel viewer, absent admin |
| `scratch-card:unlocked` | `RealtimeService.notifierCarteDebloquee` | Cartes disponibles | Liste rechargée par REST | Aucun abonnement | `TableauDeBord.test.tsx` vérifie le rechargement | Couvert viewer, absent admin |
| `extension:pairings-updated` | `RealtimeService.notifierAppariements` | Appareils associés | Aucun abonnement dans le dashboard viewer | Aucun abonnement | `CodeAppariement.test.tsx` couvre la page extension | Couvert page extension, absent dashboard |
| `raffle:status` | `RealtimeService.notifierStatutTirage` | Tirage ouvert ou fermé, disponibilité des tickets | Aucun abonnement | Aucun abonnement | Backend seulement | Non couvert frontend |
| `raffle:result` | Worker puis `notifierResultatTirage` | Résultat du tirage et tickets gagnants | Aucun abonnement | Aucun abonnement | Backend bridge seulement | Non couvert frontend |
| `users:count` | `RealtimeService.notifierNombreUtilisateurs` | Nombre public d'utilisateurs | Page vitrine uniquement | Non concerné | `LocalizedHomeTrust.test.tsx` | Couvert hors dashboard |

## Données dashboard actuellement non rafraîchies

- Historique des points et transactions récentes après un nouveau visionnage
  ou une attribution de points.
- Nombre et contenu des tickets de tirage après une inscription ou une
  attribution.
- Tirage ouvert et ses lots après changement de statut.
- Résultat de tirage et statut gagnant d'un ticket.
- État d'appariement affiché depuis un dashboard qui ne serait pas la page
  extension.
- Les métriques du cockpit administrateur après modification d'un utilisateur,
  d'un lot, d'un tirage, d'une annonce ou d'un contenu.

## Tests exécutés

| Suite | Commande | Résultat |
|---|---|---|
| Frontend temps réel et dashboards | `npm test -- --run src/components/dashboard/TableauDeBord.test.tsx src/components/extension/CodeAppariement.test.tsx src/components/i18n/LocalizedHomeTrust.test.tsx src/lib/temps-reel.test.ts` depuis `frontend` | 4 fichiers, 35 réussis, 6 ignorés |
| Backend Socket.IO | `npm test -- src/realtime/realtime.gateway.spec.ts src/realtime/realtime.service.spec.ts src/realtime/realtime.bridge.spec.ts` depuis `backend` | 3 suites, 38 réussis |

La première commande backend tentée avec `--run` est invalide pour Jest. Elle a
été rejouée avec la syntaxe correcte et a réussi.

## Conclusion QA

Le canal Socket.IO fonctionne et ses événements privés sont couverts côté
backend. La couverture frontend est incomplète pour les dashboards. Le manque
principal n'est pas un bouton de rafraîchissement, mais l'absence de handlers
et de rechargements ciblés pour les événements de tirage, l'historique, les
tickets et le cockpit administrateur.

La prochaine correction doit ajouter les abonnements et les fonctions de
rattrapage REST correspondantes, puis ajouter une assertion par ligne de la
matrice avant toute validation visuelle finale.
