---
last_updated: 2026-10-18
owner: conception
status: proposition design / needs-review
---

# ADR-011 - Annonces viewer dans Notifications et détail modal

Date : 2026-10-18
Statut : `proposition design`, réversible, à relire
Périmètre : conception viewer uniquement
Approbation design : requise avant toute implémentation

## Demande du responsable

Les annonces créées et publiées par un administrateur doivent apparaître
uniquement dans le menu `Notifications` du viewer. Le clic sur une annonce doit
ouvrir son détail dans un modal.

Cette décision est une règle de présentation et de navigation. Elle ne modifie
pas le cahier accepté, les contrats API, la persistance ni les permissions
admin.

## Faits observés

- `frontend/src/components/dashboard/TopbarDashboard.tsx` possède déjà une
  cloche `Notifications`, un état ouvert/fermé et un popover avec le message
  `Aucune nouvelle notification.` et un lien vers un journal. Le point rouge
  présent dans le pattern visuel est désormais explicitement exclu par la
  décision du responsable.
- `frontend/src/lib/dashboard.ts` expose `AnnoncePublique` et
  `recupererAnnoncesActives()` via `/announcements/active`.
- `frontend/src/components/dashboard/TableauDeBord.tsx` porte aujourd'hui la
  logique principale du dashboard viewer; les annonces ne sont pas démontrées
  dans ce fichier par cette passe de conception.
- `frontend/src/components/dashboard/TableauDeBord.test.tsx` contient des
  scénarios d'annonces et de modal, mais plusieurs sont `test.skip`. Ils
  constituent une intention de test, pas une preuve d'implémentation.
- Les patterns design existants demandent un dialogue accessible avec focus,
  fermeture `Escape`, retour au déclencheur et états loading/vide/erreur.
  Références : `dashboard-redesign-2.0.md`, `dashboard-v3-viewer-spec.md` et
  `dashboard-wireframes-2.0.md`.

## Rapport backend vérifié

Les faits suivants sont vérifiés dans les sources, sans en déduire une
implémentation de la présente proposition :

- `backend/prisma/schema.prisma:381-394` définit `Announcement` avec
  `actif Boolean @default(true)`, `debutAt` et `finAt`. Il n'existe pas de
  champ distinct `draft`, `published` ou `archived`.
- `backend/src/announcements/announcements.service.ts:20-38` filtre
  `actif=true` et applique les bornes `debutAt <= now` et `finAt >= now`.
- `backend/src/announcements/announcements.service.ts:40-59` crée une annonce
  sans fournir `actif`, ce qui la laisse à `true` par défaut.
- `backend/src/announcements/announcements.service.ts:140-161` archive par
  `actif=false` et journalise `ANNOUNCEMENT_ARCHIVED`.
- `backend/src/announcements/announcements.controller.ts:26-31` expose
  `GET /announcements/active` avec limitation de débit, sans
  `JwtAuthGuard` ni contrôle de rôle. Le frontend est son seul consommateur
  de production connu dans `frontend/src/lib/dashboard.ts:191-192`.
- `backend/src/auth/guards/admin.guard.ts:26-66` impose `Role.ADMIN`.
  Aucun `ViewerGuard` explicite n'a été trouvé; `JwtAuthGuard` authentifie mais
  ne restreint pas le rôle.

Conséquence : le critère « exclure les brouillons » est actuellement **vacu**,
car le modèle ne possède pas de brouillon distinct. Si des brouillons métier
doivent exister, un modèle et un contrat distincts devront être décidés avant
toute implémentation de cette notion.

## Décision de conception proposée

### Audience et emplacement unique

1. L'audience de cette fonctionnalité est limitée aux viewers authentifiés.
2. Le viewer ne présente pas de bloc d'annonces dans le dashboard, les cartes
   d'activité, les récompenses ou une autre zone concurrente.
3. L'entrée unique est la cloche `Notifications` dans le shell viewer.
4. À chaque ouverture du menu, la liste est rechargée depuis la source
   disponible. Le menu ne repose pas sur une liste persistante en mémoire après
   sa fermeture.
5. Le menu liste toutes les annonces publiées et activées pour les viewers
   authentifiés, y compris celles dont la période est expirée et celles dont la
   période de publication est future.
6. Les annonces archivées sont exclues, même si elles ont été publiées
   auparavant.
7. Les brouillons ne sont jamais affichés.
8. Aucun point rouge décoratif, compteur ou badge de quantité n'est affiché.
   Aucun état lu/non lu n'est calculé, persisté ou présenté.

### Ouverture du détail

- Chaque annonce est un contrôle clavier nommé par son titre.
- Un clic ou une activation clavier ouvre un modal nommé par le titre de
  l'annonce.
- Le modal affiche uniquement le titre et le texte brut de l'annonce, sans
  réécriture, résumé, HTML enrichi ou CTA ajouté par le viewer.
- La période, la date et les métadonnées ne sont pas affichées dans le modal
  par défaut, car la décision confirmée ne les demande pas.
