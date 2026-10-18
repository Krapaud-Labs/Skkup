---
last_updated: 2026-10-18
owner: Mickael MUR
---

# DASH-V3 viewer : spécification de conception

Statut : `proposition design`, à relire par le spécialiste design fidelity
avant gel. Cette spécification ne modifie pas le produit et ne constitue pas
une validation de la Definition of Done.

Date : 4 octobre 2026

## 1. Principes directeurs

Le viewer est un espace privé orienté vers trois actions : regarder un stream
réel, comprendre la progression de son compte et utiliser les avantages
réellement disponibles. La hiérarchie doit rester lisible lorsque les données
sont absentes. Aucun compteur, média, nom de stream, lot ou statut ne doit être
fabriqué pour remplir une maquette.

Les écrans partagent une même coquille : navigation viewer, identité de session,
contenu principal et retour contextuel. La navigation est persistante sur
desktop, puis devient un en-tête compact avec menu accessible sur mobile. Les
actions principales sont toujours nommées par leur texte, l’icône restant un
renfort visuel.

Tokens de référence : surfaces `#07132d`, `#0d2044` et `#122955`, violet
`#8b3dff`, cyan `#16d9ff`, succès `#19e6a0`, avertissement `#ffb84d`, danger
`#ff4f8a`, texte principal `#f5f3ff`, texte secondaire `#b8c3e8`, rayon carte
16 px, rayon contrôle 10 px. Les tokens doivent provenir de la source partagée
et non être redéfinis route par route.

## 2. Structure partagée

### 2.1 Shell viewer

- `ViewerShell` : fond de page, grille, titre de document et zone de contenu.
- `NavigationDashboard` : liens `/dashboard`, `/dashboard/streams`,
  `/dashboard/recompenses`, `/dashboard/tirages`,
  `/dashboard/historique`, `/dashboard/extension`, règlement et compte.
- `ViewerIdentity` : pseudo et état de session provenant de `Profil` ; aucun
  environnement ou rôle fictif.
- `PageHeader` : titre, phrase d’orientation et action contextuelle éventuelle.
- `SectionCard` : surface, bordure, titre, aide et zone d’état.
- `MetricCard` : libellé, valeur contractuelle, comparaison ou progression
  seulement si le contrat la fournit.
- `StatusPanel` : loading, vide, erreur récupérable et succès explicites.
- `Pagination` : page, total et limites issus de `ReponsePaginee`.
- `PlatformBadge` : nom et asset de plateforme autorisé, avec texte accessible.
- `MediaFallback` : absence ou erreur de média, jamais une photo inventée.

### 2.2 États communs

Chaque zone asynchrone possède les cinq états suivants :

| État | Rendu attendu | Règle |
| --- | --- | --- |
| Chargement | squelette de même densité que le contenu final | ne pas afficher de zéros provisoires |
| Vide | illustration discrète, explication et CTA utile | expliquer la prochaine action réelle |
| Erreur | message compréhensible, code non exposé, bouton réessayer | préserver les données déjà chargées |
| Succès | données du contrat, dates localisées et unités explicites | ne pas déduire de métrique absente |
| Désactivé/interdit | contrôle désactivé ou message 401/403 contextualisé | ne jamais simuler une réussite |

Les transitions décoratives respectent `prefers-reduced-motion`; aucune
animation ne doit retarder l’accès au contenu ou masquer un changement d’état.

## 3. `/dashboard` : cockpit viewer

### Hiérarchie du cockpit viewer

1. En-tête : salutation avec `profil.pseudo`, résumé d’orientation et état de
   session.
2. Bandeau de progression : solde de points, série actuelle et meilleure série,
   avec `prochainPalierStreak` uniquement si le palier est calculable.
3. Colonne principale : stream mis en avant ou état catalogue vide, puis
   activité récente provenant du résumé dashboard.
4. Colonne secondaire : extension, cartes à gratter/récompenses et tirages,
   chacun avec son état réel et un lien fonctionnel vers la route détaillée.
5. Pied de zone : règles, aide et compte, sans redondance avec la navigation.

### Données et composants

- `GET /me/dashboard/summary` alimente profil, visionnage, activité et
  transactions récentes.
- `GET /streams` alimente le stream mis en avant ; sans résultat, afficher le
  CTA vers `/dashboard/streams`.
