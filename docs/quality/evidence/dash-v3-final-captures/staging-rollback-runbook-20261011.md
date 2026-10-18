---
last_updated: 2026-10-18
owner: Mickael MUR
---

# Runbook rollback et restauration staging DASH-V3

Date: 2026-10-11

## Préconditions

- environnement staging isolé de la production ;
- commit courant relevé avant action ;
- commit cible identifié et présent sur la branche dédiée ;
- sauvegarde PostgreSQL vérifiée dans un fichier temporaire hors dépôt ;
- accès opérateur Dokploy ou SSH au VPS ;
- fenêtre d'observation et procédure de retour au commit courant définies.

## Procédure réversible

1. Relever le commit déployé, l'état des conteneurs et les healthchecks.
2. Créer un dump PostgreSQL custom et vérifier qu'il est lisible avec
   `pg_restore --list`.
3. Déployer le commit cible sur le seul service staging, sans `Fresh Volumes`.
4. Vérifier migrations, healthchecks, routes principales et logs.
5. Restaurer le commit courant par le même mécanisme si le contrôle échoue.
6. Restaurer les données uniquement dans une base temporaire ou un volume
   staging dédié, puis comparer les tables attendues.
7. Archiver les commits, images, logs, résultats et heures de début/fin.

## État actuel

Le staging Dokploy est sain et le dernier déploiement `5049a98` est `Done`.

L'interface actuellement disponible n'expose toutefois ni sélection de commit,
ni bouton rollback, ni restauration de volume. Cette procédure est donc
préparée mais non exécutée. Aucun volume staging ou production n'a été modifié
pour fabriquer une preuve.

## Critère de fermeture

Le gate ops ne pourra passer à `verified` qu'après une exécution réelle et
réversible de cette recette sur staging, avec preuve de retour au commit courant
et des données restaurées.
