---
last_updated: 2026-10-22
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

- [x] Seul un viewer voit les annonces dans le menu Notifications; elles ne
      sont pas dupliquées dans une autre zone viewer.
- [ ] Les annonces publiées à venir et expirées sont incluses; les annonces
      archivées et les brouillons sont exclus.
- [x] La liste est rechargée à chaque ouverture du menu.
- [x] Aucun état lu/non lu, compteur ou badge de quantité n’est présenté ni
      suivi.
- [x] Le modal affiche le titre et le texte brut de l’annonce.
- [x] À l’ouverture, le focus va au contenu; Échap et le bouton ferment le
      modal; le backdrop ne le ferme pas.
- [x] Le bouton de fermeture atteint au moins 44 × 44 CSS px.
- [x] `GET /viewer/announcements` exige une session authentifiée et le rôle
      `VIEWER`.

Le critère « annonces publiées futures/expirées, archivées et brouillons »
reste à relire: le modèle distingue `actif` mais ne possède pas d’état
« brouillon » dédié. Les sept autres critères ont été vérifiés pour
l’implémentation locale décrite ci-dessous; cette preuve ne vaut pas
approbation globale de la readiness.

## Point de vérification du 22 octobre 2026

- QA Chromium local: dialogue testé à 1280×850, 390×850 et 320×850; focus
  initial, confinement Tab/Shift+Tab, clic réel sur le backdrop sans fermeture
  ni perte de focus, Escape, fermeture par bouton, restitution du focus et
  absence de débordement horizontal. Les réponses API sont simulées; ce n’est
  pas une preuve de déploiement.
- Artefacts, empreintes et procédure de reproduction:
  [preuves navigateur Notifications](../quality/evidence/mvp001-notifications-browser-20261022/README.md).
- Relecture indépendante: annonce réservée au viewer, rechargement à chaque
  ouverture, absence de compteur/état de lecture, texte brut, dimensions du
  bouton et contrôle d’accès API vérifiés sur le code et tests existants.
- Limite: le modèle ne distingue pas un brouillon autrement que par
  `actif: false`; ce point reste partiel et n’est pas coché.
- `docs/design/design-readiness.md` reste en `review`; ce point de vérification
  n’approuve ni la readiness ni l’ensemble du MVP-001.

## Références

- Matrice de preuves P0 : [p0-evidence-matrix.md](../quality/p0-evidence-matrix.md).
- Contrat API, routes d’annonces : [04-api-contract.md](../04-api-contract.md).
- État de readiness, distinct de cette décision :
  [design-readiness.md](design-readiness.md).
