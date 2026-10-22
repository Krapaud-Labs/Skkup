---
last_updated: 2026-10-22
status: target-design; implementation and global design readiness remain under review
owner_decision: "Ajouter un vrai cycle brouillon/publication/archive"
owner_decision_date: 2026-10-22
---

# Cycle de vie des annonces

## Décision produit

Les annonces ont trois états explicites : `DRAFT`, `PUBLISHED` et `ARCHIVED`.
Une nouvelle annonce est créée en brouillon. La publication est une action
explicite. Les viewers ne reçoivent que les annonces publiées. Cette
spécification traduit la décision du propriétaire du 2026-10-22 et complète
ADR-011; elle ne prouve ni l'implémentation ni l'approbation du design global.

## Transitions

| État courant | Action | État suivant | Règle |
| --- | --- | --- | --- |
| aucun | Créer | `DRAFT` | Jamais de publication implicite |
| `DRAFT` | Modifier | `DRAFT` | Aucun changement d'état implicite |
| `DRAFT` | Publier | `PUBLISHED` | Action admin explicite et auditée |
| `DRAFT` | Archiver | `ARCHIVED` | Masquer sans supprimer |
| `PUBLISHED` | Modifier | `PUBLISHED` | La modification reste visible et est auditée |
| `PUBLISHED` | Archiver | `ARCHIVED` | Masquer sans supprimer |
| `ARCHIVED` | Modifier | refus `409` | Restaurer d'abord, puis modifier |
| `ARCHIVED` | Restaurer | État pré-archivage | Restauration explicite et auditée; une archive publiée redevient visible après restauration |

Une restauration ne peut pas réécrire silencieusement le statut antérieur :
l'audit doit conserver le statut avant et après. Les mutations d'état ne
proviennent pas d'un champ de statut arbitraire fourni par le client. Une
transition invalide ne modifie ni l'annonce ni son historique. Publier une
annonce déjà publiée ou archiver une annonce déjà archivée est un succès
idempotent qui renvoie l'état courant et n'écrit pas de nouvel événement. Une
restauration répétée est idempotente seulement si le même événement prouve
qu'elle a déjà été appliquée et que son instantané est toujours courant; sinon,
elle répond `409` sans écraser de modifications ultérieures. Une transition
concurrente dont l'état attendu a changé renvoie aussi `409` sans mutation.
Archiver un brouillon produit `ARCHIVED`; la restauration reprend `DRAFT` si
cet état précédent est enregistré.

## Affichage viewer

`GET /viewer/announcements` est réservé à une session authentifiée de rôle
`VIEWER` et retourne uniquement `PUBLISHED`. Les dates de début et de fin ne
filtrent pas cette liste : une annonce publiée future ou expirée reste visible,
conformément à ADR-011. `DRAFT` et `ARCHIVED` sont exclus. Le contrat de
pagination, le tri et la projection publique existants restent inchangés.

La route publique historique `GET /announcements/active` reste distincte et
conserve son contrat tant qu'une évolution séparée ne la remplace pas.

## Migration des données historiques

Le schéma observé possède `actif Boolean`, sans brouillon distinct. Pour
préserver l'exposition actuelle sans publier de contenu caché :

- `actif=true` devient `PUBLISHED`;
- `actif=false` devient `ARCHIVED`, y compris en l'absence d'un événement
  `ANNOUNCEMENT_ARCHIVED`; cette classification conserve l'invisibilité et ne
  prétend pas reconstituer une intention de brouillon passée.

Avant migration, produire un inventaire par annonce et ses événements d'audit.
Les valeurs false sans événement d'archivage sont signalées comme exceptions
historiques à examiner; elles restent archivées et ne sont jamais republiées
automatiquement. Comparer les nombres par état avant/après et vérifier qu'il
ne reste aucun statut nul. Les dates et le contenu ne changent pas.

Consommateurs observés à traiter avant retrait de `actif` : l'endpoint public
`GET /announcements/active` dans
`backend/src/announcements/announcements.service.ts` et son appel depuis
`frontend/src/lib/dashboard.ts`; `GET /viewer/announcements`; les opérations
admin `GET /admin/announcements`, `PATCH /admin/announcements/:id`, l'archive
et la restauration dans le même service; le compte et la liste du résumé admin
dans `backend/src/admin-dashboard/admin-dashboard.service.ts`; les types et
mutations dans `frontend/src/lib/admin.ts`; les écrans
`frontend/src/components/admin/AnnouncementsAdminV3.tsx` et
`frontend/src/components/admin/AdminSectionPage.tsx`; les tests backend/frontend
et fixtures correspondants. L'endpoint public garde son contrat historique
temporel distinct; le dashboard admin doit exprimer son compte et sa liste
avec le statut cible.

Séquence cible expand/contract, à valider sur copie réaliste avant toute
implémentation : (1) ajouter le statut nullable en conservant `actif`; (2)
déployer un bridge unique pour les écritures : toute mutation ancienne de
`actif` y est traduite explicitement et chaque écriture met à jour statut et
alias dans la même transaction; aucune instance ne continue d'écrire seulement
`actif` pendant qu'une autre le traite comme un alias dérivé. Avant de
considérer le statut canonique, drainer les anciennes instances et prouver
qu'aucun ancien writer n'est encore actif. Les lecteurs utilisent la valeur
effective `status ?? (actif ? PUBLISHED : ARCHIVED)`; (3) backfiller
`true -> PUBLISHED`, `false -> ARCHIVED`, puis vérifier les comptes, zéro
valeur nulle et l'invariant `actif = (status == PUBLISHED)`; (4) seulement
après cette vérification, migrer chaque consommateur ci-dessus pour lire le
statut canonique; (5) activer la création `DRAFT` uniquement lorsque les
consommateurs admin et viewer ont été migrés et vérifiés, en écrivant
atomiquement `DRAFT` et `actif=false`; (6) n'enlever `actif` qu'après preuve
qu'aucun client ne le lit ou ne l'écrit. Avant le backfill, aucune ligne
`status=null` ou `actif=false` ne peut être renvoyée par une route viewer; les
lecteurs conservent le filtre conservateur `actif=true`. Les nouveaux
brouillons restent invisibles dans l'ancien contrat au même titre que les
archives.

