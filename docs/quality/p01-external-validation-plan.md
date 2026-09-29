# Plan de validation externe P01

Ce document prépare les contrôles qui nécessitent une preuve externe ou humaine. Il ne constitue pas une validation réalisée.

## V-01 Rotation des secrets

La personne habilitée doit confirmer la date de rotation, le périmètre des secrets concernés et la réussite d’un redéploiement. Aucune valeur ne doit être copiée dans Trello, Git ou les journaux.

Preuve attendue

- Capture ou export masqué de l’historique Dokploy.
- Identifiant du déploiement réussi.
- Vérification de santé après rotation.

## V-06 et V-07 DNS et courriel

Le contrôle doit distinguer les fuites d’information observées sur les réponses HTTP de l’existence d’un service courriel. Skkup n’ayant pas de fonctionnalité courriel déclarée, V-07 doit être marqué non applicable par une décision métier explicite ou validé par la configuration de production réellement retenue.

Preuve attendue

- Résolution DNS autorisée des domaines actifs.
- Vérification des en-têtes et messages publics.
- Décision écrite sur l’applicabilité d’un service courriel.

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

Les cases correspondantes restent ouvertes tant que la preuve attendue n’est pas disponible et relue. Une vérification technique partielle ne remplace pas une validation externe ou humaine.
