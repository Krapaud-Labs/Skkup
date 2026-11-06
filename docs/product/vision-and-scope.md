---
last_updated: 2026-11-06
---

# Vision, objectifs et périmètre

## Proposition de valeur

Skkup récompense l'activité de visionnage de streams et les visites
quotidiennes : « regarder, accumuler, gagner ». Les viewers gagnent des points,
puis utilisent les avantages réellement disponibles, notamment les tickets
de tirages au sort. Les points n'ont pas de valeur monétaire et ne peuvent pas
être retirés en argent.

## Acteurs

- **Viewer fidèle** : suit des streamers et souhaite être récompensé pour son
  activité de visionnage.
- **Chasseur de lots** : consulte les tirages, tickets et récompenses
  disponibles.
- **Streamer partenaire** : piste de partenariat ou d'affiliation à étudier
  séparément, hors périmètre V1.

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

Vitrine, authentification native, dashboard, extension Chrome, calcul backend, streak, tickets, tirage manuel, lots, règlement et back-office minimal. Par décision du responsable produit du 2026-10-22, les plateformes de visionnage visées pour le MVP sont Twitch, YouTube et Kick; l’extension prend en charge ces trois plateformes. Facebook ne fait pas partie de la cible de visionnage. Les preuves de validation restent soumises aux gates du projet. Dépendances techniques : PostgreSQL et Redis. Selon ADR-013, la revue juridique est différée par décision du propriétaire et ne conditionne pas le lancement initial du MVP; la conformité reste non validée et constitue un risque ouvert.

## Hors périmètre et hypothèses

Hors périmètre : retrait d'argent, points monétisables, identité Google,
Facebook ou Twitch, offres partenaires, programme d'affiliation streamer et
overlay de présence. Les plateformes de visionnage MVP restent Twitch,
YouTube et Kick, conformément à la décision du 22 octobre 2026; Facebook n'est
pas une plateforme de visionnage cible. Hypothèses : France au lancement, âge
cible de 18 ans comme hypothèse de périmètre non validée juridiquement, MVP
progressif et stack existante conservée.

## Contraintes et critères de réussite

Le budget, le calendrier, l'hébergement et l'équipe restent inconnus. Contraintes : extension Chrome initiale, plafond de visionnage de 8 heures, référence de 65 points par jour, sécurité des sessions, minimisation des données et examen humain des sanctions importantes. Terminé signifie règles documentées, tests reproductibles, preuves archivées et statut des risques explicite.

Conformément à ADR-013, la revue juridique est différée; la conformité n'est pas déclarée validée et reste un risque ouvert, sans dépendance de lancement du MVP. Le cahier MVP original conservé dans son archive garde son texte intact.