- `GET /me/rewards-summary` alimente la carte récompenses et ses compteurs.
- `GET /raffles` et les tickets authentifiés alimentent le bloc tirages.
- `DashboardHero`, `ProgressMetricGrid`, `FeaturedStreamCard`,
  `RewardSummaryCard`, `RaffleSummaryCard`, `RecentActivityList` sont les
  sous-composants proposés.

### Interactions

Le CTA stream ouvre le catalogue ou le lecteur associé à un stream réel. Les
liens récompenses, tirages, historique et extension naviguent vers leurs routes
respectives. Une carte sans données ne doit pas être cliquable comme si elle
contenait un avantage.

## 4. `/dashboard/streams` : catalogue de visionnage

### Hiérarchie du catalogue de streams

1. En-tête avec titre, explication du visionnage validé et recherche.
2. Barre de filtres : plateforme, partenaire éventuel et état de recherche.
3. Grille de cartes média : visuel réel ou `MediaFallback`, plateforme, nom,
   bonus contractuel et action de visionnage.
4. Zone d’aide extension : association requise expliquée sans prétendre qu’elle
   est active.
5. Pagination si le contrat l’introduit ; sinon le catalogue reste une liste
   bornée explicitement.

### Contrat et états

`GET /streams` retourne `Stream[]` avec plateforme, identifiant de chaîne, nom,
partenaire et bonus éventuel. L’ouverture d’une session utilise
`POST /watch-sessions`; les heartbeats sont envoyés toutes les 30 secondes et
la valeur créditée vient du serveur. Le filtre local ne doit pas transformer un
catalogue vide en faux résultat.

Composants : `StreamSearch`, `PlatformFilter`, `StreamCard`,
`WatchSessionStatus`, `StreamGridEmpty`.

## 5. `/dashboard/tirages` : tirages et tickets

### Hiérarchie des tirages

1. En-tête avec solde/tickets lorsqu’ils sont fournis par le contrat.
2. Filtres par statut : ouvert, clôturé, résultat publié.
3. Cartes tirage : titre, description, fenêtre temporelle, lots, valeur si
   connue, tickets distribués et statut.
4. Action participer pour un tirage ouvert, protégée contre le double clic.
5. Résultat publié et gagnants dans une zone distincte, uniquement via le
   résultat du tirage.

### Contrat et composants

`GET /raffles` fournit `Tirage[]`; `POST /me/raffles/:id/register` crée le
ticket et `GET /raffles/:id/result` lit un résultat publié. Les erreurs de
permission et les tirages clos sont expliqués inline. Proposer
`RaffleCard`, `RaffleStatusBadge`, `PrizeList`, `ParticipationButton`,
`RaffleResultPanel` et `RaffleEmptyState`.

## 6. `/dashboard/recompenses` : cartes et gains

### Hiérarchie des récompenses

1. En-tête avec solde de points et progression de série.
2. Onglets ou filtres `Toutes`, `Disponibles`, `Utilisées`, synchronisés avec
   `CarteAGratter.grattee`.
3. Grille de cartes : état, palier, date de création, gain réel après action et
   date d’utilisation.
4. Panneau de confirmation/résultat après grattage, jamais un gain anticipé.
5. Historique court via transactions, avec lien vers l’historique complet.

`GET /me/rewards-summary` et `GET /me/scratch-cards` sont les sources. Le
`POST /me/scratch-cards/:id/scratch` est idempotent côté interaction : le bouton
est désactivé pendant la requête et l’interface relit la carte renvoyée. Les
composants proposés sont `RewardFilterBar`, `ScratchCard`, `ScratchResult`,
`RewardBalance`, `RewardEmptyState`.

## 7. `/dashboard/historique` : transparence de l’activité

### Hiérarchie de l'historique

1. En-tête expliquant la différence entre points et sessions de visionnage.
2. Résumé : total de points et durée validée seulement si les contrats les
   exposent.
3. Deux vues clairement séparées : transactions points et sessions de
   visionnage.
4. Filtres date/type/plateforme lorsque les paramètres d’API les supportent.
5. Pagination, état vide et erreur par vue, sans mélanger les totaux.

