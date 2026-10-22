---
last_updated: 2026-10-21
owner_approval: confirmed
owner_approval_date: 2026-10-18
status: decision-recorded; implementation and design-readiness remain under review
---

# ADR-011 : Annonces viewer dans Notifications et détail modal

- Date de la décision : 2026-10-18
- Approbation propriétaire : confirmée, sur la base de la réponse enregistrée
  dans l’historique de conversation le 2026-10-18.
- Portée : annonces créées par l’administration, affichées aux viewers.
- Cet ADR consigne la décision produit. Il ne déclare ni l’implémentation
  terminée, ni le design-readiness approuvé.

## Contexte

Les annonces administratives destinées aux viewers doivent être accessibles
depuis le menu Notifications. Le détail s’ouvre à la demande dans un modal.
Les décisions ci-dessous reprennent uniquement les arbitrages déjà approuvés.

## Décisions approuvées

1. **Audience et emplacement** : viewers uniquement. Les annonces apparaissent
   dans le menu Notifications; l’administration conserve sa gestion séparée.
2. **Annonces visibles** : annonces administratives publiées, y compris celles
   dont la période est future/planifiée ou expirée. Les annonces archivées et
   les brouillons sont exclus.
3. **Lecture et compteur** : aucun suivi lu/non lu, compteur ou badge de
   quantité.
4. **Actualisation** : recharger la liste à l’ouverture du menu Notifications.
5. **Détail** : afficher le titre et le texte brut de l’annonce, sans HTML ni
   Markdown.
6. **Modal et clavier** : placer le focus initial sur le contenu du modal;
   permettre la fermeture par Échap ou par le bouton de fermeture. Un clic sur
   le backdrop ne ferme pas le modal.
7. **Cible tactile** : le bouton de fermeture mesure au minimum 44 × 44 CSS px.
8. **Contrat d’accès** : la route cible est `GET /viewer/announcements`,
   protégée et réservée au rôle `VIEWER`.

## Conséquences

- L’interface viewer ne présente pas ces annonces dans une autre zone et
  n’affiche pas d’état de lecture ni de compteur.
- La route viewer doit distinguer les comptes `VIEWER` des autres rôles et
  retourner les annonces publiées selon les règles temporelles ci-dessus.
- Le contenu du modal est du texte brut fourni par l’annonce.
- Ces décisions définissent la cible à vérifier; elles ne constituent pas une
  preuve que le code, le rendu ou le contrat runtime est conforme.
- Le statut de `docs/design/design-readiness.md` reste inchangé (`review`).
  Cet ADR ne vaut pas approbation de la readiness.

## Critères vérifiables

- [ ] Seul un viewer voit les annonces dans le menu Notifications; elles ne
      sont pas dupliquées dans une autre zone viewer.
- [ ] Les annonces publiées à venir et expirées sont incluses; les annonces
      archivées et les brouillons sont exclus.
- [ ] La liste est rechargée à chaque ouverture du menu.
- [ ] Aucun état lu/non lu, compteur ou badge de quantité n’est présenté ni
      suivi.
- [ ] Le modal affiche le titre et le texte brut de l’annonce.
- [ ] À l’ouverture, le focus va au contenu; Échap et le bouton ferment le
      modal; le backdrop ne le ferme pas.
- [ ] Le bouton de fermeture atteint au moins 44 × 44 CSS px.
- [ ] `GET /viewer/announcements` exige une session authentifiée et le rôle
      `VIEWER`.

Les cases restent non cochées tant que les vérifications correspondantes ne
sont pas produites. L’approbation de la décision ne coche pas ces critères.

## Références

- Matrice de preuves P0 : [p0-evidence-matrix.md](../quality/p0-evidence-matrix.md).
- Contrat API, routes d’annonces : [04-api-contract.md](../04-api-contract.md).
- État de readiness, distinct de cette décision :
  [design-readiness.md](design-readiness.md).
