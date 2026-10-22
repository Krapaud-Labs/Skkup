# Vision, objectifs et périmètre

## Contexte et problème

Skkup veut récompenser gratuitement le visionnage actif de streams par des points, des tickets et des tirages de lots réels, sans retrait d'argent ni valeur monétaire des points.

## Parties prenantes et utilisateurs

| Acteur | Besoin | Fréquence | Niveau d accès | Attente de réussite |
| --- | --- | --- | --- | --- |
| Visiteur | Comprendre le service et les règles | ponctuelle | public | proposition comprise |
| Viewer | Regarder, cumuler et suivre ses gains | régulière | compte | points et historique fiables |
| Administrateur | Configurer, contrôler et tirer | opérationnelle | privilégié | actions auditées |

## Objectifs mesurables

| Objectif | Indicateur | Valeur cible | Méthode de mesure | Horizon |
| --- | --- | --- | --- | --- |
| Activité validée | Heartbeats crédités sans doublon | 99 % des cas valides | journaux backend | MVP |
| Appariement | Extension liée à un compte | parcours terminé sans erreur bloquante | métriques API | MVP |
| Transparence | Tirage reproductible et auditable | 100 % des tirages documentés | journal admin | avant production |

## Périmètre de la première version

Vitrine, authentification native, dashboard, extension Chrome, calcul backend, streak, tickets, tirage manuel, lots, règlement et back-office minimal. Le cahier accepté ne sélectionne pas les plateformes de visionnage; leur choix reste à arbitrer par le responsable produit. Dépendances : PostgreSQL, Redis, services de streaming à déterminer et validation juridique.

## Hors périmètre et hypothèses

Hors périmètre : retrait d'argent, points monétisables, identité Google/Facebook/Twitch, cookies ou historique navigateur. Hypothèses : France au lancement, âge cible 18 ans sous validation juridique, MVP progressif et stack existante conservée.

## Contraintes et critères de réussite

Le budget, le calendrier, l'hébergement et l'équipe restent inconnus. Contraintes : extension Chrome initiale, plafond de visionnage de 8 heures, référence de 65 points par jour, sécurité des sessions, minimisation des données et examen humain des sanctions importantes. Terminé signifie règles documentées, tests reproductibles, conformité relue et preuves archivées.
---
last_updated: 2026-10-22
---