Rollback avant création de brouillons possible: revenir à l'application
précédente en conservant la colonne de statut. Après création de brouillons,
l'ancien booléen ne peut pas distinguer DRAFT d'ARCHIVED; un rollback applicatif
les présentera comme inactifs/archivés sans les republier. Ne pas supprimer le
statut ni tenter de reconstituer les brouillons par rollback. La restauration
complète de cette distinction requiert de redéployer une application qui
comprend le statut. Ce risque et les commandes exactes de rollback restent à
prouver en environnement isolé. Le rollback ne commence qu'après drainage des
writers actuels et vérification que le bridge est la seule voie d'écriture; le
bridge reste actif tant que les anciens clients ou une version de rollback
peuvent écrire `actif`.

## Contrats admin, permissions et audit

Les actions de création, édition, publication, archivage et restauration sont
réservées au rôle admin déjà exigé par les routes d'administration. Chaque
transition conserve l'acteur, l'annonce, l'horodatage et les statuts précédent
et suivant dans la même opération atomique que la mutation. Une répétition
identique ne doit pas créer une transition contradictoire ni un doublon
d'historique. Les viewers ne peuvent lire que la projection publiée et ne
peuvent appeler aucune mutation admin.

| Route cible | Effet |
| --- | --- |
| `POST /admin/announcements` | Créer en `DRAFT` |
| `PATCH /admin/announcements/:id` | Modifier titre, texte ou dates sans champ `status`/`actif`; refus `409` si l'annonce est archivée |
| `POST /admin/announcements/:id/publish` | `DRAFT` vers `PUBLISHED` |
| `DELETE /admin/announcements/:id` | Archiver `DRAFT` ou `PUBLISHED`; conserver le chemin historique |
| `GET /admin/announcements/:id/history` | Lire l'historique autorisé à l'admin |
| `POST /admin/announcements/:id/restore/:eventId` | Restaurer l'instantané et l'état précédent référencés par l'événement d'archive |

Les routes listées sans chemin déjà observé sont des cibles, pas des endpoints
déjà implémentés. La réponse admin expose `status`; `actif` reste un alias de
compatibilité dérivé tant qu'il a des consommateurs. Les anciens clients qui
envoient `actif` sont traduits par le bridge: `true -> PUBLISHED`,
`false -> ARCHIVED`; ils ne peuvent pas créer un brouillon.

Publier un élément déjà publié et archiver un élément déjà archivé répondent
avec l'état courant et sans nouveau journal. Répéter la même restauration
répond sans nouvelle mutation si un événement d'audit prouve que cet
`eventId` a déjà été restauré; si le même instantané n'est plus l'état courant,
répondre `409` pour éviter de réécraser des modifications ultérieures. Une
course où l'état attendu a changé répond aussi `409`, sans mutation ni audit.

La restauration reprend le statut enregistré avant l'archivage, afin de
conserver la sémantique attendue du flux admin. Il s'agit d'un contrat cible,
pas de la sémantique actuellement garantie. Dans le code observé, l'archivage
enregistre seulement le titre et `previousActiveState`; il ne conserve pas
l'instantané complet. La route de restauration accepte un événement quelconque
de la même annonce si `metadata.previous` contient titre et texte, ne vérifie
pas que `eventId` désigne `ANNOUNCEMENT_ARCHIVED`, puis écrit l'annonce et
l'événement `ANNOUNCEMENT_RESTORED` séparément. Le lien
`metadata.sourceEventId` est écrit, mais aucune idempotence n'est démontrée.

La cible doit enregistrer dans l'événement d'archivage l'instantané complet
(titre, texte, dates, statut précédent) et l'horodatage dans la même
transaction que le passage à `ARCHIVED`. La restauration doit vérifier que
`eventId` est bien un événement d'archive de cette annonce, restaurer cet
instantané et écrire le lien `sourceEventId` dans une transaction atomique.
Pour les archives historiques dont le statut précédent n'est pas
reconstructible, la restauration revient à `DRAFT` par sécurité, avec un
événement explicite; l'admin doit publier séparément.

## Compatibilité et preuves attendues

La compatibilité des clients utilisant `actif` doit être vérifiée avant tout
changement du schéma ou de l'API. Tant que l'ancien booléen subsiste, il ne
devient pas une source de vérité concurrente. L'implémentation devra démontrer
les cas brouillon/publié futur/publié expiré/archivé/restauré, les permissions,
les transitions invalides, l'atomicité de l'audit, le backfill sur copie
réaliste et le rollback. Aucun de ces contrôles n'est déclaré réussi par ce
document.

## Fichiers de conception liés

- [ADR-011](adr-011-viewer-notifications-announcements-modal-2026-10-18.md)
- [Contrats API](api-contracts.md) et [contrat API produit](../04-api-contract.md)
- [Modèle de données](../03-data-model.md)
- [Matrice de preuves P0](../quality/p0-evidence-matrix.md)
