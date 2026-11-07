---
last_updated: 2026-11-07
owner_approval: confirmed
owner_approval_date: 2026-10-18
owner_revision_date: 2026-11-07
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

1. **Audience et emplacement** : espace personnel viewer des comptes `VIEWER`
   et `ADMIN`. Les annonces apparaissent dans le menu Notifications;
   l’administration conserve sa gestion éditoriale séparée.
2. **Annonces visibles** : annonces administratives au statut `PUBLISHED`, y
   compris celles dont la période est future/planifiée ou expirée. Les statuts
   `DRAFT` et `ARCHIVED` sont exclus. Le cycle complet est défini dans
   [la conception du cycle de vie](announcement-lifecycle-2026-10-22.md).
3. **Lecture et compteur** : une annonce devient lue localement quand le
   viewer l’ouvre. Les identifiants lus sont conservés dans `localStorage`,
   séparément pour chaque profil et navigateur; ils ne sont pas synchronisés
   entre appareils. Le compteur est calculé sur l’ensemble des annonces
   `PUBLISHED`, y compris futures et expirées. Le badge visuel affiche `9+`
   au-delà de neuf, tandis que son libellé accessible annonce le nombre exact.
4. **Actualisation** : recharger la liste à l’ouverture du menu Notifications.
5. **Détail** : afficher le titre et le texte brut de l’annonce, sans HTML ni
   Markdown.
6. **Modal et clavier** : placer le focus initial sur le contenu du modal;
   permettre la fermeture par Échap ou par le bouton de fermeture. Un clic sur
   le backdrop ne ferme pas le modal.
7. **Cible tactile** : le bouton de fermeture mesure au minimum 44 × 44 CSS px.
8. **Contrat d’accès** : `GET /viewer/announcements` et
   `POST /viewer/announcements/unread-count` requièrent une session authentifiée.
   `VIEWER` et `ADMIN` peuvent consulter leur espace viewer. Le serveur ne
   persiste pas les états de lecture.

## Révision approuvée le 7 novembre 2026

Le propriétaire a explicitement demandé de réviser ADR-011 et d’implémenter le
compteur. Cette décision remplace le point 3 et la conséquence historique
« aucun état de lecture ni compteur » ci-dessus. Les autres arbitrages
d’affichage et d’accessibilité restent applicables. Le calcul serveur reçoit
des IDs locaux lus, compte leurs correspondances dans une photographie stable
des annonces publiées et renvoie aussi l’empreinte de cet ensemble. Le client
répète les requêtes par lots d’au plus 1 000 IDs et vérifie que l’ensemble
publié n’a pas changé entre les lots.

## Conséquences

- L’interface viewer ne présente pas ces annonces dans une autre zone.
- L’état lu est local au profil/navigateur; il n’est ni stocké par le serveur
  ni synchronisé entre appareils.
- Le compteur couvre toutes les annonces `PUBLISHED`, et non seulement la page
  courante de 50 annonces; le badge visuel est plafonné à `9+`.
- Les routes viewer acceptent les rôles disponibles `VIEWER` et `ADMIN` et
  retournent les annonces publiées selon les règles de diffusion ci-dessus.
- Le contenu du modal est du texte brut fourni par l’annonce.
- Ces décisions définissent la cible à vérifier; elles ne constituent pas une
  preuve que le code, le rendu ou le contrat runtime est conforme.
- Le statut de `docs/design/design-readiness.md` reste inchangé (`review`).
  Cet ADR ne vaut pas approbation de la readiness.

## Critères vérifiables

- [x] Seul un viewer voit les annonces dans le menu Notifications; elles ne
      sont pas dupliquées dans une autre zone viewer.
- [ ] Les annonces publiées à venir et expirées sont incluses; les annonces
      archivées et les brouillons sont exclus.
- [x] La liste est rechargée à chaque ouverture du menu.
- [ ] Le compteur correspond à toutes les annonces publiées moins les IDs lus
      localement; le badge affiche au plus `9+`.
- [ ] L’état de lecture est conservé par profil dans le navigateur et n’est
      pas présenté comme synchronisé entre appareils.
- [x] Le modal affiche le titre et le texte brut de l’annonce.
- [x] À l’ouverture, le focus va au contenu; Échap et le bouton ferment le
      modal; le backdrop ne le ferme pas.
- [x] Le bouton de fermeture atteint au moins 44 × 44 CSS px.
- [x] `GET /viewer/announcements` et
      `POST /viewer/announcements/unread-count` exigent une session
      authentifiée; le modèle courant autorise `VIEWER` et `ADMIN`.

Le critère « annonces publiées futures/expirées, archivées et brouillons »
reste à vérifier dans le point de contrôle historique ci-dessous. Les critères
du compteur révisé restent ouverts jusqu’à la CI et à la revue indépendante de
sa branche de livraison. Cette preuve ne vaut pas approbation globale de la
readiness.

## Point de vérification du 22 octobre 2026

- QA Chromium local: dialogue testé à 1280×850, 390×850 et 320×850; focus
  initial, confinement Tab/Shift+Tab, clic réel sur le backdrop sans fermeture
  ni perte de focus, Escape, fermeture par bouton, restitution du focus et
  absence de débordement horizontal. Les réponses API sont simulées; ce n’est
  pas une preuve de déploiement.
- Artefacts, empreintes et procédure de reproduction:
  [preuves navigateur Notifications](../quality/evidence/mvp001-notifications-browser-20261022/README.md).
- Relecture indépendante historique: annonce viewer, rechargement à chaque
  ouverture, absence de compteur/état de lecture selon la décision alors en
  vigueur, texte brut, dimensions du bouton et contrôle d’accès API vérifiés.
- Cette décision historique a été révisée explicitement le 7 novembre 2026;
  elle ne décrit plus le comportement cible du compteur.
- Limite: le code observé ne distingue pas `DRAFT`, `PUBLISHED` et `ARCHIVED`.
  La décision produit de créer des brouillons existe désormais, mais le critère
  reste décoché jusqu'à implémentation, migration et preuves de test.
- `docs/design/design-readiness.md` reste en `review`; ce point de vérification
  n’approuve ni la readiness ni l’ensemble du MVP-001.

## Références

- Matrice de preuves P0 : [p0-evidence-matrix.md](../quality/p0-evidence-matrix.md).
- Contrat API, routes d’annonces : [04-api-contract.md](../04-api-contract.md).
- État de readiness, distinct de cette décision :
  [design-readiness.md](design-readiness.md).
