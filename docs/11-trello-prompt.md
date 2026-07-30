# 11. Prompt Claude.ai pour organiser le Trello

Prompt prêt à copier-coller dans Claude.ai (avec le connecteur Trello actif)
pour créer et structurer le board du projet. Le board a déjà été créé une
première fois à partir de ce prompt : <https://trello.com/b/4GCnzk85/viewer-rewards>.
Ce fichier reste la référence si le board doit être recréé ou dupliqué.

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

- Vision produit et personas. Référence : docs/00-overview.md. Domaine :
  Concepteur / Doc.
- Spécifications fonctionnelles V1 (points quotidiens, watch time, tirages).
  Référence : docs/01-features.md. Domaine : Concepteur / Doc.
- Architecture technique et choix de stack (ADR). Référence :
  docs/02-architecture.md. Domaine : Concepteur / Doc.
- Modèle de données (users, comptes liés, sessions, points, tirages, lots).
  Référence : docs/03-data-model.md. Domaine : Backend.
- Contrat API (endpoints, OAuth). Référence : docs/04-api-contract.md.
  Domaine : Backend.
- Revue sécurité complète (fraude watch time, comptes multiples, abus API,
  intégrité du tirage). Référence : docs/05-security.md. Domaine : Sécurité.
- Design system gamer néon (palette, typographie, composants glow).
  Référence : docs/06-frontend-design-system.md. Domaine : Frontend.
- Pipeline CI (lint, typecheck, tests, build). Référence : docs/07-ci-cd.md.
  Domaine : Infra / CI.
- Topologie Docker et déploiement VPS. Référence : docs/08-docker-infra.md.
  Domaine : Infra / CI.
- Gitflow et règles de contribution. Référence :
  docs/09-gitflow-contributing.md. Domaine : Concepteur / Doc.
- Conformité jeu-concours et loterie (validation juriste). Référence :
  docs/10-legal-compliance.md. Domaine : Légal.
- Workflow inter-agents et suivi Trello. Référence :
  docs/12-agent-workflow.md. Domaine : Concepteur / Doc.
- Initialisation du projet frontend (Next.js + Tailwind). Domaine : Frontend.
- Initialisation du projet backend (NestJS + Prisma). Domaine : Backend.
- Intégration OAuth Twitch. Domaine : Backend.
- Intégration OAuth YouTube (Google). Domaine : Backend.
- Intégration OAuth Facebook. Domaine : Backend.
- Lecteur embarqué et heartbeats de visionnage (frontend). Domaine :
  Frontend.
- Validation serveur des heartbeats et anti-fraude. Domaines : Backend,
  Sécurité.
- Moteur de tirage au sort (job planifié, graine aléatoire). Domaine :
  Backend.
- Tableau de bord viewer (solde, historique, tickets). Domaine : Frontend.
- Mise en place du reverse proxy Traefik et TLS. Domaine : Infra / CI.
- Rédaction du règlement de jeu et validation juridique. Domaine : Légal.

Pour chaque carte, ajoute une checklist "Definition of Done" avec ces
éléments :
- Documentation à jour
- Revue de code approuvée
- CI verte
- Audit sécurité et tests unitaires validés par l'agent cybersécurité
  (obligatoire avant tout merge, quelle que soit la carte)

Une fois les cartes créées, laisse-les toutes dans la liste "Backlog" ; je
déplacerai moi-même les premières vers "À faire" selon les priorités.
```

## Notes d'utilisation

- Le connecteur Trello de Claude.ai doit être autorisé au préalable (accès
  au workspace/board cible).
- Ce prompt peut être adapté si de nouvelles fonctionnalités sont ajoutées
  par le client en cours de route : ajouter les cartes correspondantes avec
  le même format (nom, référence documentaire, label de domaine).
- Le workflow de mise à jour du board pendant le développement (déplacement
  des cartes, cases à cocher, gate sécurité avant merge) est décrit dans
  [12-agent-workflow.md](12-agent-workflow.md), pas dans ce prompt.
