---
last_updated: 2026-10-25
owner: Mickael MUR
---

# Usage des icônes PNG dans les dashboards

## État de cette décision

Périmètre de conception UI-ICON-001 (#450). Cette décision cible les dashboards
viewer et admin; elle ne modifie pas la readiness globale MVP-001. Le mapping a
été relu indépendamment pour les correspondances d’icônes uniquement. Cette
relecture n'approuve pas la readiness globale, qui reste `review`.

## Direction visuelle

Décision de conception réversible pour UI-ICON-001 : intégrer les illustrations
PNG Skkup premium et lumineuses dans les métriques, cartes et états métier assez
grands pour les reconnaître. Garder les pictogrammes PNG fonctionnels dans les
menus, commandes et actions denses lorsqu’aucune illustration métier ne
correspond. La présence sur le disque ne vaut jamais preuve d'intégration.

- Le ticket compact garde le visuel PNG avec le « S » officiel, déjà présent.
  Le PNG `skkup-icon-ticket-s.png` est réservé aux zones de contenu plus grandes.
- Le PNG de série remplace le pictogramme générique `flame` dans la métrique
  viewer; les PNG reward et extension sont employés uniquement dans leurs
  états de contenu correspondants.
- L'ancien asset `skkup-icon-scratch-card.png` était identique au ticket S et
  a été retiré; le pictogramme fonctionnel compact `scratchCard` reste utilisé
  tant qu'aucun visuel métier distinct n'existe.
- Ne pas employer d'illustration `daily-visit` tant qu'aucun emplacement dédié
  à une visite quotidienne n'existe. Ne pas étendre les images métier aux
  entrées génériques d'admin (annonces, utilisateurs, modération, audit).
- Les PNG ne sont ni étirés ni recadrés. Les illustrations conservent leur
  ratio et utilisent `object-fit: contain`.
- Les images décoratives gardent `alt=""` et `aria-hidden="true"` si un libellé
  voisin exprime déjà leur sens. Sinon, fournir un nom accessible pertinent;
  une image ne remplace jamais le nom d'un bouton ou d'un lien.

## Inventaire et correspondances

| Espace | Route / composant | Usage observé dans le code | Observation navigateur | PNG métier retenu | Décision de conception |
| --- | --- | --- | --- | --- | --- |
| Viewer | Shell / `NavigationDashboard` | analytics, streams, gift, draws, points, rules, extension, users via `SkkupIcon` | Capture authentifiée viewer du 2026-10-25: pictogrammes compacts visibles | aucun asset métier adapté à chaque entrée | Garder les pictogrammes fonctionnels PNG à 20–24 px dans le menu; la capture admin reste à obtenir |
| Viewer | `/dashboard`, KPI solde | `skkup-icon-points.png` | Capture viewer: pièce Skkup visible; production publique a servi le PNG (optimisé WebP par Next) | `skkup-icon-points.png` | Conserver l'illustration déjà intégrée |
| Viewer | `/dashboard`, série actuelle | `SkkupIcon` avec illustration streak | Capture viewer pré-intégration: flamme de contour; QA locale mockée post-intégration disponible | `skkup-icon-streak.png` | Illustration intégrée dans la métrique; données inchangées |
| Viewer | `/dashboard`, ticket de tirage | `ticket.png`, contenant le S officiel | Capture viewer: S identifiable sur le ticket compact | `ticket.png` pour le KPI compact; `skkup-icon-ticket-s.png` seulement dans une zone de contenu ≥48 CSS px | Conserver le S existant; ne pas réduire le ticket riche dans un petit KPI |
| Viewer | `/dashboard` et `/dashboard/recompenses`, états métier | illustrations reward avec pictogrammes d’action compacts | Capture viewer pré-intégration; QA locale mockée post-intégration disponible | `skkup-icon-reward.png`; aucun PNG scratch-card distinct disponible | Illustration reward intégrée dans les états/cartes adaptés; garder l'icône scratch-card fonctionnelle jusqu'à un asset distinct |
| Viewer | `/dashboard/extension` | illustration extension dans l’introduction | Capture authentifiée actuelle de cette route non disponible | `skkup-icon-extension-dashboard.png` | Illustration intégrée à 52 CSS px; garder l’icône de navigation compacte |
| Viewer | Visite quotidienne | aucun emplacement dédié trouvé dans le dashboard actuel | Non observé | aucun asset conservé; le PNG sans usage a été retiré | Ne pas intégrer d’illustration tant qu’aucune action ou métrique « visite du jour » correspondante n’existe |
| Admin | Shell / `NavigationAdmin` | analytics, draws, gift, megaphone, rules, shield, users, audit via `SkkupIcon` | Capture locale du checkout avec fixtures, 1280 × 1289: navigation PNG fonctionnelle visible; QA locale mockée desktop/mobile post-intégration disponible; production redirige `/admin` vers `/connexion` | aucun asset métier pour les entrées génériques | Garder les pictogrammes PNG fonctionnels dans la navigation compacte |
| Admin | `/admin`, priorités ouvertes | illustrations ticket/reward dans deux KPI; pictogrammes megaphone et flag conservés | QA locale mockée post-ajustement: conteneurs et rendu vérifiés aux viewports responsive; QA authentifiée de production restante | `skkup-icon-ticket-s.png` pour Tirages; `skkup-icon-reward.png` pour Lots | Illustrations intégrées; conteneurs 52 CSS px sur desktop et 40 CSS px sous 768 px; assertions et captures QA locales mockées disponibles |
| Admin | annonces, modération, utilisateurs, audit, actions et tableaux | mégaphone, drapeau, shield, users, audit et gift compacts | Rendu local mocké couvert par la matrice QA responsive; production authentifiée non inspectée | aucun asset riche correspondant | Garder les PNG fonctionnels du registre; aucun remplacement décoratif hors sémantique |


Le mapping relu est intégré dans les composants dashboard ciblés.
Cette intégration limitée à la carte ne change pas le statut ni les critères de
la readiness globale MVP, qui reste `review`. La QA locale mockée viewer/admin aux viewports responsive est documentée dans
`reports/qa-postcleanup.md` du work item. Les captures authentifiées en
production et le SHA du build déployé restent des preuves distinctes à fournir.

## Tailles et rendu

- Pictogrammes fonctionnels: 16 à 24 CSS px dans la navigation et les actions.
- Illustrations métier: cible de 32 à 64 CSS px dans une carte ou un état; la
  taille peut augmenter si le layout l'autorise.
- Vérifier le ratio, la transparence, le contraste sur les fonds des thèmes
  viewer et admin, l'absence d'image cassée et la netteté à 1× et 2×.
- Tester les viewports 320, 390, 768 et 1280 CSS px sur `/dashboard` et
  `/admin`; aucune carte ne doit s'étirer seulement à cause de l'image.

## Vérification du mapping et portes globales

- [x] Inventaire source confronté aux captures QA locales mockées post-intégration des dashboards viewer et admin, y compris les viewports responsive (rapport `qa-postcleanup.md`).
- [ ] Captures authentifiées actuelles en production pour viewer/admin et vérification du SHA déployé; l’accès de la session QA redirige `/dashboard` vers `/` et `/admin` vers `/connexion`.
- [x] Correspondances métier retenues à partir des noms, textes et usages des composants; `daily-visit` reste sans emplacement et son PNG inutilisé a été retiré.
- [x] Contrat admin documentaire harmonisé avec le registre PNG et les tailles responsive attendues; voir le rapport frontend pour les assertions calculées.
- [x] Relecture indépendante des correspondances du mapping effectuée.
- [ ] Readiness globale du dépôt approuvée; elle reste `review`. La revue du mapping et l'autorisation de cette carte ne valent pas approbation globale.

## Suivi technique

Le registre fonctionnel est
[`frontend/src/components/ui/SkkupIcon.tsx`](../../frontend/src/components/ui/SkkupIcon.tsx).
Les assets PNG et dimensions présentes sont répertoriés dans
[`dashboard-v3-assets.md`](dashboard-v3-assets.md). Les noms de composants et
routes sont issus des sources frontend; les captures authentifiées des deux
dashboards restent une preuve de QA attendue.