- Aucun CTA métier supplémentaire n'est inventé.

### États

| État | Comportement proposé | Statut |
| --- | --- | --- |
| Chargement | conserver la cloche et afficher une structure de menu contextualisée | à spécifier avec le pattern de chargement du shell |
| Vide | afficher `Aucune nouvelle notification` ou son équivalent localisé; ne proposer aucune destination secondaire | décision consolidée |
| Erreur récupérable | expliquer l'indisponibilité et proposer une reprise sans bloquer le dashboard | à valider avec le comportement réseau existant |
| Ouverture du menu | recharger les annonces à chaque ouverture | décision confirmée |
| Liste | afficher toutes les annonces publiées/activées pour les viewers authentifiés, y compris futures et expirées; jamais les brouillons | décision confirmée |
| Annonce archivée | exclue | décision confirmée |
| Lu / non lu | aucun état, compteur ou point rouge | décision confirmée |
| Modal ouvert | titre + texte brut, focus initial sur le contenu, fermeture explicite et `Escape` | baseline design; revalidation du pattern partagé à l'implémentation |
| Modal fermé | retour au menu et restauration du focus sur l'annonce déclencheuse | proposition design |
| Session expirée / permission | des preuves générales d'authentification/session existent historiquement; revalider spécifiquement Notifications/modal après expiration et le refus sans fuite de contenu pour un rôle non viewer | à vérifier; `needs-review` |

## Fermeture et accessibilité

- Utiliser le pattern de dialogue partagé : `role="dialog"`, nom accessible,
  `aria-modal="true"` lorsque ce pattern le prévoit.
- À l'ouverture, placer le focus sur le conteneur du titre et du texte, rendu
  focusable programmatiquement (`tabindex="-1"` si nécessaire), afin que le
  contenu de l'annonce soit annoncé avant les contrôles. Le bouton de
  fermeture reste ensuite accessible dans l'ordre de tabulation interne.
- Conserver le focus dans le modal tant qu'il est ouvert, avec un ordre de
  tabulation interne cohérent.
- Fermer avec le bouton explicite ou `Escape`.
- Un clic sur le backdrop ne ferme pas le modal : la fermeture reste explicite
  afin d'éviter une perte de contexte et de suivre une baseline conservatrice.
- À la fermeture, restaurer le focus sur le contrôle qui a ouvert l'annonce.
- Les annonces d'état de chargement ou d'erreur ne doivent pas être annoncées
  deux fois par un `role="status"` et un autre mécanisme équivalent.
- Le menu ne porte aucun point rouge, compteur ou autre indicateur visuel de
  lecture/non-lecture.
- Le texte doit rester lisible au zoom 200 %, au clavier et avec
  `prefers-reduced-motion`.

## Responsive

- Desktop : popover ancré à la cloche; le modal reste centré dans la zone
  visible avec largeur lisible et contenu défilable si nécessaire.
- Tablette : conserver l'ancrage et éviter que le popover sorte de l'écran;
  le modal utilise une largeur disponible avec marges constantes.
- Mobile 320 px : menu et modal occupent presque toute la largeur utile, sans
  défilement horizontal; le bouton de fermeture reste visible; le texte long
  défile dans le modal plutôt que dans la page derrière.
- Le modal ne rend que le titre et le texte brut; le texte long reste
  défilable sans défilement horizontal.

## Impact API et données

L'implémentation actuelle expose `recupererAnnoncesActives()` via
`/announcements/active`. Le contrôleur et le service confirment que cette route
est publique et filtre à la fois `actif=true` et la fenêtre temporelle. Elle ne
suffit donc pas au besoin viewer consolidé : elle exclut les annonces expirées
et futures et n'impose pas l'authentification viewer.

### Contrat recommandé, réversible

Cette ADR recommande une nouvelle route dédiée, sans la créer ni modifier le
code :

`GET /viewer/announcements`

La route serait protégée par `JwtAuthGuard` et par un guard explicite exigeant
`Role.VIEWER`. Elle retournerait les annonces `actif=true` sans filtre sur
`debutAt` ou `finAt`. Les annonces `actif=false`, qui incluent les annonces
archivées selon le comportement actuel, seraient exclues.

La route publique existante `GET /announcements/active` serait préservée pour
son usage public actuel. Cette proposition distingue donc clairement la preuve
de l'existant et le contrat recommandé; elle ne constitue pas une preuve
d'implémentation.

La distinction attendue pour la route viewer est :

- viewer non authentifié : non exposé;
- `actif=true`, quelle que soit la période : exposé;
- `actif=false` : non exposé;
- supprimé ou inexistant : non exposé.

Il n'existe actuellement aucun brouillon distinct à tester. Si ce besoin métier
est ajouté, le modèle et le contrat devront être décidés avant son exclusion.

Preuves attendues pour l'évolution recommandée : contrôleur et guard
explicitement `Role.VIEWER`, réponse authentifiée contenant une annonce
`actif=true` future et expirée, absence d'une annonce `actif=false`, et
confirmation qu'aucun modèle lu/non lu ni compteur n'est requis.

