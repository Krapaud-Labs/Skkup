---
agent_role: frontend
agent_id: /root/frontend_audit
status: rework
scope: Inventaire frontend statique des pictogrammes et illustrations concernés par la proposition blanc/rose/violet, sans cyan et sans superposition du S; aucun changement produit ni rendu navigateur.
evidence: HEAD 3c856b062782092091c9f03b8505ba79193b61ae; registre `frontend/src/components/ui/SkkupIcon.tsx`; appels composants; routes App Router; CSS viewer/admin; brief UI-ICON-001 et revue de style indépendante.
next_action: Présenter cet inventaire à la conception et au propriétaire pour fixer les noms, variations contextuelles et tailles du nouveau pack avant toute génération ou intégration; ne pas traiter l'ancienne direction cyan/S-overlay comme la cible actuelle.
---

# Inventaire frontend pour la nouvelle proposition d'icônes

## Portée

Audit source en lecture seule au checkout `test/ui-icon-001`, HEAD `3c856b062782092091c9f03b8505ba79193b61ae`. Le livrable localise les pictogrammes et leurs contextes afin de préparer une proposition avec uniquement blanc, rose et violet, sans cyan/bleu et sans S superposé. Il n'affirme pas que cette proposition est approuvée ni qu'elle doit être intégrée. Aucun test, média ou rendu navigateur n'a été consulté dans cette revue.

Les composants `SkkupIcon` rendent actuellement les images avec `alt=""`, `aria-hidden`, `object-fit: contain` et les dimensions passées en props. Les tailles ci-dessous sont les valeurs source; les règles CSS finales peuvent les remplacer. Les fonds sont les styles déclarés dans le code, non des couleurs calculées par navigateur.

## Registre courant des images

Source canonique : `frontend/src/components/ui/SkkupIcon.tsx:9-90`; source média : `asset/icons/ui/`.

| Nom `SkkupIcon` | PNG source | Nom fonctionnel / observations |
|---|---|---|
| `analytics` | `asset/icons/ui/analytics.png` | vue d'ensemble, statistiques |
| `streams` | `asset/icons/ui/streams.png` | flux, lecteur, état vide |
| `draws` | `asset/icons/ui/draws.png` | tirages |
| `extension` | `asset/icons/ui/extension.png` | extension, appareil |
| `rules` | `asset/icons/ui/rules.png` | règlement, contenu |
| `audit` | `asset/icons/ui/audit.png` | journal d'audit |
| `arrow` | `asset/icons/ui/arrow.png` | action suivante |
| `users` | `asset/icons/ui/users.png` | comptes, participants |
| `gift` | `asset/icons/ui/gift.png` | lots et récompenses génériques |
| `megaphone` | `asset/icons/ui/megaphone.png` | annonces |
| `flag` | `asset/icons/ui/flag.png` | signalements |
| `trophy` | `asset/icons/ui/trophy.png` | gagnant/résultat |
| `shield` | `asset/icons/ui/shield.png` | sécurité, modération |
| `check` | `asset/icons/ui/check.png` | validation/terminé |
| `eye` | `asset/icons/ui/eye.png` | visionnage, retour viewer |
| `points` | `asset/icons/ui/points.png` | pièce points; actuellement composée avec une couche S officielle |
| `chevronDown` | `asset/icons/ui/chevronDown.png` | menus |
| `timer` | `asset/icons/ui/timer.png` | durée, échéance |
| `bell` | `asset/icons/ui/bell.png` | notifications |
| `scratchCard` | `asset/icons/ui/scratchCard.png` | action carte à gratter; pas d'illustration métier distincte identifiée |
| `ticket` | `asset/icons/ui/ticket.png` | ticket compact; actuellement composé avec une couche S officielle |
| `flame` | `asset/icons/ui/flame.png` | série/streak, utilisé notamment par notification dynamique |
| `close` | `asset/icons/ui/close.png` | fermeture |
| `favoriteHeart` | `asset/icons/ui/favorite-heart.png` | favori inactif |
| `favoriteHeartActive` | `asset/icons/ui/favorite-heart-active.png` | favori actif |
| `statusPending` | `asset/icons/ui/status-pending.png` | règle en attente/non validée |
| `warning` | `asset/icons/ui/warning.png` | avertissement admin |
| `sparkle` | `asset/icons/ui/sparkle.png` | décoration/état vide |
| `arrowUpRight` | `asset/icons/ui/arrow-up-right.png` | ouverture externe |

