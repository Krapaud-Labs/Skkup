# Dashboards premium 2.0

## Statut

`draft`, cadrage UX/UI de UX-002. Aucun composant produit n'est modifié par ce document.

## Audit de l'existant

Le rapport indépendant [90-audit-dashboards-ux.md](../audits/90-audit-dashboards-ux.md) constitue la preuve de référence pour l'existant viewer/admin. Il confirme les problèmes de hiérarchie, surfaces vides, densité admin et états sans action; il alimente la cible 2.0 mais ne vaut pas relecture de cette nouvelle cible.

| Zone | Entrée actuelle | Limite constatée | Décision 2.0 |
| --- | --- | --- | --- |
| Viewer | `DashboardSas`, `NavigationDashboard`, `TableauDeBord` | shell et navigation partagés à simplifier; trop de responsabilités concentrées dans le dashboard | shell applicatif avec navigation contextuelle, résumé prioritaire et modules indépendants |
| Compte | `MenuCompteDashboard` | actions de compte mélangées à la navigation | menu compte secondaire, accessible depuis le shell, sans prendre la place de la navigation principale |
| Admin | `AdminSas`, `NavigationAdmin`, `frontend/src/app/admin/page.tsx` | back-office dense et multi-domaines | cockpit admin avec vue d'ensemble, tâches urgentes et sections séparées |
| Mobile | tests Playwright responsive | absence de preuve sur une navigation 2.0 dédiée | navigation compacte persistante, actions principales toujours accessibles |
| États | composants et tests unitaires dispersés | états non décrits dans une architecture commune | contrat d'état partagé pour loading, vide, erreur, succès, permissions et reprise |

## Nouvelle architecture de l'information

### Viewer

1. `Vue d'ensemble` : solde, streak, progression du jour, prochaine action.
2. `Gagner des points` : streams, session active, plafond et feedback en temps réel.
3. `Récompenses` : cartes, tickets, tirages et historique utile.
4. `Règles et aide` : règlement, FAQ, sécurité et support.
5. `Compte` : profil, mot de passe, appareils, langue et déconnexion.

### Admin

1. `Cockpit` : santé du service, alertes, tâches et activité récente.
2. `Utilisateurs et fraude` : signaux, décisions, révocations et audit.
3. `Tirages` : prochains tirages, participants, lots, exécution et résultats.
4. `Contenu` : landing, FAQ, règlement, annonces et versions.
5. `Catalogue` : streams, sponsors et médias.
6. `Paramètres` : accès, sécurité, intégrations et exploitation.

## Principes premium

- Hiérarchie visuelle nette : une action principale par écran, informations secondaires regroupées.
- Densité maîtrisée : respiration, alignements et regroupement par tâche plutôt qu'une accumulation de cartes.
- Identité Skkup : surfaces profondes, accent violet contrôlé, contrastes lisibles et profondeur discrète.
- Feedback explicite : chaque action affiche son état, sa conséquence et une reprise possible.
- Pas de décoration qui concurrence les données, les actions ou les messages d'erreur.
- Même vocabulaire et mêmes composants pour viewer et admin, avec des niveaux de permission distincts.

## Système visuel et composants 2.0

### Tokens de référence

| Famille | Règle premium | Usage |
| --- | --- | --- |
| Surface | fond profond, surface élevée et surface interactive; une seule élévation dominante par zone | shell, sections et panneaux |
| Accent | violet Skkup réservé aux actions, progression et focus; rouge uniquement aux erreurs | CTA, progression, alertes |
| Texte | contraste fort pour le contenu, contraste moyen pour le contexte, jamais le contraste faible pour une action | titres, données, aides |
| Rayon | grand rayon pour les panneaux, moyen pour les contrôles, petit pour les badges | cartes, boutons, statuts |
| Espacement | grille régulière et rythme constant; aucune carte ne doit être isolée sans relation | layout et densité |
| Motion | transitions courtes et non nécessaires à la compréhension; réduction effective avec `prefers-reduced-motion` | feedback et navigation |