La vue points utilise `GET /me/points/history?page&limit` et affiche
`libellesTypeTransaction`. La vue visionnage utilise les données de sessions
validées disponibles dans le contrat dashboard ou un endpoint dédié approuvé;
elle ne calcule jamais les secondes depuis le navigateur. Composants proposés :
`HistorySummary`, `PointsTransactionTable`, `WatchSessionTable`,
`HistoryFilters`, `HistoryPagination`.

## 8. `/dashboard/extension` : association maîtrisée

### Hiérarchie de l'extension

1. En-tête et explication des limites de sécurité : le jeton extension n’est
   jamais exposé à l’origine web.
2. Étapes d’installation et d’association, avec état courant.
3. `PairingCodePanel` : code à usage unique, expiration ISO localisée,
   régénération explicite et copie accessible.
4. `PairedDevicesList` : appareils, dates, statut actif/expiré/révoqué et
   révocation protégée.
5. Aide de dépannage et lien vers les règles de visionnage.

Sources : `POST /extension/pairing-token`, `GET /extension/pairings` et
`DELETE /extension/pairings/:id`. Après chaque mutation, l’état doit provenir
de la réponse serveur ou d’une nouvelle lecture. Les composants proposés sont
`ExtensionSteps`, `PairingCodePanel`, `PairingExpiry`, `PairedDeviceRow`,
`RevokeDeviceDialog`, `ExtensionErrorState`.

## 9. Responsive et accessibilité

### 320 px

- une seule colonne, navigation repliée, cartes empilées ;
- aucun tableau ne déborde : passer en lignes de description ou défilement
  local annoncé ;
- les actions principales restent visibles sans zoom ;
- le code d’association et les boutons ont une cible tactile d’au moins 44 px.

### 768 px

- grille de deux colonnes lorsque la largeur le permet ;
- navigation compacte persistante ou tiroir contrôlable au clavier ;
- filtres regroupés sans couper les libellés ;
- les listes denses conservent une hiérarchie ligne/titre/statut.

### 1280 px

- rail viewer stable, contenu contraint et grille multi-colonnes ;
- cockpit dashboard en zones principales/secondaires, sans espace décoratif
  vide dominant ;
- densité des maquettes respectée par des cartes alignées et des sections
  explicitement nommées.

Tous les contrôles ont un nom accessible, un focus visible, un ordre clavier
cohérent et une annonce d’erreur. Les icônes décoratives sont `aria-hidden`.
Les couleurs ne sont jamais l’unique moyen d’indiquer un statut.

## 10. Registre des assets viewer

| Usage | Asset prévu | Règle |
| --- | --- | --- |
| Navigation | `branding/icons/overview.svg`, `streams.svg`, `draws.svg`, `gift.svg`, `points.svg`, `extension.svg` | même taille optique et état actif violet/cyan |
| Progression | `branding/v3/flame.svg`, `points.svg`, `trophy.svg` | décoratif accompagné d’un libellé |
| Récompenses | `branding/generated/skkup-icon-scratch-card.png`, `gift.svg` | ne pas représenter un gain avant réponse serveur |
| Tirages | `branding/generated/skkup-icon-ticket.png`, `trophy.svg` | statut texte obligatoire |
| Extension | `branding/icons/extension.svg`, `branding/v3/devices.svg` si validé | aucune exposition de jeton |
| Plateformes | assets de marque autorisés | fallback texte accessible, pas de logo redessiné |
| Streams et lots | média du contrat | placeholder uniquement comme état absence/erreur |

Tout nouvel asset doit être ajouté à `docs/design/v3-assets-inventory.md`,
recevoir une variante sombre/contraste si nécessaire et être vérifié sur les
trois breakpoints.

## 11. Critères de relecture design

Le spécialiste design fidelity doit confirmer, pour chaque route :

- la hiérarchie correspond à la maquette détaillée et à la planche principale ;
- chaque lien ou bouton a une destination ou une mutation réelle ;
- chaque zone possède une source contractuelle et les cinq états communs ;
- les assets utilisés sont ceux du registre, sans ancienne navigation mélangée ;
- les versions 320, 768 et 1280 px n’introduisent ni overflow ni perte d’action ;
- les intitulés, contrastes, focus et annonces restent compréhensibles ;
- aucune donnée fictive n’est utilisée pour faire ressembler l’écran à la
  maquette.

Cette relecture constitue une entrée du gel design. Elle ne remplace ni les
tests de contrats, ni la recette navigateur, ni la validation indépendante de
la Definition of Done.
