# Preuves de remédiation sécurité P01

Ce document recense les preuves vérifiables de la remédiation sécurité. Il ne contient aucun secret, identifiant sensible ou contenu du rapport confidentiel.

## Preuves validées

- Les correctifs P01 sont présents dans la branche `feature/security-password-policy-p01`, révision `a8ebf3d`, et proposés à `dev` par la PR 148.
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
- Le 27 septembre 2026, `skkup.fr` résolvait vers le VPS et répondait en HTTPS avec un statut 200 ; `www.skkup.fr` redirigeait en HTTPS vers le domaine canonique.
- Les réponses HTTPS publiques observées exposaient une politique CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy` et `frame-ancestors` restrictifs.
- L’environnement Dokploy affichait uniquement des valeurs masquées, avec la création du fichier d’environnement activée et les variables nécessaires présentes sans divulgation de valeur.
- Un `.env` local a été régénéré avec des valeurs aléatoires dédiées au développement, des permissions `0600`, et il est confirmé ignoré par Git ; aucune valeur n’a été publiée.
- Le run CI 545 de la PR 148 est entièrement réussi sur la révision `a8ebf3d`.
- Le frontend passe avec 22 suites et 68 tests.
- L’extension passe avec 9 suites et 56 tests.
- Le backend et la construction des images Docker passent.

## Contrôles restant à démontrer

- La rotation effective des secrets et des identifiants dans Dokploy.
- La validation DNS et courriel en production.
- La validation humaine de la conformité informationnelle.
- La campagne authentifiée dédiée au périmètre V-10.
- La validation courriel complète, car aucun enregistrement MX n’est actuellement publié pour `skkup.fr`.

Ces contrôles restent ouverts tant qu’une preuve opérationnelle ou humaine correspondante n’est pas disponible.
