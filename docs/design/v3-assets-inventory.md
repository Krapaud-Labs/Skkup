---
last_updated: 2026-10-18
owner: Mickael MUR
---

# DASH-V3 : inventaire design et assets

Ce document constitue le périmètre design/assets de la carte DASH-V3. Il
sépare les références visuelles de l'implémentation, afin que chaque élément
visible soit soit réutilisé depuis un asset validé, soit recréé de manière
traçable avant l'intégration frontend.

## Références inventoriées

| Groupe | Références | Éléments à contrôler |
| --- | --- | --- |
| Viewer principal | `dashboard-viewer-principal.png` | navigation latérale, cartes KPI, stream actif, extension, cartes à gratter, tirages, activité |
| Admin principal | `dashboard-admin-principal.png` | cockpit, KPI, tirages, lots, annonces, modération, audit |
| Viewer secondaires | `ecrans-secondaires-viewer.png`, `viewer-*-detaille.png` | streams, tirages, récompenses, historique, extension et états d'action |
| Admin secondaires | `ecrans-secondaires-admin.png`, `admin-*-detaille.png` | détail tirage, lots/stock, contenus, signalements, utilisateurs et audit |

## Matrice des assets

| Élément de la maquette | Décision V3 | Fichier cible |
| --- | --- | --- |
| Wordmark et éclair Skkup | Réutiliser les sources de marque validées | `branding/skkup-wordmark-transparent.png`, `branding/skkup-s-source.png` |
| Icônes de navigation viewer/admin | Réutiliser le jeu SVG existant, contrôler la taille et le contraste | `branding/icons/*.svg` |
| Points | Pièce PNG générée avec fond transparent | `branding/generated/skkup-icon-points.png` |
| Cadeaux, trophée, bouclier, œil | Réutiliser les SVG existants | `branding/icons/gift.svg`, `trophy.svg`, `shield.svg`, `eye.svg` |
| Flamme de série | Recréer en SVG, sans rasterisation | `branding/v3/flame.svg` |
| Ticket de tirage | Utiliser l’asset généré commun aux dashboards et aux tirages | `branding/generated/skkup-icon-ticket.png` |
| Carte à gratter | Garder le glyph fonctionnel compact jusqu'à un asset métier distinct; l'ancien PNG était un doublon du ticket S | aucun PNG métier dédié |
| Notification, analytics, modération, contenu, audit | Recréer en SVG cohérent avec le trait Skkup | `branding/v3/{bell,analytics,moderation,content,audit}.svg` |
| Logos de plateformes | Utiliser uniquement les assets de marque autorisés et leurs libellés accessibles; ne pas les redessiner arbitrairement | composant plateforme dédié, à valider avec le périmètre produit |
| Photos de streams, lots et avatars | Données de contenu, non des icônes; ne pas les remplacer par des placeholders en production | contrat média/API, avec fallback d'état vide/erreur |

## Tokens visuels à partager

Les composants V3 doivent consommer une seule source de tokens :

```text
surface.page       #07132d à #111d3d, sans noir pur
surface.card       #0d2044
surface.elevated   #122955
accent.primary     #8b3dff
accent.secondary   #16d9ff
accent.success     #19e6a0
accent.warning     #ffb84d
accent.danger      #ff4f8a
text.primary       #f5f3ff
text.secondary     #b8c3e8
border.subtle      rgba(132, 171, 255, .20)
radius.card        16px
radius.control     10px
shadow.glow        0 0 28px rgba(139, 61, 255, .28)
```

Le contraste, les états focus et les variantes mobile doivent être vérifiés
sur chaque composant, pas seulement sur la page d'accueil.

## Écarts et règles d'intégration

- Les captures sont des références de densité et de hiérarchie, pas des
  données en dur. Les nombres, noms et statuts doivent provenir des contrats
  backend acceptés.
- Aucun lien visible dans une maquette ne doit rester décoratif : il doit
  naviguer, déclencher une action ou afficher un état indisponible explicite.
- Les visuels de lot et de stream doivent prévoir chargement, absence de média,
  erreur et fallback accessible.
- Les icônes décoratives portent `aria-hidden`; les actions portent un nom
  accessible indépendant du dessin.
- Toute ancienne icône ou image remplacée doit être retirée de l'écran V3,
  sans mélange de navigation héritée et nouvelle navigation.
- Toute intégration d'un nouvel asset doit référencer ce document et ajouter
  un test visuel ou une preuve navigateur correspondante.

## État du périmètre

- Inventaire des 12 références : terminé.
- Assets SVG spécifiques V3 : créés et exposés par le registre `SkkupIcon`
  (`analytics`, `audit`, `content`, `moderation`, `scratchCard`, `ticket`,
  `flame`).
- Tokens partagés : spécifiés et exposés dans `globals.css` et `@theme` sous
  les préfixes `surface-*`, `accent-*`, `text-*`, `border-*`, `radius-*` et
  `shadow-*`.
- Validation pixel/parcours et contrôle des données réelles : à réaliser par
  les rôles frontend, backend et QA.