## Critères d'acceptation de conception

- [ ] Une annonce publiée par admin n'est visible que depuis `Notifications`.
- [ ] Une annonce publiée non expirée apparaît dans `Notifications`.
- [ ] Une annonce publiée expirée apparaît dans `Notifications`.
- [ ] Une annonce publiée/activée avec une période future apparaît dans
  `Notifications`.
- [ ] Le critère brouillon est documenté comme actuellement vacu; aucune
  exclusion de brouillon distinct ne peut être testée sans modèle métier dédié.
- [ ] Une annonce archivée n'apparaît jamais dans `Notifications`.
- [ ] La route viewer recommandée est `GET /viewer/announcements`, protégée par
  JWT et par un guard exigeant explicitement `Role.VIEWER`.
- [ ] La route viewer retourne `actif=true` sans filtre de dates et exclut
  `actif=false`.
- [ ] `GET /announcements/active` public est préservé pour son usage actuel.
- [ ] Le dashboard ne duplique pas l'annonce dans une autre carte ou section.
- [ ] Chaque annonce est activable au clavier et ouvre un modal nommé.
- [ ] Le modal conserve le contenu administré et expose une fermeture explicite.
- [ ] Le focus initial est placé sur le contenu du modal et reste contenu dans
  le modal tant qu'il est ouvert.
- [ ] `Escape` ferme le modal et restitue le focus au déclencheur.
- [ ] Le clic sur le backdrop ne ferme pas le modal.
- [ ] Les états loading, vide, erreur et session non disponible sont définis.
- [ ] Le comportement est lisible à 320, 768 et 1280 px, avec zoom 200 %.
- [ ] Aucun état lu/non lu, compteur ou point rouge décoratif n'est affiché.
- [ ] L'ouverture du menu déclenche un rechargement de la liste.
- [ ] Le modal affiche uniquement le titre et le texte brut.
- [ ] La revue design indépendante valide le rendu et l'accessibilité avant
  toute approbation.

## Inconnues et décisions nécessaires

- **Contrat recommandé : `needs-review` bloquant pour l'implémentation.**
  `/viewer/announcements` n'existe pas encore; sa création, son DTO de réponse,
  son guard `Role.VIEWER` et sa coexistence avec la route publique doivent être
  revus et acceptés par le propriétaire backend.
- **Brouillon : `needs-review` bloquant uniquement si le métier en demande un.**
  Le modèle actuel ne distingue pas les brouillons. Le critère d'exclusion est
  donc vacu aujourd'hui; aucun modèle ou statut ne doit être inventé.
- **Archivage : preuve d'implémentation à revalider.** Le code actuel associe
  l'archivage à `actif=false`; la route viewer recommandée doit conserver cette
  exclusion.
- **Lien générique `Ouvrir le journal` : décision consolidée.** Il est retiré
  de cette fonctionnalité : `Notifications` est le point d'accès unique et
  aucune destination secondaire non démontrée n'est conservée. Une route
  unique distincte ne pourra être ajoutée qu'après une décision et une preuve
  dédiées.
- **Pattern modal partagé : contrôle d'implémentation requis.** La baseline est
  désormais fixe : focus initial sur le contenu, focus piégé dans le modal,
  fermeture explicite ou `Escape`, pas de fermeture par backdrop, puis focus
  restauré sur le déclencheur. La vérification devra confirmer que le composant
  partagé respecte exactement ces points; elle ne doit pas choisir une variante
  concurrente.
- **Localisation : décision documentaire.** Les libellés du menu, du modal,
  des états vides et des erreurs utilisent les locales déjà supportées par le
  viewer, actuellement `fr` et `en`; aucune nouvelle règle métier n'est
  introduite.
- **Modèle de visibilité : fait établi, couverture contractuelle manquante.**
  Le modèle actuel ne distingue pas brouillon, publié et archivé : `actif=true`
  est l'état créé par défaut et `actif=false` est utilisé pour l'archivage.
  Toute notion métier de brouillon ou de publication distincte doit faire
  l'objet d'une décision séparée avant évolution du modèle ou du contrat.

## Réversibilité et porte de sortie

Un prototype statique de conception est disponible dans
[evidence/notifications-modal-concept/README.md](evidence/notifications-modal-concept/README.md).
Il sert uniquement à relire la hiérarchie, le menu Notifications et le modal;
il ne constitue ni un rendu navigateur du produit, ni une implémentation, ni
une preuve de contrat API.

Cette proposition peut être retirée ou remplacée sans migration de données,
car elle ne décide ni d'un nouveau champ lu/non lu, ni d'un modèle de compteur,
ni d'une modification du modèle de contenu. Une évolution éventuelle du
contrat de visibilité doit être décidée séparément. La règle reste une proposition tant qu'un
auditeur design indépendant n'a pas relu le rendu, l'accessibilité et la
cohérence avec les contrats existants.

**Design approval reste requis.**
