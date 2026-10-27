# Vérification frontend du pack UI-ICON-001 courant

Date du contrôle: 2026-10-25
Checkout: `test/ui-icon-001-docker-live`, HEAD `3c856b062782092091c9f03b8505ba79193b61ae`
Périmètre: registre, 29 fichiers PNG, retrait du S superposé, CSS de taille, documentation master et `frontend/README.md`. Aucun fichier sous `.codex/` n'a été consulté ou modifié dans cette vérification.

## Résultats

| Contrôle | Preuve/commande | Résultat |
|---|---|---|
| Nombre et format des assets | `file asset/icons/ui/*.png` | 29 fichiers, tous PNG RGBA 1254 × 1254. `sips -g hasAlpha -g pixelWidth -g pixelHeight` confirme alpha et dimensions sur les représentants `analytics`, `ticket`, `points`; le format RGBA 1254 est présent pour les 29 sorties de `file`. |
| Correspondance registre → fichiers | Script Python en lecture seule: extraction de `iconSources` dans `frontend/src/components/ui/SkkupIcon.tsx`, comparaison avec `asset/icons/ui/*.png` | 29 noms, 29 chemins uniques, 29 fichiers; aucun fichier manquant et aucun PNG runtime sans mapping. |
| Rendu de l'icône | `frontend/src/components/ui/SkkupIcon.tsx` | Retourne directement un seul `<Image>` de `visualSources[name]`, `alt=""`, `aria-hidden="true"`, `object-fit: contain` côté CSS. La taille de composant par défaut est 24 CSS px; les appels peuvent fournir une taille différente. `ticketIllustration` référence `/assets/icons/ui/ticket.png`. |
| Superposition du S | Recherche de `skuup-generated-icon-composite`, `skuup-generated-icon-brand-overlay` et `data-brand-mark` dans le code TSX/TS/CSS hors tests | Aucun résultat runtime. Les mentions restantes sont des assertions négatives dans les tests; les logo S et favicon autonomes sont hors de cette vérification. |
| Dimensions responsive | `frontend/src/app/globals.css:79-90,2078,2878-2885`; `frontend/src/app/admin/cockpit.css:115-141` | Navigation: cellule du conteneur 2.8 rem, image enfant 1.55 rem. Image d'icône générique: `display:block`, `object-fit:contain`. Illustration KPI admin: 52 × 52 px, réduite à 40 × 40 px sous 768 px. Les overrides premium enlèvent fond/bordure/ombre sur plusieurs wrappers et images. |
| Optimiseur Next Image | `frontend/src/components/ui/SkkupIcon.tsx`, `frontend/next.config.ts`, build standalone Webpack et requête HTTP loopback | Le prop `unoptimized` a été retiré. La build de production génère `/_next/image`; le serveur standalone renvoie le PNG demandé redimensionné à 64 × 64 et négocie WebP. Les PNG source restent dans `asset/icons/ui/`. |
| Docs | `docs/design/dashboard-icon-usage.md`, `frontend/README.md` | Les deux documentent 29 PNG transparents 1254 × 1254 et le rendu ticket/points sans calque S. Ils décrivent le lot accepté comme des icônes blanches détaillées, à biseaux argentés, avec halos diffus rose/violet. |
| Tests et diff | `npm test -- src/components/ui/SkkupIcon.test.tsx`; `git diff --check` | 5 tests passés; diff propre. Les assertions vérifient désormais la route d'optimisation et l'URL source conservée en paramètre. |

## Approbation visuelle propriétaire

Le propriétaire a confirmé explicitement que le rendu du premier lot est
accepté et a demandé qu'aucune retouche de style supplémentaire ne soit faite.
Le résultat accepté est décrit comme des icônes blanches détaillées, des
biseaux argentés et des halos diffus rose/violet. Cette confirmation prévaut
sur une lecture isolée de l'aperçu des PNG; aucun écart esthétique n'est
déclaré dans ce rapport.

La nouvelle génération paraît utiliser une source différente des anciennes cellules 256 × 256 RGB décrites dans le précédent `ui-icon-style-implementation.md`. Ce rapport antérieur n'a pas été modifié; le présent audit documente l'état courant observé au HEAD ci-dessus.

## Usages du registre

Le registre est typé `Record<SkkupIconName, string>`, ce qui donne une entrée et un PNG par chacun des 29 noms. Les principaux consommateurs observés dans les sources sont :