### Valeurs de première référence

| Token | Valeur | Usage |
| --- | --- | --- |
| `surface.canvas` | `#100D2B` | fond général |
| `surface.panel` | `#191344` | panneau principal |
| `surface.elevated` | `#24195A` | zone élevée unique |
| `accent.primary` | `#B84DFF` | CTA, progression et focus |
| `accent.secondary` | `#6E5BFF` | liens et action secondaire |
| `text.strong` | `#F8F7FF` | titres et données |
| `text.muted` | `#C8C4E6` | contexte et aide |
| `status.error` | `#FF6B7A` | erreur avec icône et texte |
| `space.1` à `space.6` | `4, 8, 12, 16, 24, 32px` | rythme de grille |
| `radius.control / panel` | `12px / 24px` | contrôles / panneaux |
| `motion.fast / standard` | `120ms / 200ms ease-out` | feedback; supprimé avec reduced motion |

Mesure de contraste relative effectuée sur ces couples de tokens : `text.strong / surface.canvas` **17,71:1**, `text.muted / surface.canvas` **11,21:1**, `accent.primary / surface.canvas` **4,97:1**, `text.strong / surface.panel` **16,21:1** et `text.muted / surface.panel` **10,26:1**. Ces mesures couvrent la baseline des tokens; les composants, le focus, les états d'erreur et les variantes désactivées doivent encore être contrôlés avant validation AA.

### Composants

- `DashboardShell` : navigation contextuelle, titre, zone d'action et contenu; aucune barre globale héritée.
- `MetricCluster` : 2 à 4 indicateurs liés, avec valeur, évolution, contexte et état de chargement.
- `PrimaryAction` : une action dominante par écran, libellé verbal et état désactivé explicite.
- `TaskCard` : tâche ou prochaine action, priorité, état, échéance éventuelle et raccourci.
- `DataPanel` : tableau ou liste avec filtres, pagination, état vide et erreur cohérents.
- `StatusBanner` : succès, information, warning ou erreur avec rôle accessible et action de reprise.
- `ContextNav` : navigation viewer/admin adaptée au breakpoint, active visible et clavier complet.
- `ConfirmDialog` : confirmation des actions à impact, justification et annulation toujours disponibles.

Chaque composant doit proposer une variante loading, vide, erreur, disabled et focus. Les variantes admin ne doivent pas exposer une donnée ou une action hors permission.

## Contrat des écrans

Chaque écran doit définir : titre et contexte, action principale, navigation locale éventuelle, état loading, état vide, erreur récupérable, erreur bloquante, succès, permission insuffisante, contenu responsive et ordre clavier.

## Contenu et actions prioritaires

| Écran | Information immédiatement visible | Action principale | Actions secondaires |
| --- | --- | --- | --- |
| Viewer - Vue d'ensemble | points du jour, streak, progression vers le plafond, prochaine récompense | `Commencer à gagner des points` | historique, règles, compte |
| Viewer - Gagner des points | stream choisi, session active, points validés, plafond | `Démarrer / reprendre la session` | changer de stream, fermer, aide |
| Viewer - Récompenses | cartes, tickets, prochains tirages et résultats | `Ouvrir la récompense disponible` | historique, règles du tirage |
| Admin - Cockpit | alertes, tâches en attente, santé et activité | `Traiter la tâche prioritaire` | filtrer, audit, paramètres |
| Admin - Fraude | signaux ouverts, niveau, contexte et activité | `Examiner le signal` | ignorer, suspendre selon permission, historique |
| Admin - Tirages | prochains tirages, statut, tickets, lots | `Ouvrir ou exécuter le tirage` | modifier, participants, audit |

Règle de contenu : un écran ne doit pas présenter plusieurs appels visuels concurrents. Les actions à impact utilisateur affichent une confirmation, une justification et une possibilité de reprise ou de réexamen.

