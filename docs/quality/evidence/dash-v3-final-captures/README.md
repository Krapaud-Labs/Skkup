---
last_updated: 2026-10-18
owner: Mickael MUR
---

# Preuves visuelles DASH-V3

Ce corpus regroupe les captures responsive persistantes des dashboards viewer et
admin. La campagne consolidée couvre les largeurs 320, 768 et 1280 px ainsi que
le paysage et le zoom 200 %.

Le contrôle ciblé de `/admin/moderation` a été rejoué après la correction des
cibles tactiles des filtres. Résultat: 4/4 scénarios Playwright réussis.

Les écarts de fidélité visuelle liés aux champs absents des contrats API restent
documentés dans les audits spécialisés et ne sont pas masqués par des données
inventées.

## Règle de campagne

Les contrôles visuels, QA et d'audit sont regroupés dans une seule campagne
consolidée par HEAD. Chaque spécialiste relit le même corpus, réutilise les
preuves déjà vertes et ne rejoue un test que si le code, l'environnement ou la
preuve a changé. Le rapport de campagne conserve le verdict, les limites et la
prochaine action afin d'éviter les micro-audits redondants.

La campagne active confirme aussi l'état Docker local: backend, frontend,
PostgreSQL, Redis, worker et proxy sont healthy. Cet état ne remplace pas les
preuves encore ouvertes de pairing Web Store, rollback et restauration distante.
