# Audit DASH-V3 depuis `origin/dev`

Date de l'audit : 2026-10-03  
Référence contrôlée : `ce12577` (`origin/dev` après fusion des PR #197 et #198)

## Conclusion

La livraison V3 est présente dans `dev`, mais la Definition of Done n'est pas
prouvée. Les shells viewer et admin, les routes secondaires et plusieurs
contrats existent. L'audit révèle toutefois des écarts de fidélité et de
parcours, notamment le cockpit `/admin` historique encore conservé, des
contrôles visuels à compléter et une validation navigateur des données réelles
qui doit être rejouée avec l'API démarrée.

La correction simple réalisée dans cette branche remplace l'icône de
notification décorative du shell viewer par l'asset V3 `v3/bell.svg` et lui
ajoute un état interactif explicite « Aucune nouvelle notification ».

## Matrice maquettes → routes

| Référence | Route réelle | État constaté | Gap priorisé |
| --- | --- | --- | --- |
| `dashboard-viewer-principal.png` | `/dashboard` | Shell V3, KPI, temps de visionnage et sections de contenu présents | P1 : preuve navigateur avec données réelles et comparaison visuelle à compléter |
| `viewer-streams-detaille.png` | `/dashboard/streams` | Recherche, plateforme, favoris, pagination et CTA extension présents | P1 : vérifier médias, états chargement/vide/erreur et densité de la référence |
| `viewer-tirages-detaille.png` | `/dashboard/tirages` | Liste et actions de participation/résultat présentes via `ListeTirages` | P1 : vérifier chaque CTA et les états de tirage dans le navigateur |
| `viewer-recompenses-detaille.png` | `/dashboard/recompenses` | `CentreRecompenses` présent avec cartes, filtres et actions | P1 : comparer les visuels de cartes à gratter et les états utilisés/verrouillés |
| `viewer-historique-detaille.png` | `/dashboard/historique` | Historique points/visionnage présent | P1 : vérifier filtres, pagination et rendu des plateformes |
| `viewer-extension-detaille.png` | `/dashboard/extension` | Code d'appariement et état extension présents | P1 : tester génération, erreur, expiration et connexion réelle |
| `ecrans-secondaires-viewer.png` | routes viewer ci-dessus | Routes couvertes | P1 : parcours transversal et responsive non revalidés sur `origin/dev` pendant cet audit |
| `dashboard-admin-principal.png` | `/admin` | Ancien cockpit monolithique encore présent avec fonctionnalités historiques | **P0 : remplacer complètement par le cockpit V3, sans recyclage de l'ancien dashboard** |
| `admin-tirage-detaille.png` | `/admin/raffles` | Écran autonome avec liste et tirage cryptographique | P1 : preuve navigateur et alignement carte/détails |
| `admin-lots-detaille.png` | `/admin/lots` | Création et inventaire des lots présents | P1 : intégrer/valider visuels de lots et actions d'édition/suppression |
| `admin-annonces-contenus-detaille.png` | `/admin/announcements`, `/admin/content` | Gestion d'annonces et contenu présentes | P1 : valider versions, publication, archivage et historique sur parcours réel |
| `admin-signalements-utilisateurs-detaille.png` | `/admin/moderation`, `/admin/users` | Dossiers de modération et utilisateurs présents | P1 : vérifier preuves, actions, permissions et confirmation d'action |
| `ecrans-secondaires-admin.png` | routes admin ci-dessus | Navigation persistante V3 présente | P0 : `/admin` doit utiliser le même cockpit V3, puis validation responsive complète |

## Contrats backend contrôlés

- `GET /admin/dashboard/summary` existe, est protégé par `AdminGuard`, borne
  les résultats et expose les compteurs/audit nécessaires au cockpit V3.
- Les contrats admin existants couvrent tirages, lots, annonces, contenu,
  signalements, utilisateurs et audit.
- Les contrats viewer couvrent profil, streams, tirages, récompenses,
  historique et appariement extension.
- Gap P1 : le nouveau contrat `admin/dashboard/summary` n'est pas encore
  consommé par le cockpit `/admin`, qui charge encore plusieurs listes de
  manière indépendante.

## Fonctionnalités et liens

| Contrôle | Preuve | Résultat |
| --- | --- | --- |
| Navigation viewer | `NavigationDashboard.tsx` et tests | Présente, liens nommés |
| Navigation admin | `NavigationAdmin.tsx` et tests | Présente sur les routes secondaires |
| Actions viewer | composants `ListeStreams`, `ListeTirages`, `CentreRecompenses`, extension | Présentes, validation navigateur restante |
| Actions admin | `AdminSectionPage.tsx`, `GestionContenu.tsx`, `app/admin/page.tsx` | Présentes, mais mélange V3 et ancien cockpit à supprimer |
| Notification viewer | correction de cette branche | Corrigée avec asset V3 et popover fonctionnel |
| Placeholders textuels | scan `rg` ciblé | Aucun écran secondaire générique détecté ; le cockpit historique reste un risque de recyclage |

## Contrôles exécutés

- `git fetch origin dev` : OK.
- PR #197 : fusionnée dans `dev` (`1efd126`).
- PR #198 : fusionnée dans `dev` (`ce12577`).
- `npm run typecheck` frontend : OK.
- `npm run lint -- --no-warn-ignored` : 0 erreur, 2 avertissements hooks dans
  `AdminSectionPage.tsx`.
- Tests ciblés viewer : 19 tests OK.
- Validation navigateur avec backend réellement démarré : **non prouvée dans
  cet audit**, donc DoD volontairement non déclarée.

## Plan de correction priorisé

1. P0 : reconstruire `/admin` autour du cockpit V3 et retirer le rendu de
   l'ancien dashboard, en consommant `GET /admin/dashboard/summary`.
2. P1 : lancer frontend + backend avec une session de test et exécuter les
   parcours viewer/admin à 320, 768 et 1280 px, avec captures de preuve.
3. P1 : comparer chaque écran secondaire à sa référence, notamment les images
   de lots/streams, les états verrouillé/utilisé, les filtres et les CTA.
4. P1 : corriger les deux avertissements hooks et ajouter les tests des
   interactions de notification et des états d'erreur/état vide.

La DoD reste ouverte jusqu'à la preuve navigateur et la livraison des
corrections P0/P1 dans `dev`.
