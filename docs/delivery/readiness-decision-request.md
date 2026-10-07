# Décisions requises pour l'approbation de la readiness

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

- Décision : à renseigner par produit/conformité.
- Preuve attendue : durée par catégorie, base de conservation, procédure de
  purge et test de vérification.

## 2. Export et suppression

Confirmer le parcours utilisateur, les données exportées, le format, le délai
de traitement, les exceptions légales et la procédure de suppression ou
d'anonymisation. Le parcours actuel est manuel par email; une route API ne
doit être ajoutée qu'après validation du contrat et des permissions.

- Décision : à renseigner par produit/conformité.
- Preuve attendue : contrat API ou procédure opératoire, permissions, journal
  d'audit et test de bout en bout.

## 3. Médias

Confirmer que le logo et le monogramme référencés par `MEDIA-001` sont des
créations internes autorisées pour les usages prévus, ou fournir la licence et
les obligations d'attribution.

- Décision : produit/propriétaire de la marque.
- Preuve attendue : source éditable ou document de licence conservé dans le
  work item.

## 4. Exploitation préproduction

Les contrôles Compose locaux sont réussis et documentés dans
`docs/quality/ops-evidence-current.md`; ils ne remplacent pas une preuve
préproduction.

Confirmer l'environnement de préproduction, les seuils d'alerte, le canal de
notification, le responsable d'astreinte, le scénario de rollback applicatif
et la restauration complète testée.

- Décision : ops/propriétaire de l'environnement.
- Preuve attendue : rapport d'exécution daté, logs, résultat d'alerte,
  rollback et restauration.

## Effet sur les portes

Tant que ces décisions et preuves ne sont pas ajoutées, `design-gate` reste
`needs-review` et `audit-gate` reste `pending`. Le Coordinateur ne doit pas
les passer à `verified` par défaut.
