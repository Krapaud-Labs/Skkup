---
last_updated: 2026-10-29
owner: Mickael MUR
---

# DASH-V3 - Design freeze et matrice de réalisation

Statut : `design en cadrage`, non approuvé pour la recette finale.
Date : 4 octobre 2026

Ce document devient la référence de séquencement : le design est d'abord
figé écran par écran, puis les fonctionnalités sont raccordées aux contrats
réels et enfin auditées en une passe de recette complète. Il ne valide pas la
Definition of Done.

## Matrice viewer

| Référence | Route | Composition à figer avant implémentation | Contrat et états à raccorder |
| --- | --- | --- | --- |
| `dashboard-viewer-principal.png` | `/dashboard` | shell viewer, KPI points/série/tickets, stream mis en avant, extension, récompenses, tirages, activité | session, résumé viewer, streams, récompenses, tirages, historique; loading/empty/error |
| `viewer-streams-detaille.png` | `/dashboard/streams` | recherche, filtres plateformes, cartes médias, favoris, pagination, CTA extension | catalogue streams, favoris, pagination, erreur et catalogue vide |
| `viewer-tirages-detaille.png` | `/dashboard/tirages` | cartes lots, statut, dates, coût/ticket, participation et résultats | tirages publics, tickets, participation, résultat publié, permission et erreur |
| `viewer-recompenses-detaille.png` | `/dashboard/recompenses` | filtres, cartes disponibles/utilisées, gain, progression et détail | récompenses, solde, consommation, double clic, erreur |
| `viewer-historique-detaille.png` | archive de conception, ancienne route `/dashboard/historique` | référence historique, écran viewer retiré; l’ancienne URL redirige vers l’activité du dashboard | activité récente du dashboard; API et données conservées, vue viewer complète retirée |
| `viewer-extension-detaille.png` | `/dashboard/extension` | installation, association, code, appareils, expiration et reprise | pairing token, appareils, révocation, session et erreurs |

## Matrice admin

| Référence | Route | Composition à figer avant implémentation | Contrat et états à raccorder |
| --- | --- | --- | --- |
| `dashboard-admin-principal.png` | `/admin` | contexte, KPI illustrés, tableaux tirages/lots, éditorial, modération, audit | résumé admin, permissions, loading/empty/error |
| `admin-tirage-detaille.png` | `/admin/raffles` | cockpit de tirage, lot, participants, éligibilité, contrôle, résultat, audit | CRUD/tirage cryptographique, autorisation, confirmation, erreur |
| `admin-lots-detaille.png` | `/admin/lots` | inventaire illustré, stock, fournisseur, édition et suppression protégée | lots, stock, validation, permissions et audit |
| `admin-annonces-contenus-detaille.png` | `/admin/announcements`, `/admin/content` | listes, édition, brouillon, publication, planification, archivage, versions | annonces/contenus, mutations, historique et erreurs |
| `admin-signalements-utilisateurs-detaille.png` | `/admin/moderation`, `/admin/users`, `/admin/audit` | dossiers, priorité, contexte, décision, suspension et timeline | signalements, utilisateurs, audit, 401/403 et mutations protégées |

## Règles de gel design

- Aucun écran secondaire ne sera considéré terminé parce que sa route existe.
- Les composants partagés doivent porter les mêmes tokens de couleur, densité,
  iconographie, focus et états responsive que les maquettes.
- Chaque zone visuelle doit avoir une source de données ou un état vide
  contractuel identifié. Aucun texte, compteur, média ou statut fictif.
- Les breakpoints de référence sont 320, 768 et 1280 px minimum.
- Le gel design sera déclaré seulement après relecture des 13 références,
  vérification des assets/icônes et accord du spécialiste design fidelity.
- La recette fonctionnelle et l'audit final commenceront après ce gel, sur la
  branche de travail dédiée et avec commits atomiques par domaine.

## État de la phase

- Inventaire des références et routes : effectué.
- Design system et assets : existants mais relecture de fidélité encore requise.
- Implémentation : partielle, ne pas déclarer le gel.
- Fonctionnalités réelles : partiellement raccordées, ne pas déclarer la recette.
- QA desktop/mobile : ouverte.
- PR et fusion `dev` : interdites jusqu'à la fin de la recette.