Illustrations séparées, également déclarées dans `SkkupIcon.tsx:40-44,80-85` : `rewardIllustration` → `asset/dashboard/illustrations/skkup-icon-reward.png`; `streakIllustration` → `asset/dashboard/illustrations/skkup-icon-streak.png`; `extensionIllustration` → `asset/dashboard/illustrations/skkup-icon-extension-dashboard.png`; `ticketIllustration` → `asset/icons/ui/ticket.png` et donc même fond ticket que l'icône compacte. Les noms d'illustration sont des usages contextuels, pas des assets tous distincts.

**Composition S actuelle à exclure de la nouvelle proposition :** `SkkupIcon.tsx:102-129` crée un calque `skkup-s-favicon.png` pour `points`, `ticket` et `ticketIllustration`. Le PNG `ticketIllustration` référence le même `ticket.png`. Cette revue n'indique pas de supprimer le logo officiel utilisé séparément dans la marque ou le wordmark; elle signale seulement que la nouvelle icône ne doit pas recevoir un S en overlay.

## Routes et occurrences

Le route tree contient 26 fichiers `page.tsx` : neuf publics, neuf sous `/dashboard`, huit sous `/admin`. Les navigations et barres partagées sont indiquées séparément afin de ne pas compter une source réutilisée comme plusieurs définitions d'icône.

| Route(s) | Composants qui rendent les pictogrammes | Noms/tailles déclarés et emplacements |
|---|---|---|
| `/` | `LocalizedHomeHero`, `LocalizedHomeTrust`, `LocalizedHomeCta` | Hero : `arrow` 18, `streams` 17. Trust : `eye`, `points`, `trophy`, `shield` 28; `gift`, `draws`, `check` 42; badge `draws` 12. CTA : `arrow` 18. Le grand visuel produit du hero est une illustration éditoriale, exclue du pack de pictogrammes. |
| `/confidentialite`, `/faq`, `/reglement` | `EnteteVitrine` et contenu legal/FAQ/règlement | Aucun `SkkupIcon` spécifique au contenu repéré. L'en-tête peut rendre conditionnellement le menu compte d'une session authentifiée (voir chrome commun). |
| `/connexion`, `/inscription` | `LocalizedAuthIntro`, `FormulaireAuth` | Intro : `points`, `ticket` 28. Formulaire : `close` 16; `check` ou `statusPending` 14 dans la liste d'exigences du mot de passe. Le `ticket` reçoit actuellement le calque S composite. |
| `/extension` | `LocalizedExtensionIntro` | `arrowUpRight` 16; `timer`, `check`, `extension`, `shield` 15 chacun. |
| `/streams` | `ListeStreams` | États erreur/vide `streams` 28/34; favori `favoriteHeart` ou `favoriteHeartActive` 20; action `arrow` 17; vignette absente `streams` 40. Les vignettes de stream retournées par l'API sont des médias dynamiques, non des pictogrammes. |
| `/tirages` | `ListeTirages` | Erreur `gift` 28; vide `gift` 34; carte sans image `ticket` 34; date `timer` 14; détail fallback `ticket` 36; résumé `gift`, `ticket`, `timer` 18; lot sans image `gift` 18. `ticket` est actuellement composite avec le S. |
| `/dashboard` | `NavigationDashboard`, `TopbarDashboard`, `MenuCompteDashboard`, `TableauDeBord`, `BandeauStats`, composants de sections | Navigation: `analytics`, `streams`, `gift`, `draws`, `points`, `rules`, `extension`, `users` chacun 20. Barre: `points` 20, `bell` 20; compte: `chevronDown` 15/14 et `close` 16 dans le dialogue mot de passe. KPI: `points` 48, image streak (illustration) 48, `ticket` 48. Sections: ticket vide 22, `gift` 24 si image lot indisponible, `rewardIllustration` 52, `check`/`ticket`/`scratchCard` 26, tirages vides `draws` 22, activité transaction dynamique 24, pièce de transaction `points` 16. Notifications/menu modal conditionnels: `close` 16; panneau historique de notifications (si monté) emploie `bell` 22 et `points`/`flame`/`scratchCard`/`extension` 18. |
| `/dashboard/recompenses` | `CentreRecompenses` et chrome viewer | `rewardIllustration` 48 pour l'en-tête de collection; `check` ou `rewardIllustration` 42 pour cartes/selection selon l'état; `sparkle` 30 pour aucun résultat; `arrow` 17; `ticket`, `points` 25. Le ticket et la pièce reçoivent actuellement le calque S. |
| `/dashboard/tirages` | `ListeTirages` et chrome viewer | Même set conditionnel que `/tirages`: `gift` 28/34/18, `ticket` 34/36/18, `timer` 14/18; ticket composite S. |
| `/dashboard/streams` | `ListeStreams` et chrome viewer | Même set conditionnel que `/streams`: `streams` 28/34/40, favoris 20, `arrow` 17. |
| `/dashboard/extension` | `LocalizedDashboardExtensionPage`, `LocalizedDashboardExtension`, `CodeAppariement` et chrome viewer | En-tête `extensionIllustration` 52; étapes de confidentialité `check` 16; association `extension` 24 et 18. Le composant d'association porte une classe `text-accent-cyan` sur l'icône 24: décor CSS de teinte à revoir pour le nouveau style. |
| `/dashboard/compte`, `/dashboard/reglement`, `/dashboard/historique`, `/dashboard/admin` | `DashboardSas` et composants de page | Chrome viewer s'applique. Pas d'autre `SkkupIcon` direct établi par le relevé des composants spécifique de page. Les états de formulaire/dialogue conditionnels héritent de `MenuCompteDashboard`. |
| `/admin` | `NavigationAdmin`, `TopbarDashboard`, `MenuCompteDashboard`, page cockpit | Navigation : `analytics`, `draws`, `gift`, `megaphone`, `rules`, `shield`, `users`, `audit` et retour `eye`, 20 chacun. KPI/priorités : fallback `gift` 30; priorité choisie `ticketIllustration` 52 ou glyphes 32; titres/actions `draws` 18/24, `gift` 18/16/24, `megaphone` 24, `shield` 18/24, `arrow` 16, `audit` 18/24. Les priorités tirages/lots ont des illustrations; leurs dimensions responsives sont dans `cockpit.css`. Le ticketIllustration reçoit actuellement le S superposé. |
| `/admin/raffles` | `RafflesAdminV3` et chrome admin | `arrowUpRight` 16, `chevronDown` 14, `users`/`gift`/`trophy` 18, `check`/`warning` 16, `shield` 22, `gift` 17. |
| `/admin/lots` | `LotsAdminV3` et chrome admin | `gift` 18/34/28, `check`/`draws`/`shield` 18, `close` 16. |
| `/admin/announcements` | `AnnouncementsAdminV3`/`AdminSectionPage` et chrome admin | `gift` 18 dans détail de lot si ce panneau est réutilisé; `arrow` 14 dans action d'ouverture d'annonce. Navigation admin porte `megaphone` 20. |
| `/admin/content` | `AdminSectionPage` et chrome admin | Navigation admin porte `rules` 20; aucun autre appel `SkkupIcon` direct de contenu n'a été trouvé dans le relevé. |
| `/admin/moderation` | `AdminSectionPage` et chrome admin | Navigation `shield` 20; le cockpit `/admin` porte aussi `flag` dans KPI de signalements selon `priorities.ts` et page cockpit. |
| `/admin/users` | `AdminSectionPage` et chrome admin | Navigation `users` 20. |
| `/admin/audit` | `AdminSectionPage` et chrome admin | Navigation `audit` 20. |

