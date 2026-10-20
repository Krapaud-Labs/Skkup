---
last_updated: 2026-10-20
---
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

Vitrine, authentification native, dashboard, extension Chrome, Twitch/Kick/YouTube/Kick, calcul backend, streak, tickets, tirage mensuel manuel, lots, règlement et back-office minimal. Dépendances : PostgreSQL, Redis, services de streaming et validation juridique.

## Hors périmètre et hypothèses

Hors périmètre : retrait d'argent, points monétisables, identité Google/Facebook/Twitch, cookies ou historique navigateur. Hypothèses : France au lancement, âge cible 18 ans sous validation juridique, MVP progressif et stack existante conservée.

## Contraintes et critères de réussite

Le budget, le calendrier, l'hébergement et l'équipe restent inconnus. Contraintes : extension Chrome initiale, sécurité des sessions, minimisation des données et examen humain des sanctions importantes. Les barèmes et plafonds de points, récompenses, probabilités, prix et calendrier des tirages qui n'ont pas fait l'objet d'une décision owner restent hors MVP; aucune valeur numérique historique n'est une règle acceptée. Terminé signifie règles documentées, tests reproductibles, conformité relue et preuves archivées.

La décision de report des valeurs non arrêtées est consignée dans la
[décision ACT-11](act-11-values-decision.md); elle ne vaut ni décision sur
chaque fonctionnalité, ni approbation globale de la conception.
