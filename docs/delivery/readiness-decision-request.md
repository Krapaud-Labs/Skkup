---
last_updated: 2026-10-30
---

# Décisions requises pour l'approbation de la readiness

Statut des décisions : **baseline owner révisée le 18 octobre 2026**.
Cette décision confirme les orientations documentaires indiquées ci-dessous,
mais reste soumise aux owners spécialisés et à la validation Conformité; elle
ne constitue pas à elle seule une approbation de la conception ni de l'audit.

Ce document ne valide aucune porte. Il liste les décisions métier et
d'exploitation indispensables avant la relecture indépendante finale.

## État technique constaté

- Les sources existent déjà dans le dépôt : le cahier accepté, le règlement de
  travail (`docs/12-reglement-jeu-projet.md`), les politiques de confidentialité
  (`docs/13-politique-confidentialite.md` et `docs/15-politique-confidentialite.md`)
  et leurs fallbacks frontend. Le règlement de travail est explicitement un
  gabarit à compléter; la politique décrit une version produit, mais indique
  expressément que sa validation juridique n'est pas acquise. Ces références
  doivent être réutilisées; elles ne sont pas des pièces manquantes à redemander.
- La source de repli du règlement (`frontend/src/content/reglement.ts`, utilisée
  lorsque le contenu juridique administrable n'est pas fourni) indique trois
  ans après la dernière connexion pour le compte. La route peut afficher un
  contenu administrable différent; le contenu de production n'a pas été
  interrogé dans cette réconciliation.
- Cette même source de repli renseigne l'exploitant comme Mr PARIS Thomas,
  entreprise individuelle, RCS Draguignan `109176792`, le contact
  `Skkup.pro@gmail.com`, un âge minimum de 18 ans et un territoire limité à
  l'Union européenne. La date d'entrée en vigueur reste un marqueur à compléter
  (`[date à 00h00]`) et la page précise que la revue juridique reste à faire.
- Une source propriétaire retrouvée dans Drive, `Reglement_Skuup.docx`, modifiée
  le 23 septembre 2026, contient une identité et un contact renseignés, un âge
  minimum de 18 ans, le territoire UE, une conservation du compte pendant trois
  ans après la dernière connexion, des droits exercés par email et des règles
  de tirage. Son article 4 cible Twitch, Kick, YouTube Gaming et Facebook Live,
  alors que la décision owner MVP vise Twitch, YouTube et Kick et exclut
  Facebook. Sa date d'entrée en vigueur reste `[date à 00h00]`. Elle diverge
  aussi du choix owner « France au lancement » et des fallbacks de
  confidentialité. Le fichier suivi dans le dépôt sous
  `artifacts/Reglement_Skuup.docx` est un gabarit distinct, extrait le 27 août,
  avec 18 groupes de placeholders; ce n'est pas une copie de la révision Drive
  du 23 septembre. Aucun commentaire Drive ne figure sur cette dernière et son
  contenu ne porte pas de validation juriste ou Conformité: c'est une source
  utile, pas une preuve de sign-off.
- La France au lancement est une décision owner consignée dans
  [ADR-001](decision-log.md#journal-des-décisions) et reprise dans la vision
  produit; l'âge cible de 18 ans demeure sous validation juridique.
  Le règlement de repli affiche l'Union européenne, un périmètre plus large que
  la décision France. Le contenu du règlement ne modifie pas cette décision:
  l'alignement du territoire affiché et appliqué reste ouvert jusqu'à la mise
  en cohérence des textes produit et leur revue juridique.
- Le texte de repli de confidentialité (`frontend/src/components/legal/ConfidentialiteContent.tsx`)
  prévoit une conservation pendant l'utilisation du compte puis un délai
  raisonnable après fermeture, et une demande de droits par email. Il ne donne
  pas le même point de départ ni la même durée que le règlement. Le règlement
  de travail laisse également des champs de données personnelles à préciser;
  les politiques documentent déjà les catégories, finalités, bases annoncées,
  destinataires, droits et contact. La page marque elle aussi le contenu comme
  soumis à revue juridique humaine.
- L'API ne contient actuellement aucune route utilisateur d'export, de
  suppression ou d'anonymisation. Ces demandes restent donc manuelles; aucune
  fonctionnalité inexistante n'est présentée comme livrée.
- La cartographie technique ACT-03 est déjà consignée dans le
  [registre de traçabilité](../design/design-traceability-and-open-actions-2026-10-18.md#relevé-act-03---audit-data-2026-10-18).
  L'inventaire média ACT-09 existe dans
  [media-inventory.md](../design/media-inventory.md): l'usage des catégories
  MEDIA-001 à MEDIA-004 est autorisé par l'owner, tandis que la provenance,
  l'édition et les droits ne sont pas établis par fichier.
- Les propositions de rétention et de traitement restent à valider par les
  responsables compétents. L'API ne fournit pas de route d'export, de suppression
  ou de purge générale; aucune procédure absente n'est présentée comme livrée.
- Le propriétaire a déclaré porter ACT-03, ACT-09 et ACT-10, et pouvoir
  fournir les preuves avec le VPS; cette attribution est consignée dans
  [ADR-013](decision-log.md#journal-des-décisions). Elle ne prouve pas que le
  VPS est un environnement de préproduction ni que les preuves y sont déjà
  présentes ou exécutées.
- Le site présente son fallback de confidentialité comme une version publiée,
  datée du 23 septembre 2026, à vérifier juridiquement; le règlement annonce
  également une revue juridique avant publication officielle. Les routes
  `/confidentialite` et `/reglement` préfèrent un contenu API/CMS lorsqu'il
  existe. Le navigateur de cette session n'est pas accessible, la lecture web
  directe des pages a échoué, et un GET public en lecture seule vers
  `https://api.skkup.fr/content/LEGAL/politique-confidentialite?locale=fr` a
  échoué sur la résolution DNS (`api.skkup.fr`). Cela n'établit pas que le CMS
  ou son contenu sont absents; le contenu réellement servi et son historique
  de validation restent à vérifier sur une source autorisée.
- Une recherche web sur le numéro `109176792` n'a retourné aucun résultat du
  registre public officiel. Les mentions trouvées dans le code et les
  documents établissent ce qui est déclaré par le produit, pas la vérification
  officielle de l'immatriculation ni l'adresse postale.
- La vitrine charge le contenu juridique administrable `LEGAL/reglement` et
  `LEGAL/politique-confidentialite` lorsqu'il existe; le dépôt seul ne prouve
  pas quel contenu est actuellement servi en production. Aucune route ni source
  frontend CGU n'a été repérée; le gabarit de règlement contient des champs
  d'identité, d'adresse et de contact non remplis, tandis que le fallback local
  renseigne un nom, un numéro RCS et un email. Un CMS distant n'a pas été contrôlé.

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

## Baseline de travail et décisions à valider

Les valeurs suivantes sont une baseline de travail réversible, pas des règles
juridiques approuvées. Elles restent à confirmer par les responsables Produit,
Conformité ou Ops concernés avant implémentation d'une purge ou clôture ACT-03.

| Sujet | Proposition à valider | Responsable attendu |
| --- | --- | --- |
| User | conservation active puis purge/anonymisation après 3 ans sans connexion, alignée sur le règlement | produit/conformité |
| Session, Heartbeat, DeviceToken | purge 90 jours après expiration ou dernière activité | produit/conformité |
| PointLedger, Ticket, FraudSignal, AuditLog | conservation 3 ans minimum pour preuve et contestation, puis purge/anonymisation selon obligation légale | produit/conformité |
| Purge | job mensuel journalisé, revue trimestrielle, aucune suppression irréversible avant sauvegarde vérifiée | ops |
| Export/suppression | demande manuelle à `skkup.pro@gmail.com`, accusé sous 7 jours, traitement sous 30 jours, export JSON et suppression/anonymisation tracée | produit/conformité |
| ACT-09 Médias | inventorier par fichier/ressource provenance, usage réellement publié, brief/retouches et droits; l'accord owner sur les catégories MEDIA-001 à MEDIA-004 ne vaut pas preuve individuelle; MEDIA-005 reste soumis à chaque plateforme source | Design + Conformité |
| Opérations staging | critères de sauvegarde, alerting, astreinte, rollback et restauration suivis après MVP dans l'issue #422; non réalisés et hors des prérequis MVP-001 | suivi post-MVP #422 |

Les textes et décisions retrouvés réduisent les éléments manquants, mais ne
valent pas validation complète des exigences ACT-03/ACT-09. Aucune validation
juridique, Conformité ou Ops, ni preuve d'exécution de purge/export, n'est
établie par ce document. La suite est de résoudre les divergences de contenu,
compléter les décisions et preuves opérationnelles, puis faire la relecture
indépendante finale. Aucun code, secret ou déploiement de production n'est
requis pour consigner cette baseline.