Chrome commun viewer/admin : `NavigationDashboard.tsx` et `NavigationAdmin.tsx` enrobent les icônes dans `.skuup-dashboard-action-icon`; le CSS final du shell premium rend ce support transparent, sans bordure/ombre. `TopbarDashboard.tsx` apporte balance points et cloche. `MenuCompteDashboard.tsx` peut rendre chevron(s) et fermeture de modal. Pour les neuf routes publiques, `EnteteVitrine` rend le wordmark; quand une session est reconnue, il peut également afficher le menu compte. Ce menu conditionnel n'est pas attribué à une route anonyme par défaut.

Autre composant réutilisable sans consommateur de route repéré : `CentreNotifications.tsx` contient `close` 14, `bell` 22 et les icônes de notification dynamiques (`points`, `flame`, `scratchCard`, `extension`) 18, dans des supports de 32 × 32 CSS px (vide: 40 × 40). Ne pas le compter comme occurrence active tant qu'une référence d'import/montage n'est pas établie.

## Tailles et fonds CSS actuels à prendre en compte

| Contexte déclaratif | Taille/traitement source | Fond/bordure déclarés et point de vigilance palette |
|---|---|---|
| Image registre (`.skuup-generated-icon`) | `size` fourni à `SkkupIcon`, défaut 24; `object-fit: contain`. La navigation demande 20 mais les règles premium peuvent forcer les images enfants à `1.55rem` (24.8px). | Image transparente; pas de fond intrinsèque en CSS. |
| Composite points/ticket | Wrapper a la taille `--skuup-icon-size`; overlay S à `scale(.66)` ou `.78` pour points. | Superposition actuelle contraire au brief de la nouvelle proposition; aucune couleur CSS de fond sur le wrapper. |
| Navigation dashboard/admin | Props 20; règle du shell premium donne image 1.55rem; boîte nominale ~2rem. | Le style ancien est un dégradé violet/fuchsia (`globals.css:192`), mais les règles plus tardives (`globals.css:2855-2890`) rendent support, bordure et ombre transparents. Conception du nouvel asset sur fond transparent à ce stade. |
| Trust/public, stats et KPI viewer | Icônes 22/28; coin/ticket 48; image streak 48. | `.skuup-stat-icon` déclare cercle 48px, bord cyan, fond radial violet/bleu; règle shell premium la met en transparent. Le contexte final dépend de l'ordre CSS et du shell. |
| États notifications | image 18 dans support 32; cloche vide 22 dans support 40. | `globals.css:289` déclare actuellement un dégradé cyan/bleu `#09c6e8`→`#1554ee`; incompatibilité directe avec nouvelle palette. `CentreNotifications` n'a pas de consommateur actif établi. |
| États vides viewer | pictogrammes souvent 22–34; classes `.skuup-viewer-v3-empty-icon` et `.skuup-stream-card-art`. | Certaines règles déclarent support cyan/bleu (`globals.css:1322`), d'autres violet avec bleu dans le gradient. Le shell premium neutralise plusieurs cadres de pictogrammes, mais la vignette de stream garde son propre décor. |
| Vignette de stream | pictogramme fallback 40 dans une zone 16:9 (min-height déclarée 7rem, puis 10rem dans les règles ultérieures). | Fond décoratif d'aperçu violet et bleu nuit; badge source peut avoir un accent cyan/vert. Séparer le pictogramme des couleurs de l'habillage du contenu. |
| Cartes/détail tirage | `ticket` 34/36; résumé 18 dans boîte 32; KPI compact via wrapper. | Résumé déclare fond violet translucide. L'art de détail 3×3rem est ensuite redéfini en espace 8×5.5rem avec dégradé violet/bleu nuit; règles de shell récentes peuvent neutraliser le support d'icône. |
| Illustrations viewer reward/extension | reward 42/48/52; extension 52; `object-fit: contain`. | Les illustrations sont décoratives sur fond de carte, sans support commun obligatoire. Le composant extension a une classe couleur cyan; retirer cette teinte explicite de l'icône dans la nouvelle proposition. |
| KPI admin illustration | wrapper/image desktop 52×52; sous 768px 40×40; contenus génériques 32 ou petits 16–24. | `cockpit.css` règle les illustrations à fond transparent; génériques du cockpit également sans fond/ombre dans les overrides. Garder le ratio contain. |

