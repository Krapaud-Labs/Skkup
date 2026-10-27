---
agent_role: qa
agent_id: /root/qa_audit
status: rework
scope: Audit visuel read-only de l’instance Docker locale, routes /dashboard et /admin, dimensions d’images et fonds CSS calculés; couverture partielle explicitement signalée.
evidence: Branche test/ui-icon-001-docker-live, HEAD 3c856b062782092091c9f03b8505ba79193b61ae; captures PNG pleine page; inspecteur DOM/Computed Styles du navigateur; inventaire statique docs/design/ui-icon-style-frontend-audit.md.
next_action: Faire relire la matrice par conception/propriétaire, puis couvrir les routes et états conditionnels indiqués avant de valider tout pack d’icônes.
---

# Audit Docker des icônes et de leurs fonds

## Portée et méthode

Inspection visuelle en lecture seule de l’instance locale `http://localhost:3000` dans Chrome, session authentifiée Krapaud. Les 26 routes du registre frontend ont été ouvertes et leur arbre d’accessibilité relu; les deux routes ayant une capture conservée sont `/dashboard` et `/admin`. Aucun test ni changement produit n’a été exécuté. Les deux captures sont des captures complètes de page; la capture admin initiale a été prise avec DevTools docké, ce qui réduit la largeur utile et affecte la disposition. Les styles CSS calculés et dimensions détaillées disponibles dans cette session concernent les échantillons `/dashboard` et `/admin` déjà décrits plus bas. Les dimensions y sont CSS px, sauf indication des dimensions intrinsèques du PNG.

Checkout observé: branche `test/ui-icon-001-docker-live`, HEAD `3c856b062782092091c9f03b8505ba79193b61ae`. Ce rapport caractérise le rendu de ce checkout Docker, pas un déploiement distant ni une approbation de design.

## Captures réelles

- [`docker-viewer-20261025.png`](ui-icon-style-audit/docker-viewer-20261025.png): page entière `/dashboard`, 3024 × 2854 pixels. Montre le hero, les KPI, l’illustration reward, les cartes et l’historique visibles.
- [`docker-admin-20261025.png`](ui-icon-style-audit/docker-admin-20261025.png): page entière `/admin`, 2346 × 2788 pixels. Capture à largeur réduite par DevTools docké; les couleurs et les pictogrammes sont visibles, mais ne pas utiliser cette capture pour conclure sur le responsive ou les dimensions de mise en page.

## Fonds calculés et lisibilité

| Route / élément | Style calculé dans le navigateur | Constat |
|---|---|---|
| `/dashboard`, panneau overview | `linear-gradient(120deg, rgba(25, 23, 74, 0.96), rgba(13, 30, 65, 0.96))`; bordure `rgba(98, 217, 255, 0.2)` | Fond violet-nuit vers bleu-nuit, liseré cyan visible. |
| `/dashboard`, cartes KPI | `rgba(7, 24, 55, 0.45)`; bordure `rgba(75, 139, 219, 0.34)` | Le fond translucide se compose avec le panneau; bordure bleue visible. |
| `/dashboard`, panneau à gratter | `linear-gradient(145deg, rgba(10, 30, 67, 0.98), rgba(8, 22, 49, 0.98))`; bordure `rgba(42, 107, 183, 0.42)` | Carte bleu-nuit, bordure bleue. |
| `/admin`, shell | couleur de fond `rgb(6, 20, 45)` avec gradient radial démarrant à `rgba(35, 68, 139, 0.28)` | Fond bleu-nuit avec halo bleu. |
| `/admin`, KPI | `linear-gradient(145deg, rgba(16, 36, 59, 0.98), rgba(9, 22, 39, 0.98))` | Fond bleu/vert-nuit, pictogrammes sans filtre CSS. |

Contraste texte estimé aux extrémités des gradients, en composant les opacités indiquées sur la couleur de base observée: texte blanc cassé `#f5f3ff` sur KPI viewer environ 15.5–15.7:1; gris `#aeb6c5` environ 8.3–8.4:1. Sur KPI admin, blanc cassé environ 14.3–16.6:1 et gris environ 7.7–8.9:1. Ce sont des estimations calculées à partir des styles et non des mesures de pixels de capture. Aucun ratio WCAG n’est attribué aux PNG multicolores; visuellement leurs silhouettes se distinguent sur ces fonds sombres.

