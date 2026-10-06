# UX-003 - Architecture cible premium

## Principe directeur

Le dashboard devient un poste de pilotage orienté décision. Chaque donnée possède un emplacement principal. Les résumés servent à prioriser et renvoient vers une action ou un détail, sans recopier les mêmes informations.

## Structure viewer

1. **Accueil personnalisé** : solde de points, progression, prochaine action utile et activité récente.
2. **Gagner** : actions disponibles pour gagner des points, avec conditions, état de progression et résultat attendu.
3. **Récompenses** : tirages ouverts, tickets, chances et historique liés à une action claire.
4. **Activité** : historique filtrable et paginé, avec détail au même endroit plutôt que répété dans les autres vues.
5. **Compte** : préférences, sécurité, langue et déconnexion.

## Structure administration

1. **Cockpit** : signaux à traiter, tendances et raccourcis vers les tâches urgentes. Les KPI sont des entrées fonctionnelles, pas des copies de listes.
2. **Modération** : signalements, utilisateurs, sponsors et décisions en attente, avec filtres et historique contextualisé.
3. **Contenu** : bibliothèque, éditeur, prévisualisation, publication, versions et audit dans un flux unique.
4. **Campagnes et annonces** : création, ciblage, aperçu, publication, archivage et restauration.
5. **Tirages** : configuration, lots, participants, exécution et preuve d’audit.
6. **Streams** : catalogue, partenariat, bonus et état de synchronisation.

## Règles de non-redondance

- Une information affichée dans le cockpit ne réapparaît pas comme bloc complet dans une liste : le cockpit garde le résumé et la liste garde le détail.
- Un historique est accessible depuis l’entité concernée et n’est pas copié dans plusieurs sections.
- Les filtres persistants sont propres à une vue et leur état est visible.
- Un bouton d’action n’existe qu’à l’endroit où son contexte et son retour sont compréhensibles.
- Une navigation locale ne duplique pas la navigation globale.

## Contrat de fonctionnalité

Chaque élément interactif doit déclarer sa destination ou son effet, les permissions nécessaires, les états chargement/succès/vide/erreur et le test qui le couvre. Les éléments non implémentables sont retirés du prototype.

## Checkpoint de conception

Cette architecture doit être traduite en prototype viewer/admin comparatif avant toute refonte des composants de production.