Les couleurs ci-dessus décrivent les règles trouvées, y compris des déclarations plus anciennes remplacées plus tard dans la cascade; elles ne sont pas une mesure de rendu. Le rapport ne crée pas une spécification de nouveaux fonds. La revue indépendante de style (`.codex/work-items/2026-10-25-ui-icon-001/reports/icon-style-independent-review.md`) indique le principe blanc/rose/violet, interdit bleu/cyan et demande une capture par occurrence quand la taille ou le fond diffère. Cette revue est une proposition de conception, pas une approbation propriétaire.

## Marques, médias et contenu à garder séparés

- Wordmark, icône S/favicon et autres marques Skkup : `asset/brand/`; ne pas les confondre avec un pictogramme fonctionnel. La nouvelle proposition ne doit pas intégrer le S comme overlay dans ticket/pièce.
- Logos Twitch/YouTube : `asset/platforms/`; formes de marque officielles, hors recoloration arbitraire. Le libellé Kick est actuellement textuel.
- Icônes d'application extension : `asset/extension/`; la popup rend surtout wordmark, langue et états CSS. Ce n'est pas une route du site App Router.
- Photos de lots, miniatures streams, hero marketing et sprite carte à gratter : images dynamiques/éditoriales, hors périmètre pictogramme.
- Signes CSS comme étoiles/points décoratifs et caractères de quantité : ne sont pas des images du registre; les conserver comme une ligne d'inventaire distincte seulement si la décision les classe comme pictogrammes.

## Limites de cet inventaire

Les appels conditionnels, les états fournis par API et les styles en cascade peuvent créer plusieurs apparences pour un même nom; l'usage source seul ne prouve pas que chaque état a été rendu. Les tailles CSS calculées, contrastes, transparence réelle des pixels, couleurs résultantes des fonds, fidélité des assets et présence dans le build/déploiement n'ont pas été vérifiés ici. La matrice est une base de couverture pour le design, pas une validation du pack ni un feu vert d'implémentation.