## Matrice observée par pictogramme et route

Les tailles CSS ci-dessous sont des mesures du DOM sur les rendus actifs; les tailles naturelles sont celles des fichiers chargés. Les appels conditionnels qui ne sont pas apparus dans ces deux pages restent explicitement non observés. Pour l’inventaire de toutes les routes et occurrences source, voir [`ui-icon-style-frontend-audit.md`](ui-icon-style-frontend-audit.md).

| Nom / groupe | Route observée et dimensions | Autres emplacements connus / état de preuve |
|---|---|---|
| `analytics`, `streams`, `gift`, `draws`, `rules`, `users`, `extension` | `/dashboard`, navigation; images autour de 24.8 × 24.8 CSS, PNG naturels 256 × 256 | `analytics`, `draws`, `gift`, `rules`, `users` et autres entrées de navigation admin sont source-confirmées sur `/admin`; pas toutes les entrées/variantes mesurées dans la capture réduite. Routes dédiées streams, extension et tirages non ouvertes. |
| `points` + overlay S | `/dashboard`: 20 × 20 en barre, 48 × 48 en KPI, 16 × 16 dans les transactions; source PNG 256 × 256. L’overlay officiel S est visible sur les rendus composite. | `/admin` topbar et autres routes auth/recompenses sont conditionnels ou non mesurés dans cet audit. |
| `ticket` + overlay S | `/dashboard`: KPI 48 × 48; occurrence de panneau/ligne plus petite visible dans la page. | `/admin`: ticket KPI mesuré 52 × 52, S overlay 34.32 × 34.32, fichiers naturels respectifs 256 × 256 et 720 × 720. `/tirages`, `/dashboard/recompenses` et états vides non visités. |
| `streakIllustration` | `/dashboard`: illustration KPI via `/_next/image`, naturelle 48 × 48, affichée à environ 40.8 × 40.8 CSS. | Les notifications peuvent rendre `flame`; panneau de notifications non vérifié comme monté. |
| `rewardIllustration` | `/dashboard`: illustration vide de récompense 52 × 52, PNG naturel 1254 × 1254. | `/admin`: illustration de KPI récompense 52 × 52 dans le DOM. `/dashboard/recompenses` et états alternatifs non visités. |
| `gift` | `/dashboard`: navigation 24.8 × 24.8; plusieurs icônes de cartes autour de 24–25 × 24–25 CSS. | `/admin`: navigation et KPI/sections; tailles 24–30 selon contexte. `/admin/lots` non ouvert, les lignes dépendant des lots ne sont pas toutes vérifiées. |
| `megaphone`, `flag`, `shield`, `audit` | `/admin`: navigation et KPI/sections visibles dans la capture; éléments de cockpit visibles. | `/admin/announcements`, `/admin/moderation`, `/admin/audit` non ouvertes. Détails de tables et états conditionnels non observés. |
| `sparkle`, `check`, `scratchCard` | `/dashboard`: décorations/états et lignes visibles; `sparkle` 16 × 16 dans ses occurrences, `check` 24 × 24, `scratchCard` 24 × 24. | `/dashboard/recompenses` et états succès/absence de résultat non visités. |
| `bell`, `chevronDown`, `close` | `bell` visible en barre `/dashboard`; les menus/modalités de compte ne sont pas ouvertes. | `chevronDown` et `close` conditionnels, non inspectés en état ouvert. Centre de notifications source identifié, montage live non prouvé. |

Les mesures S overlay dans les KPI admin sont liées au PNG de marque séparé; elles ne sont pas une validation de la pertinence de ce composite. Le brief/revue de style indépendant demande un pack blanc/rose/violet sans cyan ni bleu et sans S superposé. Le rendu actuellement capturé conserve des bordures cyan/bleues et des reflets bleus; il ne correspond donc pas à cette direction proposée. La direction reste à faire approuver par le propriétaire.

## Couverture des routes ouvertes dans Docker

