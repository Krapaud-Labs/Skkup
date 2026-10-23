---
last_updated: 2026-10-23
---

# Décisions requises pour l'approbation de la readiness

Statut des décisions : **baseline owner révisée le 18 octobre 2026**.
Cette décision confirme les orientations documentaires indiquées ci-dessous,
mais reste soumise aux owners spécialisés et à la validation Conformité; elle
ne constitue pas à elle seule une approbation de la conception ni de l'audit.

Ce document ne valide aucune porte. Il liste les décisions métier et
d'exploitation indispensables avant la relecture indépendante finale.

## État technique constaté

- Le règlement publié fixe la conservation du compte à trois ans après la
  dernière connexion.
- La politique de confidentialité prévoit une demande de droits par email à
  `skkup.pro@gmail.com`.
- L'API ne contient actuellement aucune route utilisateur d'export, de
  suppression ou d'anonymisation. Ces demandes restent donc manuelles; aucune
  fonctionnalité inexistante n'est présentée comme livrée.

## 1. Rétention et purge

Choisir une durée documentée pour `User`, `Session`, `Heartbeat`,
`DeviceToken`, `PointLedger`, `Ticket`, `FraudSignal` et `AuditLog`, ainsi
que le responsable et la fréquence de purge.

- Proposition conservée : baseline de conservation et purge du tableau
  ci-dessous, à valider par catégorie; aucune durée ni base légale nouvelle
  n'est déduite dans ce document.
- Preuve attendue : durée par catégorie, base de conservation, procédure de
  purge et test de vérification.

## 2. Export et suppression

Confirmer le parcours utilisateur, les données exportées, le format, le délai
de traitement, les exceptions légales et la procédure de suppression ou
d'anonymisation. Le parcours actuel est manuel par email; une route API ne
doit être ajoutée qu'après validation du contrat et des permissions.

- Proposition conservée : parcours manuel, export JSON et traitement sous
  30 jours selon la baseline du tableau ci-dessous, sous validation compétente.
- Preuve attendue : contrat API ou procédure opératoire, permissions, journal
  d'audit et test de bout en bout.

## 3. Médias

Le responsable produit a confirmé l'usage visé des catégories `MEDIA-001` à
`MEDIA-004`, déclarées générées par IA. Cet accord de périmètre au niveau
catégorie ne constitue pas une autorisation générale de droits, ni une preuve
de provenance ou d'usage pour chaque fichier publié. Les miniatures distantes
`MEDIA-005` restent soumises aux conditions de la plateforme source.

- Décision owner enregistrée : l'usage produit visé des catégories
  `MEDIA-001` à `MEDIA-004` est accepté; aucune conclusion de conformité ou de
  droits individuels n'en découle.
- Preuve ACT-09 attendue : inventaire par fichier/ressource reliant provenance,
  source, usage réellement publié, brief/prompt, retouches, droits ou licence,
  et source éditable lorsqu'elle existe; revue Conformité à consigner.
  `MEDIA-005` doit être évalué selon les conditions de chaque plateforme.

## 4. Opérations staging/préproduction (post-MVP)

Les contrôles Compose locaux sont réussis et documentés dans
`docs/quality/ops-evidence-current.md`. Ces contrôles locaux ne prouvent pas
les opérations staging.

L'inspection versionnée du dépôt ne révèle aucun endpoint ou fichier de
configuration de préproduction. La procédure Dokploy documentée cible la
production et ne permet pas de déduire une preuve préproduction.

## Suivi post-MVP dans l'issue #422

Par décision owner du 21 octobre 2026, les preuves d'exploitation staging sont
retirées du périmètre MVP-001 et restent à réaliser après le MVP dans
[#422](https://github.com/Krapaud-Labs/Skkup/issues/422). L'issue suit
l'isolation staging, les sauvegardes/restaurations PostgreSQL et volumes,
l'alerting et l'astreinte, le rollback applicatif et la mise à jour du runbook.
Ces éléments ne sont pas réputés réalisés et ne constituent plus un prérequis
de clôture de MVP-001.

- Les validations Docker locales restent des preuves locales uniquement; elles
  ne valent ni preuve staging ni réalisation des critères de #422.

## Effet sur les portes

`design-gate` et `audit-gate` restent `needs-review` en raison des autres
décisions, preuves et relectures encore ouvertes. La décision #422 ne ferme
aucune de ces portes; les critères staging post-MVP n'en sont pas un prérequis.
Le Coordinateur ne doit pas les passer à `verified` par défaut.

## Proposition de décision préparée par le Coordinateur

Pour réduire la décision humaine au strict nécessaire, les valeurs suivantes
sont adoptées comme baseline réversible. Elles restent révisables par produit,
conformité ou ops si une contrainte documentée l'exige.

| Sujet | Proposition à valider | Responsable attendu |
| --- | --- | --- |
| User | conservation active puis purge/anonymisation après 3 ans sans connexion, alignée sur le règlement | produit/conformité |
| Session, Heartbeat, DeviceToken | purge 90 jours après expiration ou dernière activité | produit/conformité |
| PointLedger, Ticket, FraudSignal, AuditLog | conservation 3 ans minimum pour preuve et contestation, puis purge/anonymisation selon obligation légale | produit/conformité |
| Purge | job mensuel journalisé, revue trimestrielle, aucune suppression irréversible avant sauvegarde vérifiée | ops |
| Export/suppression | demande manuelle à `skkup.pro@gmail.com`, accusé sous 7 jours, traitement sous 30 jours, export JSON et suppression/anonymisation tracée | produit/conformité |
| ACT-09 Médias | inventorier par fichier/ressource provenance, usage réellement publié, brief/retouches et droits; l'accord owner sur les catégories MEDIA-001 à MEDIA-004 ne vaut pas preuve individuelle; MEDIA-005 reste soumis à chaque plateforme source | Design + Conformité |
| Opérations staging | critères de sauvegarde, alerting, astreinte, rollback et restauration suivis après MVP dans l'issue #422; non réalisés et hors des prérequis MVP-001 | suivi post-MVP #422 |

Les orientations produit partielles consignées dans cette baseline ne valent
pas validation complète des exigences ACT-03/ACT-09. Aucune validation
Conformité ou ops, ni preuve d'exécution, n'est établie par ce document. La
prochaine action est la relecture indépendante de la conception et des preuves
P0. Aucun code, secret ou déploiement de production n'est requis pour consigner
cette baseline.
