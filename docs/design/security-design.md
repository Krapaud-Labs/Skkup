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

## Preuves et portes restantes

| Contrôle | Preuve attendue | État |
|---|---|---|
| Secrets | recherche reproductible dans les fichiers suivis et variables hors dépôt | contrôles locaux partiels, revue de livraison requise |
| Sessions et permissions | tests auth, guards et vérification des routes protégées | tests présents, couverture indépendante à relire |
| Limitation API et WebSocket | tests de throttling et journaux expurgés | tests backend réussis, preuve CI à relire |
| Sauvegardes et restauration | exercice sur environnement de validation | non vérifié |
| Audit préproduction | rapport indépendant et risques résiduels | requis avant production |
---
last_updated: 2026-09-25
---