Toutes les routes ci-dessous ont été ouvertes directement sur l’instance Docker locale et une lecture AX a confirmé la page. Le runtime CUA expose ici l’arbre d’accessibilité et la capture, mais ne permet pas d’évaluer le DOM pour chaque route. `AX ne nomme pas les icônes décoratives` car les images `SkkupIcon` sont `aria-hidden`; les emplacements iconographiques sont donc croisés avec l’inventaire frontend source, sans les marquer comme dimension/style mesuré. La capture `/dashboard` est la preuve visuelle principale du shell viewer; `/admin` celle du shell admin.

| Route ouverte | Contenu/état live confirmé | Emplacements d’icônes concernés et preuve |
|---|---|---|
| `/` | Hero, catégories et quatre étapes marketing rendus | Usage `arrow`, `streams`, `eye`, `points`, `trophy`, `shield`, `gift`, `draws`, `check` listé dans l’inventaire; les visuels du hero/étapes sont des illustrations éditoriales, pas des PNG de `SkkupIcon`. Taille/fond individuel non mesurés ici. |
| `/confidentialite` | Page légale chargée | Aucun pictogramme spécifique au contenu dans l’inventaire; menu de compte connecté visible. La taille/fond de ce menu n’a pas été mesuré sur cette route. |
| `/faq` | Questions et réponses rendues | Aucun pictogramme spécifique de contenu inventorié; menu connecté en chrome commun. Style individuel non mesuré. |
| `/reglement` | Page légale longue chargée | Aucun pictogramme spécifique de contenu inventorié; menu connecté en chrome commun. Style individuel non mesuré. |
| `/connexion` | Formulaire de connexion et intro affichés | `points`, `ticket`, `close`, `check`/`statusPending` répertoriés source; les dimensions/styles précis par élément ne sont pas mesurés. |
| `/inscription` | Page chargée avec modal du règlement ouvert et case d’acceptation | Condition de modal réellement présente; `close` source-confirmé, son rendu/dimension non mesuré. Aucun accord soumis. |
| `/extension` | Génération de code, état « Aucun appareil associé », étapes d’installation | `arrowUpRight`, `timer`, `check`, `extension`, `shield` attendus selon source; l’état vide d’appareil est live, les dimensions/fonds iconiques ne sont pas mesurés. |
| `/streams` | Catalogue live de 2 chaînes, filtre plateforme disponible; filtre catégorie/langue désactivé; vignettes absentes dans l’état observé | Fallback `streams`, favoris et flèche source-répertoriés. Le fallback de vignette est effectivement nécessaire avec les miniatures absentes; son nom/dimension DOM non exposé par AX. |
| `/tirages` | 10 résultats live; détail de démonstration sélectionné; éléments ouverts et publiés; lots listés | `gift`, `ticket`, `timer` source-répertoriés; détails de carte et badges de statut actifs. Pas de détail CSS/dimension par icône sur cette route. |
| `/dashboard` | Dashboard viewer connecté, 55 points, 1 jour de série, 0 ticket, lots et tirage de démonstration; capture pleine page jointe | Shell, KPI points/streak/ticket, reward illustration, listes et activité vérifiés visuellement; dimensions/fonds détaillés dans les sections précédentes. |
| `/dashboard/recompenses` | 0 cartes, 0 tickets; message « Aucune récompense ne correspond à ce filtre » et « Aucun ticket n’est encore associé » | État vide live confirmé; `rewardIllustration`, `check`, `sparkle`, `ticket`, `points` sont sources possibles selon branche d’état, mais l’arbre AX ne révèle pas quelles images décoratives ont effectivement été montées. Non qualifié de rendu iconique exact. |
| `/dashboard/tirages` | Vue liste/détail viewer chargée avec les mêmes tirages de démonstration | `gift`, `ticket`, `timer` selon source. Occurrences/dimensions style individualisées non mesurées. |
| `/dashboard/streams` | Route viewer dédiée ouverte avec shell viewer; catalogue accessible | `streams`, favoris, flèche selon source. Pas de preuve AX du fallback exact sur cette route; dimensions/style non mesurés. |
| `/dashboard/extension` | Page viewer d’extension chargée | Illustration d’extension et check/extension de jumelage selon source. La condition exacte d’association n’a pas été vérifiée à ce point de navigation, aucun dimensionnement DOM. |
| `/dashboard/compte` | Route de compte ouverte sous shell viewer | Chrome viewer; formulaires/dialogues éventuels non ouverts sur cette route. Icônes conditionnelles non mesurées. |
| `/dashboard/reglement` | Règlement chargé sous shell viewer | Aucun pictogramme de contenu attendu dans l’inventaire; chrome commun seul. Fond local et dimensions iconiques non mesurés. |
| `/dashboard/historique` | Historique ouvert sous shell viewer | Historique transactions/notifs selon données disponibles; icônes dynamiques points/flame/scratchCard/extension possibles à la source. Occurrence exacte et tailles non mesurées. |
| `/dashboard/admin` | Route SAS viewer ouverte avec shell viewer et contenu de sas | Aucun pictogramme distinct de page relevé par la source; états de navigation/menu conditionnels non mesurés. |
| `/admin` | Cockpit admin complet, KPI et tables avec données locales; capture conservée | `ticketIllustration`, `rewardIllustration`, `megaphone`, `flag`, `draws`, `gift`, `shield`, `audit` visibles dans cockpit selon données; KPI ticket et overlay S détaillés plus haut. |
| `/admin/raffles` | Page tirages admin ouverte, listings/filtres/édition disponibles | `users`, `gift`, `trophy`, `check`, `warning`, `shield`, `arrowUpRight`, `chevronDown` source-répertoriés; tailles/styles par icône non mesurés. |
| `/admin/lots` | Page lots admin ouverte, formulaire/liste présents | `gift`, `check`, `draws`, `shield`, `close` source-répertoriés; lignes disposent d’images indisponibles et icônes fallback possibles. DOM/style exacts non mesurés. |
| `/admin/announcements` | Page d’annonce avec édition live préchargée; onglets édition/révisions/historique exposés | `gift`/`arrow` potentiels selon panneau, navigation `megaphone` visible; les boutons n’ont pas été soumis. Dimensions/fonds non mesurés. |
| `/admin/content` | Bibliothèque live: 8 pages, 1 publiée, 7 brouillons; aperçu et actions affichés | Navigation `rules`; aucun autre appel iconique de contenu identifié par source. Fond et tailles non mesurés. |
| `/admin/moderation` | 12 signalements, 10 visibles sur page 1/2; panneau de détail sans dossier sélectionné | Navigation `shield`, pagination et état détail vide live. `flag` est source-répertorié dans KPI cockpit, pas confirmé sur cette liste. |
| `/admin/users` | 78 comptes; table chargée avec 10 admins et 159 sessions affichées dans les KPI | Navigation `users`, lignes et actions d’activation/désactivation. Icônes internes aux actions non identifiées via AX, dimensions/fonds non mesurés. |
| `/admin/audit` | 91 événements; page 1/12, événement sélectionné et preuve détaillée | Navigation `audit`; activités/filtre live. Dimensions/fonds des glyphes internes non mesurés. |

Menus account/notification : le DOM AX expose les boutons de menu et de notifications repliés sur les pages viewer/admin; aucun des deux panneaux n’a été déployé durant cette passe. Ils sont donc *non rendus comme panneau ouvert*. La modal inscription (règlement) et les états vides de récompenses/extension et de signalement ont, eux, été observés. Les listes admin paginées sont limitées aux pages 1 visibles par défaut; je n’ai pas avancé leur pagination.

## Limites et prochaine validation

La navigation couvre les 26 routes déclarées et confirme des états API/données et quelques états vides dans l’instance locale. Elle ne fournit pas des captures séparées ni des mesures computed par icône pour chaque route. Ces styles/dimensions non disponibles sont laissés explicitement non mesurés; le rapport source frontend répertorie les usages possibles, pas les pixels réels. Les captures ne prouvent pas l’apparence déployée. Aucune validation de tests, d’accessibilité complète ou d’approbation de conception n’est revendiquée.

Prochaine action minimale: faire valider la direction palette et le traitement du S, puis capturer les routes/états conditionnels listés avec leurs tailles et fonds calculés avant d’accepter le nouveau pack.
