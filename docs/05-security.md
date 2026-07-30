# 05. Sécurité

Ce document liste les menaces identifiées et les mitigations attendues. Il doit être complété et validé par l'agent cybersécurité avant toute implémentation des zones concernées.

## Menaces principales

### 1. Fraude au watch time

**Scénario** : un utilisateur automatise l'envoi de heartbeats (script, extension navigateur) sans réellement regarder le stream, pour accumuler des points et des tickets de tirage.

**Mitigations attendues** :

- Heartbeats signés côté client avec un secret de session à courte durée de vie, non réutilisable.
- Vérification de cohérence temporelle stricte côté serveur (un heartbeat ne peut avancer le compteur que d'un intervalle plausible).
- Corrélation avec l'état réel du lecteur (événements play/pause remontés, pas seulement un minuteur côté client).
- Plafond quotidien de points par utilisateur, quel que soit le nombre de sessions ouvertes.
- Détection de patterns anormaux (heartbeats parfaitement réguliers sur de longues durées, plusieurs comptes partageant les mêmes empreintes d'appareil/IP).

### 2. Comptes multiples

**Scénario** : un même utilisateur crée plusieurs comptes pour multiplier ses tickets de tirage.

**Mitigations attendues** :

- Vérification d'unicité sur les comptes de plateformes liés (un compte Twitch/Google/Facebook ne peut être lié qu'à un seul compte site).
- Empreinte d'appareil et suivi d'IP à des fins anti-fraude uniquement (à documenter dans la politique de confidentialité, conformité RGPD).
- Limitation du nombre de tickets par utilisateur et par tirage si nécessaire.

### 3. Abus des endpoints API

**Mitigations attendues** :

- Rate limiting par utilisateur et par IP sur les endpoints sensibles (`/watch-sessions/:id/heartbeat`, `/raffles/:id/tickets`, `/auth/oauth/*`).
- Validation stricte des entrées (DTOs avec règles de validation NestJS) sur tous les endpoints.
- Journalisation et alerte sur les tentatives répétées d'accès non autorisé aux routes `/admin/*`.

### 4. Sécurité des tokens OAuth tiers

**Mitigations attendues** :

- Chiffrement au repos des tokens OAuth Twitch/Google/Facebook stockés en base.
- Rotation et révocation des tokens en cas de déconnexion ou de suppression de compte.
- Scope OAuth minimal demandé à chaque plateforme (principe du moindre privilège).

### 5. Intégrité du tirage au sort

**Scénario** : contestation d'un tirage jugé non équitable.

**Mitigations attendues** :

- Algorithme de tirage déterministe à partir d'une graine aléatoire générée et journalisée avant le tirage.
- Résultat et graine consultables publiquement après tirage pour permettre un audit indépendant.
- Séparation des rôles : aucun compte administrateur ne doit pouvoir modifier un tirage après clôture des participations.

## Conformité

- RGPD : minimisation des données collectées (empreintes d'appareil, IP) et information claire dans la politique de confidentialité.
- Voir [10-legal-compliance.md](10-legal-compliance.md) pour le cadre juridique du jeu-concours et le lien avec les exigences anti-fraude renforcées.

## Process de merge obligatoire

Avant tout merge d'une pull request sur `dev` ou `main`, quelle que soit la
zone touchée, l'agent cybersécurité doit réaliser les deux vérifications
suivantes et les valider explicitement sur la carte Trello associée :

1. **Audit de sécurité** portant sur le changement proposé :
   - recherche de vulnérabilités OWASP pertinentes pour le code modifié
     (injection, contrôle d'accès, gestion des secrets, désérialisation,
     dépendances vulnérables) ;
   - vérification que les mitigations listées plus haut dans ce document
     (anti-fraude watch time, comptes multiples, rate limiting, intégrité
     du tirage) ne sont pas affaiblies par le changement ;
   - vérification qu'aucun secret (clé API, token, mot de passe) n'est
     introduit en clair dans le code ou la configuration versionnée.
2. **Tests unitaires** : exécution de la suite de tests unitaires du
   périmètre modifié et confirmation qu'elle passe intégralement, en plus
   du passage de la CI (voir [07-ci-cd.md](07-ci-cd.md)). L'agent
   cybersécurité vérifie aussi que les nouveaux comportements sensibles
   (validation de heartbeat, calcul de points, création de ticket, tirage)
   sont couverts par au moins un test, pas seulement que la suite existante
   passe.

Si l'un des deux points échoue, la pull request n'est pas approuvée et le
merge n'a pas lieu, indépendamment du résultat de la CI automatisée : ce
contrôle est un gate humain (agent) en plus du gate automatisé.

## À faire par l'agent cybersécurité avant implémentation

- Revue de ce document et complément des menaces spécifiques identifiées.
- Définition précise des règles de rate limiting (seuils, fenêtres de temps).
- Choix des outils de détection anti-fraude (règles maison ou service tiers).
