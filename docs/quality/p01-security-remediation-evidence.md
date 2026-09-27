# Preuves de remédiation sécurité P01

Ce document recense les preuves vérifiables de la remédiation sécurité. Il ne contient aucun secret, identifiant sensible ou contenu du rapport confidentiel.

## Preuves validées

- Les correctifs P01 sont présents dans la branche `feature/security-password-policy-p01`, révision `e13d3d4`, et proposés à `dev` par la PR 148.
- Les chemins d’erreur et journaux couverts par les tests de sécurité ne divulguent plus les détails techniques ciblés.
- La réponse de création d’annonce ne renvoie plus l’identifiant interne du créateur.
- Les ports locaux de l’override Compose sont liés à l’adresse de boucle locale.
- La configuration Dokploy ne publie aucun port hôte pour les services de données.
- Le réseau de données Dokploy est interne.
- Les cookies de session de production sont configurés avec l’attribut sécurisé.
- La configuration Compose Dokploy est structurellement valide avec des variables obligatoires, sans prouver les valeurs secrètes réellement injectées.
- Le fichier `.env` local est ignoré par Git et ses permissions sont limitées au compte courant.
- Aucun fichier de secret suivi par Git n’a été détecté dans le diff de la branche.
- La configuration Compose Dokploy est validée par `docker compose config`.
- À la date du 27 septembre 2026, la construction backend avec Node 26 et la commande `npm test -- --runInBand` ont réussi sur la révision de travail, avec 38 suites et 265 tests passés.
- À la date du 27 septembre 2026, la construction frontend Next.js a réussi avec le contrôle TypeScript et `npm test -- --run`, avec 22 suites et 68 tests passés.
- L’aide française et anglaise du formulaire d’inscription indique maintenant douze caractères minimum, en cohérence avec le DTO backend et ses tests.
- La contrainte navigateur de l’inscription vérifie aussi la présence d’une minuscule, d’une majuscule et d’un chiffre avant soumission.
- Les références SHA des actions `checkout` et `setup-node` du workflow CI sont vérifiées sur leurs dépôts officiels.
- Le déploiement sans cache de la révision `a458408` a terminé avec succès dans Dokploy.
- Dans l’interface Dokploy observée le 27 septembre 2026, le frontend, le backend, le worker et Redis étaient sains, la migration s’était terminée avec le code 0 et PostgreSQL était sain.

## Contrôles restant à démontrer

- La rotation effective des secrets et des identifiants dans Dokploy.
- La validation DNS et courriel en production.
- La validation humaine de la conformité informationnelle.
- La campagne authentifiée dédiée au périmètre V-10.
- La vérification des en-têtes HTTP depuis le domaine public, qui n’a pas pu être exécutée car la résolution et la connexion publiques de `skkup.fr` ne répondaient pas depuis l’environnement de contrôle.
- La réussite des checks GitHub de la PR 148, qui échouent actuellement avant l’exécution des étapes malgré la correction des références d’actions.

Ces contrôles restent ouverts tant qu’une preuve opérationnelle ou humaine correspondante n’est pas disponible.
