# Vérification de l'interface rollback Dokploy

Date: 2026-10-11

## Déploiement courant

- Service: `skkup-staging` isolé de la production.
- Branche: `chore/dash-v3-final-design-1-16-30`.
- Dernier déploiement: commit `5049a986f5c3bc8dbc8a19a3b5112135be0645af`.
- Statut affiché: `Done`.

## Contrôles disponibles

Dans l'onglet `Deployments`, Dokploy expose pour les déploiements historiques
`View` et `Delete`. Les actions globales visibles sont `Clear deployments`,
`Kill Build` et `Cancel Queues`.

Aucun sélecteur de commit, bouton `Rollback` ou action de restauration de
volume n'est exposé. Aucune suppression ni annulation n'a été déclenchée.

Dans l'onglet `Backups`, Dokploy indique qu'au moins un provider doit être
configuré avant de créer une sauvegarde. Aucun provider n'est actuellement
configuré pour ce service staging. Une restauration distante ne peut donc pas
être exécutée ni déclarée vérifiée dans cet état.

## Verdict

Le déploiement staging courant est prouvé, mais le rollback applicatif et la
restauration distante Dokploy restent `NEEDS-REVIEW` faute de contrôle
réversible et de provider de sauvegarde configuré dans cette interface. Cette
preuve remplace toute nouvelle inspection identique tant que la configuration
Dokploy ou ses droits ne changent pas.