| Nom | Source PNG | Consommateurs/usages source repérés |
|---|---|---|
| `analytics` | `analytics.png` | `NavigationDashboard`, `NavigationAdmin` |
| `streams` | `streams.png` | `NavigationDashboard`, `ListeStreams`, `LocalizedHomeHero` |
| `draws` | `draws.png` | `NavigationDashboard`, `NavigationAdmin`, `ListeTirages`, cockpit, trust home, résumé de tirage |
| `extension` | `extension.png` | navigation, `CodeAppariement`, `LocalizedExtensionIntro`, contrôle confidentialité extension |
| `rules` | `rules.png` | navigation viewer et admin |
| `audit` | `audit.png` | navigation admin, cockpit |
| `arrow` | `arrow.png` | `LocalizedHomeHero`, `LocalizedHomeCta`, `ListeStreams`, `CentreRecompenses`, cockpit, action annonce |
| `users` | `users.png` | navigation viewer/admin, `RafflesAdminV3` |
| `gift` | `gift.png` | navigation, trust home, listes/détails de tirages, états dashboard, cockpit, `LotsAdminV3`, `RafflesAdminV3` |
| `megaphone` | `megaphone.png` | navigation admin, priorités cockpit |
| `flag` | `flag.png` | priorité signalements du cockpit admin |
| `trophy` | `trophy.png` | trust home, `RafflesAdminV3` |
| `shield` | `shield.png` | navigation admin, introduction/contrôle extension, listes admin, `RafflesAdminV3` |
| `check` | `check.png` | trust home, formulaire, cartes récompenses, extension, `LotsAdminV3`, `RafflesAdminV3` |
| `eye` | `eye.png` | trust home, lien retour viewer de la navigation admin |
| `points` | `points.png` | introduction auth, KPI et activité dashboard, barre viewer, récompenses, trust home |
| `chevronDown` | `chevronDown.png` | menu compte viewer, actions admin tirage |
| `timer` | `timer.png` | `LocalizedExtensionIntro`, `ListeTirages` |
| `bell` | `bell.png` | barre viewer; type vide de `CentreNotifications` (composant sans consumer actif repéré) |
| `scratchCard` | `scratchCard.png` | cartes viewer conditionnelles; type de `CentreNotifications` (composant sans consumer actif repéré) |
| `ticket` | `ticket.png` | auth, KPI/états dashboard, récompenses, `ListeTirages`; également source alias `ticketIllustration` |
| `flame` | `flame.png` | type streak de `CentreNotifications` (composant sans consumer actif repéré) |
| `close` | `close.png` | formulaire auth, dialogs viewer, `LotsAdminV3`, fermeture notifications |
| `favoriteHeart` | `favorite-heart.png` | bouton favori non actif de `ListeStreams` |
| `favoriteHeartActive` | `favorite-heart-active.png` | bouton favori actif de `ListeStreams` |
| `statusPending` | `status-pending.png` | règle mot de passe non satisfaite du formulaire auth |
| `warning` | `warning.png` | vérifications de prérequis dans `RafflesAdminV3` |
| `sparkle` | `sparkle.png` | accent KPI `BandeauStats`, aucun résultat `CentreRecompenses` |
| `arrowUpRight` | `arrow-up-right.png` | action installation `LocalizedExtensionIntro`, annonce liée depuis `RafflesAdminV3` |

- Navigations: `NavigationDashboard.tsx` consomme analytics, streams, gift, draws, points, rules, extension et users; `NavigationAdmin.tsx` consomme analytics, draws, gift, megaphone, rules, shield, users, audit et eye.
- Vitrine/auth/extension: `LocalizedHomeHero`, `LocalizedHomeTrust`, `LocalizedHomeCta`, `LocalizedAuthIntro`, `FormulaireAuth`, `LocalizedExtensionIntro`, `LocalizedDashboardExtensionPage`.
- Dashboard: `TableauDeBord`, `BandeauStats`, `TopbarDashboard`, `MenuCompteDashboard`, `CentreRecompenses`; `ListeStreams` et `ListeTirages` réutilisent leurs glyphes sur routes publiques et viewer.
- Administration: `app/admin/page.tsx`, `RafflesAdminV3.tsx`, `LotsAdminV3.tsx`, `AnnouncementsAdminV3.tsx`, `AdminSectionPage.tsx`; les icônes de signalement/annonce tirent aussi leur mapping des priorités admin.
- Des noms dynamiques ont des consumers conditionnels: `favoriteHeart`/`favoriteHeartActive` dans Streams; `check`/`statusPending` pour les règles d'inscription; `check`/`ticket`/`scratchCard` pour les cartes; `points`/`flame`/`scratchCard`/`extension` pour la liste de notifications. `CentreNotifications.tsx` n'a pas de consommateur d'import repéré dans le scan source, donc ses occurrences restent un composant non monté établi par ce relevé.

## Fichiers actualisés

- `docs/design/dashboard-icon-usage.md`: retire les affirmations devenues fausses sur les cellules RGB 256 × 256 extraites; décrit le pack courant, la référence propriétaire et le rendu que le propriétaire a accepté.
- `frontend/README.md`: décrit le pack courant en RGBA haute résolution, l'optimisation à la taille d'affichage, le retrait du calque S et le rendu accepté.
- `frontend/src/components/ui/SkkupIcon.tsx`: retire `unoptimized` afin que `next/image` réduise/encode les PNG côté serveur.
- `frontend/src/components/ui/SkkupIcon.test.tsx`: vérifie que les entrées utilisent `/_next/image` avec le PNG source local comme valeur `url`.

## Limites

`npm run build` avec Turbopack a échoué sur `listen EPERM` lors du lancement d'un processus CSS par la sandbox. `npm run build -- --webpack` a réussi et produit le runtime standalone. Dans ce runtime, après copie des sources `asset/icons/ui` comme le fait le Dockerfile, l'endpoint `/_next/image?url=%2Fassets%2Ficons%2Fui%2Fticket.png&w=64&q=75` a répondu 200: PNG 64 × 64 de 3 248 octets sans en-tête Accept, puis WebP 64 × 64 de 2 384 octets avec `Accept: image/webp`. La source ticket est restée inchangée à 1 494 874 octets. `sharp` est présent dans `.next/standalone/node_modules/sharp/package.json`. Le démon Docker n'était pas accessible (`docker.sock: permission denied`), donc l'image Docker réelle n'a pas été bâtie. Le contrôle porte sur l'endpoint HTTP standalone, pas sur un rendu navigateur multi-viewport ou déployé. Aucun asset n'a été modifié.