## États d'interface 2.0

| État | Contenu obligatoire | Comportement |
| --- | --- | --- |
| Loading | squelette ou zone contextualisée | conserver la structure et l'action principale |
| Vide | explication, raison et prochaine action | ne jamais afficher une carte vide sans contexte |
| Erreur récupérable | message compréhensible et retry | conserver les données confirmées et limiter les retries |
| Erreur bloquante | impact et étape suivante | empêcher l'action incohérente et préserver l'audit |
| Succès | résultat, conséquence et prochaine action | message accessible `role=status` ou équivalent |
| Permission insuffisante | refus expliqué sans fuite de données | retour vers une zone autorisée |
| Session expirée | reconnexion claire, état sûr conservé | aucun crédit ni écriture protégée sans session |
| Responsive compact | priorité aux données et à l'action principale | navigation condensée, tableaux transformés sans perte |

## Matrice écrans et variantes

| Espace | Écran | Loading | Vide | Erreur / permission | Action dominante |
| --- | --- | --- | --- | --- | --- |
| Viewer | Vue d'ensemble | squelette des métriques | expliquer le démarrage | retry ou reconnexion | Commencer à gagner des points |
| Viewer | Gagner des points | stream et session en squelette | expliquer l'absence de stream | reprise de session ou aide | Démarrer / reprendre la session |
| Viewer | Récompenses | cartes placeholders | expliquer le prochain gain | retry / règles | Ouvrir la récompense disponible |
| Viewer | Règles et aide | sections placeholders | proposer support | retry de contenu | Consulter le règlement |
| Viewer | Compte | profil placeholder | proposer compléter le profil | reconnexion | Gérer le compte |
| Admin | Cockpit | métriques et tâches skeleton | expliquer absence d'activité | retry / accès | Traiter la tâche prioritaire |
| Admin | Utilisateurs et fraude | lignes skeleton | aucun signal expliqué | permission ou retry | Examiner le signal |
| Admin | Tirages | tirages skeleton | prochain tirage expliqué | permission ou retry | Ouvrir / exécuter le tirage |
| Admin | Contenu | pages skeleton | aucune page expliquée | permission ou retry | Ouvrir le contenu |
| Admin | Catalogue | streams skeleton | aucun stream expliqué | permission ou retry | Ajouter un stream |
| Admin | Paramètres | sections skeleton | configuration initiale | permission ou retry | Ouvrir les paramètres |

Chaque ligne doit être représentée dans la maquette de référence desktop et mobile; les états d'erreur et de permission ne doivent jamais exposer de données non autorisées.

## Responsive et accessibilité à valider

| Dimension | Règle de conception | Preuve attendue avant implémentation |
| --- | --- | --- |
| Breakpoints | desktop conserve la navigation contextuelle; tablette réduit les panneaux; mobile empile le contenu et garde l'action principale visible | capture ou maquette des trois largeurs |
| Navigation clavier | ordre de tabulation suit le parcours visuel; focus toujours visible; aucun piège dans les dialogues | test clavier Playwright sur chaque shell |
| Lecteur d'écran | titres hiérarchisés, landmarks, nom accessible pour chaque action, annonces d'état non redondantes | audit automatisé complété par parcours manuel |
| Contraste | texte, contrôles, focus et états d'erreur respectent le niveau AA; la couleur ne porte jamais seule l'information | mesure des tokens finaux et rapport d'audit |
| Mouvement | animation non indispensable; `prefers-reduced-motion: reduce` supprime transitions et effets non essentiels | test avec préférence réduite activée |
| Tableaux et listes | sur mobile, chaque ligne conserve son contexte et ses actions; les données ne sont pas tronquées silencieusement | maquette mobile et test de contenu long |

À ce stade, ces règles sont des critères de conception et non une validation d'implémentation. Les cases Trello correspondantes restent ouvertes jusqu'à production des maquettes et exécution des contrôles.

