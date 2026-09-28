# Preuves de remédiation sécurité P01

Ce document recense les preuves vérifiables de la remédiation sécurité. Il ne contient aucun secret, identifiant sensible ou contenu du rapport confidentiel.

## Preuves validées

- La branche dédiée de remédiation est propre et synchronisée avec son dépôt distant.
- Les réponses d’erreur internes et les journaux concernés ne divulguent plus de détails techniques sensibles.
- La réponse de création d’annonce ne renvoie plus l’identifiant interne du créateur.
- Les ports locaux de l’override Compose sont liés à l’adresse de boucle locale.
- La configuration Dokploy ne publie aucun port hôte pour les services de données.
- Le réseau de données Dokploy est interne.
- Les cookies de session de production sont configurés avec l’attribut sécurisé.
- La configuration Compose Dokploy est valide avec les variables d’environnement injectées par Dokploy.
- Le fichier `.env` local est ignoré par Git et ses permissions sont limitées au compte courant.
- Aucun fichier de secret suivi par Git n’a été détecté dans le diff de la branche.

## Contrôles restant à démontrer

- La rotation effective des secrets et des identifiants dans Dokploy.
- La validation DNS et courriel en production.
- La validation humaine de la conformité informationnelle.
- La campagne authentifiée dédiée au périmètre V-10.

Ces contrôles restent ouverts tant qu’une preuve opérationnelle ou humaine correspondante n’est pas disponible.
