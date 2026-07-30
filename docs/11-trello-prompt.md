# 11. Prompt Claude.ai pour organiser le Trello

Prompt prêt à copier-coller dans Claude.ai (avec le connecteur Trello actif)
pour créer et structurer le board du projet.

```text
Crée un board Trello nommé "Viewer Rewards" pour un projet de site
communautaire qui récompense les viewers de streams (Twitch, YouTube,
Facebook Live) par des points convertis en tickets de tirage au sort de
lots réels, avec un thème visuel gamer néon.

Crée ces listes, dans cet ordre :
1. Backlog
2. À faire
3. En cours
4. Revue
5. Terminé

Crée ces labels de domaine :
- Concepteur / Doc (violet)
- Frontend (rose)
- Backend (bleu)
- Sécurité (rouge)
- Infra / CI (jaune)
- Légal (orange)

Crée ces labels de branche gitflow :
- feature (vert)
- fix (orange clair)
- release (bleu foncé)
- hotfix (rouge foncé)

Ajoute une carte dans "Backlog" pour chacun des éléments suivants, avec en
description le chemin du document de référence dans le dépôt et le label de
domaine correspondant :

- Vision produit et personas — docs/00-overview.md — Concepteur / Doc
- Spécifications fonctionnelles V1 (points quotidiens, watch time, tirages)
  — docs/01-features.md — Concepteur / Doc
- Architecture technique et choix de stack (ADR) — docs/02-architecture.md
  — Concepteur / Doc
- Modèle de données (users, comptes liés, sessions, points, tirages, lots)
  — docs/03-data-model.md — Backend
- Contrat API (endpoints, OAuth) — docs/04-api-contract.md — Backend
- Revue sécurité complète (fraude watch time, comptes multiples, abus API,
  intégrité du tirage) — docs/05-security.md — Sécurité
- Design system gamer néon (palette, typographie, composants glow)
  — docs/06-frontend-design-system.md — Frontend
- Pipeline CI (lint, typecheck, tests, build) — docs/07-ci-cd.md — Infra / CI
- Topologie Docker et déploiement VPS — docs/08-docker-infra.md — Infra / CI
- Gitflow et règles de contribution — docs/09-gitflow-contributing.md
  — Concepteur / Doc
- Conformité jeu-concours et loterie (validation juriste) —
  docs/10-legal-compliance.md — Légal
- Initialisation du projet frontend (Next.js + Tailwind) — Frontend
- Initialisation du projet backend (NestJS + Prisma) — Backend
- Intégration OAuth Twitch — Backend
- Intégration OAuth YouTube (Google) — Backend
- Intégration OAuth Facebook — Backend
- Lecteur embarqué et heartbeats de visionnage (frontend) — Frontend
- Validation serveur des heartbeats et anti-fraude — Backend, Sécurité
- Moteur de tirage au sort (job planifié, graine aléatoire) — Backend
- Tableau de bord viewer (solde, historique, tickets) — Frontend
- Mise en place du reverse proxy Traefik et TLS — Infra / CI
- Rédaction du règlement de jeu et validation juridique — Légal

Pour chaque carte, ajoute une checklist "Definition of Done" avec ces
éléments :
- Documentation à jour
- Revue de code approuvée
- CI verte
- Revue sécurité si zone sensible (auth, points, tirages, admin)

Une fois les cartes créées, laisse-les toutes dans la liste "Backlog" ; je
déplacerai moi-même les premières vers "À faire" selon les priorités.
```

## Notes d'utilisation

- Le connecteur Trello de Claude.ai doit être autorisé au préalable (accès
  au workspace/board cible).
- Ce prompt peut être adapté si de nouvelles fonctionnalités sont ajoutées
  par le client en cours de route : ajouter les cartes correspondantes avec
  le même format (nom, référence documentaire, label de domaine).
