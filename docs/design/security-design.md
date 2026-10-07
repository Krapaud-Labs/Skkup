# Conception de sécurité

## Périmètre et actifs à protéger

| Actif | Propriétaire | Sensibilité | Menace principale | Protection | Preuve |
| --- | --- | --- | --- | --- | --- |
| Compte et session | backend | élevée | vol de session | hash, cookie sécurisé, rotation | tests auth |
| Ledger de points | produit | élevée | falsification | append-only, idempotence, audit | tests métier |
| Tirage et lots | admin | élevée | contestation | liste figée, CSPRNG, empreinte | preuve de tirage |
| Données extension | viewer | élevée | collecte excessive | permissions minimales | revue manifest |

## Authentification, autorisation et secrets

Le mot de passe est haché. Les sessions et jetons sont limités, révocables et stockés hors dépôt. Les rôles viewer/admin suivent le moindre privilège. Les secrets proviennent de l'environnement de déploiement.

## Analyse de menaces

| Menace | Vecteur | Impact | Probabilité | Mesure préventive | Détection | Risque résiduel |
| --- | --- | --- | --- | --- | --- | --- |
| Faux heartbeat | extension/API | élevée | élevé | nonce, cadence, idempotence | signaux et audit | moyen |
| Compte partagé | session/appareils | élevée | moyen | limite appareils et corrélation | revue fraude | moyen |
| Injection | entrées API | élevée | moyen | validation DTO/ORM | logs sécurité | faible |

## Exigences de sécurité vérifiables

Les entrées sont validées, les endpoints sensibles limités, les secrets absents du dépôt, les actions admin journalisées et les sauvegardes testées. Un audit sécurité est requis avant production.

## Vérification et exploitation

La revue sécurité doit fournir les preuves de rotation/révocation des sessions,
de purge des données, de limitation des heartbeats, de protection CSRF des
actions cookie, de séparation viewer/admin et de restauration d'une sauvegarde.
Les secrets sont injectés uniquement par l'environnement de déploiement; aucun
secret de test ne doit être écrit dans les fixtures ou la documentation.
---
last_updated: 2026-09-25
---
