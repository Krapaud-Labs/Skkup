# 02. Architecture technique

## Vue d'ensemble

```text
                       ┌──────────────────────┐
                       │   Reverse proxy       │
                       │  Traefik (TLS auto)   │
                       └──────────┬───────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
      ┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
      │   Frontend     │   │   Backend API  │   │   Worker      │
      │  Next.js (SSR) │   │   NestJS       │   │  BullMQ jobs  │
      └───────┬───────┘   └───────┬───────┘   └───────┬───────┘
              │                   │                   │
              └───────────┬───────┴───────────┬───────┘
                          │                   │
                  ┌───────▼───────┐   ┌───────▼───────┐
                  │  PostgreSQL   │   │     Redis     │
                  └───────────────┘   └───────────────┘
```

## Choix de stack (ADR-001)

| Composant | Choix | Justification |
| --- | --- | --- |
| Frontend | Next.js (React + TypeScript) + TailwindCSS | SSR pour le référencement des pages publiques (tirages, lots), écosystème riche pour un design system custom, TypeScript partagé avec le backend. |
| Backend | NestJS (Node.js + TypeScript) | Structure modulaire, guards/interceptors natifs adaptés aux besoins de l'agent cybersécurité (rate limiting, validation), même langage que le frontend pour limiter le contexte switch entre agents. |
| Base de données | PostgreSQL + Prisma ORM | Transactions fiables nécessaires pour la comptabilité des points et des tickets, migrations versionnées avec Prisma. |
| Cache et files d'attente | Redis + BullMQ | Rate limiting, sessions, et jobs asynchrones (agrégation de watch time, tirage au sort, notifications). |
| Authentification | OAuth2 (Twitch, Google pour YouTube, Facebook) + JWT de session | Permet la liaison de comptes tiers et une session propre au site, sans dépendre d'un fournisseur unique. |
| Infra | Docker Compose, reverse proxy Traefik avec TLS Let's Encrypt | Portable sur un VPS auto-géré, pas de dépendance à un cloud managé. |
| CI | GitHub Actions | Lint, typecheck, tests, build des images Docker, obligatoire avant merge sur dev et main. |

### Alternatives considérées

- Django/Python au lieu de NestJS : écarté pour garder un langage unique (TypeScript) entre front et back, ce qui simplifie la coordination entre les agents frontend et backend.
- MongoDB au lieu de PostgreSQL : écarté car la comptabilité de points/tickets bénéficie fortement des transactions ACID et de contraintes relationnelles strictes.
- Cloud managé (AWS/GCP) : écarté à ce stade suite au choix du client (VPS auto-géré), mais l'architecture Docker Compose reste portable vers un cloud managé si besoin en V2.

## Mesure du watch time (décision d'architecture critique)

Aucune plateforme (Twitch, YouTube, Facebook) n'expose d'API publique donnant le temps de visionnage d'un utilisateur précis sur un stream. Le mécanisme retenu :

1. Le viewer regarde le stream via un lecteur officiel embarqué directement sur une page du site (Twitch embed, YouTube IFrame Player API, Facebook Video Plugin).
2. Le frontend écoute les événements du lecteur (lecture, pause, progression) et envoie un heartbeat signé au backend toutes les 30 à 60 secondes, uniquement si l'onglet est visible et actif (Page Visibility API).
3. Le backend valide chaque heartbeat (continuité temporelle, absence de rejeu, cohérence avec la session utilisateur) avant de créditer les points, via un job Redis/BullMQ qui agrège les heartbeats en session de visionnage.
4. Aucune donnée n'est présentée comme un « watch time officiel Twitch/YouTube » : il s'agit du temps passé sur la page du site, ce qui évite tout conflit avec les conditions d'utilisation des plateformes concernant la manipulation de métriques d'engagement.

Fonctionnalités écartées de la V1 pour cette raison :

- Twitch Extensions (nécessite l'installation par le streamer partenaire, mesure une présence approximative, pas un vrai temps de visionnage).
- Twitch Drops (réservé aux organisateurs approuvés par Twitch, processus de partenariat non accessible à un site tiers indépendant).

## Modèle de tirage au sort

Un job planifié (BullMQ) exécute le tirage à date fixe : sélection aléatoire parmi les tickets valides, avec graine aléatoire journalisée pour permettre un audit a posteriori. Le résultat est stocké de façon immuable (table d'historique des tirages) et publié sur le site.

## Documents liés

- [03-data-model.md](03-data-model.md) : détail des entités (utilisateurs, comptes liés, sessions de visionnage, points, tickets, tirages, lots)
- [04-api-contract.md](04-api-contract.md) : endpoints et contrats OAuth
- [05-security.md](05-security.md) : menaces et mitigations
- [08-docker-infra.md](08-docker-infra.md) : topologie Docker détaillée
