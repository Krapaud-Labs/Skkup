# Décisions requises pour l'approbation de la readiness

Statut des décisions : **validées par le propriétaire du projet le 8 octobre 2026**.
Cette validation autorise la relecture indépendante; elle ne constitue pas à
elle seule une approbation de la conception ni de l'audit.

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

- Décision validée : baseline de conservation et purge du tableau ci-dessous.
- Preuve attendue : durée par catégorie, base de conservation, procédure de
  purge et test de vérification.

## 2. Export et suppression

Confirmer le parcours utilisateur, les données exportées, le format, le délai
de traitement, les exceptions légales et la procédure de suppression ou
d'anonymisation. Le parcours actuel est manuel par email; une route API ne
doit être ajoutée qu'après validation du contrat et des permissions.

- Décision validée : parcours manuel, export JSON et traitement sous 30 jours
  selon la baseline du tableau ci-dessous.
- Preuve attendue : contrat API ou procédure opératoire, permissions, journal
  d'audit et test de bout en bout.

## 3. Médias

Confirmer que `MEDIA-001` à `MEDIA-004` sont bien les assets déclarés générés
par IA pour le projet et autoriser leurs usages prévus. La déclaration produit
du 2026-10-07 est désormais la preuve de provenance retenue pour ce lot; les
miniatures distantes `MEDIA-005` restent soumises aux conditions de la plateforme.

- Décision validée : usages MEDIA-001 à MEDIA-004 autorisés; MEDIA-005 reste
  soumis aux conditions de la plateforme source.
- Preuve attendue : déclaration produit, brief ou décision associée, et source
  éditable lorsqu'elle existe, conservés dans le work item.

## 4. Exploitation préproduction

Les contrôles Compose locaux sont réussis et documentés dans
`docs/quality/ops-evidence-current.md`; ils ne remplacent pas une preuve
préproduction.

L'inspection versionnée du dépôt ne révèle aucun endpoint ou fichier de
configuration de préproduction. La procédure Dokploy documentée cible la
production et ne permet pas de déduire une preuve préproduction.

## 4. Exploitation préproduction
Confirmer l'environnement de préproduction, les seuils d'alerte, le canal de
notification, le responsable d'astreinte, le scénario de rollback applicatif
et la restauration complète testée.

- Décision partiellement validée : Docker local isolé retenu comme cible QA;
  une preuve préproduction réelle reste à produire avant clôture.
- Preuve attendue : rapport d'exécution daté, logs, résultat d'alerte,
  rollback et restauration.

## Effet sur les portes

Tant que ces décisions et preuves ne sont pas ajoutées, `design-gate` reste
`needs-review` et `audit-gate` reste `pending`. Le Coordinateur ne doit pas
les passer à `verified` par défaut.

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
| Médias MEDIA-001 à MEDIA-004 | confirmer l'usage des assets générés par IA déjà déclarés; MEDIA-005 reste soumis à la plateforme source | propriétaire de la marque |
| Préproduction | environnement Docker isolé; seuils d'alerte, canal, astreinte et scénario de rollback à nommer avant toute prétention de preuve préproduction | ops |

La validation est enregistrée; la prochaine action est la relecture
indépendante de la conception et des preuves P0. Aucun code, secret ou
déploiement de production n'est requis pour cette décision.
