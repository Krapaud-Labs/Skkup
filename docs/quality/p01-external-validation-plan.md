---
last_updated: 2026-10-18
owner: Mickael MUR
---

# Plan de validation externe P01

Ce document prépare les contrôles qui nécessitent une preuve externe ou humaine. Il ne constitue pas une validation réalisée.

## V-01 Rotation des secrets

La personne habilitée doit confirmer la date de rotation, le périmètre des secrets concernés et la réussite d’un redéploiement. Aucune valeur ne doit être copiée dans Trello, Git ou les journaux.

Preuve attendue

- Capture ou export masqué de l’historique Dokploy.
- Identifiant du déploiement réussi.
- Vérification de santé après rotation.

## V-06 Fuites d’information

Le contrôle porte sur les fuites d’information observées dans les réponses HTTP publiques et les messages d’erreur. Aucun contrôle courriel ne fait partie du périmètre Skkup.

Preuve attendue

- Vérification des en-têtes et messages publics.

## V-09 Conformité informationnelle

Une personne habilitée doit relire les informations publiques, les mentions légales, les règles du jeu et les messages de consentement. La validation doit identifier les pages couvertes, la date et les réserves éventuelles.

Preuve attendue

- Nom ou rôle du valideur.
- Périmètre relu.
- Décision et réserves datées.

## V-10 Campagne authentifiée

La campagne doit utiliser des comptes de test dédiés et une autorisation explicite. Elle couvre l’inscription, la connexion, les droits viewer et administrateur, les sessions, la révocation et les contrôles d’accès objet. Aucun compte réel ni donnée de production ne doit être utilisé.

Preuve attendue

- Autorisation et périmètre approuvés.
- Comptes de test identifiés sans secret dans les preuves.
- Scénarios exécutés et résultats reproductibles.
- Rapport redacted avec les anomalies et leur statut.

## Règle de clôture

Les cases correspondantes restent ouvertes tant que la preuve attendue n’est pas disponible et relue. Une vérification technique partielle ne remplace pas une validation externe ou humaine. Le courriel est hors périmètre et ne doit pas être réintroduit sans évolution du produit.