## Preuve de baseline existante

Le contrôle Playwright existant `frontend/e2e/responsive-accessibility.spec.ts` a été exécuté le 3 octobre 2026 sur les projets `desktop` et `mobile` : **12 tests réussis**. Il couvre l'absence de débordement horizontal, la présence d'un contenu principal, les alternatives textuelles publiques et la navigation clavier des routes actuelles `/dashboard` et `/admin`. La suite Vitest frontend a également réussi : **25 fichiers et 93 tests**; `npm run lint` réussit également.

Une inspection visuelle en lecture seule de `https://skkup.fr/dashboard` le 3 octobre 2026 confirme l'état actuellement déployé depuis `dev` : header global persistant avec menu de compte, hero occupant la première zone, trois métriques sans action principale, cartes « Série de visites », « Annonces » et « Loterie en cours », puis plusieurs états vides pour récompenses, historique et tickets. Cette observation confirme le besoin de `DashboardShell`, d'une prochaine action explicite et d'états vides contextualisés dans UX-002; elle ne constitue pas une validation de la branche `feature/ux-002-dashboard-premium-2.0`, qui n'est pas encore fusionnée dans `dev`.

La route admin déployée depuis `dev` a également été inspectée en lecture seule : le hero expose cinq cartes de navigation, les filtres de pilotage occupent une zone autonome, puis une longue page enchaîne sponsors, signalements, contenus éditoriaux, annonces, tirages et configuration des streams. Cette structure confirme la nécessité du cockpit admin et de sections séparées définis plus haut; elle ne constitue pas une validation de l'implémentation UX-002.

Cette preuve établit une baseline de non-régression pour l'existant. Elle ne valide pas encore les composants, tokens, états ni la navigation de la cible UX-002; les contrôles devront être rejoués après implémentation de la refonte.

Le test ciblé `frontend/e2e/dashboard-ux-002-prototype.spec.ts` a réussi **12/12** sur les projets desktop et mobile. Il vérifie les largeurs 320, 768 et 1280 px, l'absence de débordement, les écrans secondaires, les états accessibles, le focus clavier, les tokens de contraste et `prefers-reduced-motion` sur la maquette HTML. Il valide le prototype de conception, pas encore les composants Next.js de production.

## Décisions à produire avant implémentation

- maquette ou capture de référence pour viewer et admin;
- inventaire final des composants 2.0 et tokens;
- règles de navigation desktop/mobile;
- contenus et libellés définitifs;
- comportement des notifications et temps réel;
- validation contraste et `prefers-reduced-motion`;
- plan de migration des tests existants.

## Plan de migration frontend

| Étape | Cible | Source actuelle | Preuve de sortie |
| --- | --- | --- | --- |
| 1 | extraire `DashboardShell` et `ContextNav` | `NavigationDashboard`, `NavigationAdmin`, `MenuCompteDashboard` | rendu viewer/admin sans header global et navigation clavier |
| 2 | composer les blocs de synthèse | `TableauDeBord`, cartes de statistiques et progression | une action principale et des métriques regroupées par tâche |
| 3 | normaliser les panneaux et états | listes, historiques, tirages et composants d'erreur existants | matrice loading/vide/erreur/succès appliquée à chaque écran |
| 4 | migrer les écrans viewer | `frontend/src/app/dashboard` | parcours viewer complet, responsive et tests ciblés |
| 5 | migrer le cockpit admin | `frontend/src/app/admin` et navigation admin | permissions conservées, actions sensibles confirmées et auditées |
| 6 | rejouer et compléter les tests | `frontend/e2e/responsive-accessibility.spec.ts` et tests composants | tests de non-régression et scénarios UX-002 sur desktop/mobile |

Chaque étape doit rester réversible et conserver les contrats métier existants. Aucun endpoint, calcul de points ou contrôle de permission ne doit être modifié par la refonte visuelle.

---
last_updated: 2026-10-03
---
