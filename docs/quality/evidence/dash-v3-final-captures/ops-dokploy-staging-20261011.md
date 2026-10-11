# Exploitation staging DASH-V3

## Observations relues dans Dokploy

- Service: `skkup-staging`, environnement staging isolé de la production.
- Déploiements visibles et terminés avec succès jusqu’au commit `d62a3b1`.
- Monitoring Dokploy disponible pour les conteneurs, avec le frontend staging
  en état `running` et des métriques CPU, mémoire, I/O et réseau.
- Un fournisseur de notifications nommé `Mnesya VPS Bot` est configuré.

## Limites de la preuve

Cette lecture ne prouve pas la réception d’une alerte Discord, le rollback entre
deux versions, ni une restauration distante PostgreSQL/Redis/volumes. Aucun
rollback n’a été déclenché pour éviter une mutation staging non nécessaire.
La case opérations reste donc `NEEDS-REVIEW` jusqu’à l’exécution contrôlée de
ces scénarios et à la relecture de leurs résultats.
