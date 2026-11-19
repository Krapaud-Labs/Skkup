---
last_updated: 2026-11-19
---

# Décisions requises pour l'approbation de la readiness

> Mise à jour du 19 novembre 2026 : le propriétaire a demandé au Coordinateur
> de retenir des choix cohérents et prudents afin de réduire les arbitrages
> manuels. Les règles produit proposées ci-dessous sont la baseline de travail
> mandatée; elles ne constituent pas une consultation juridique, une validation
> Conformité, ni l'approbation du gate global. Les règles touchant aux jeux de
> hasard, aux données personnelles et aux droits doivent être contrôlées par
> les rôles compétents avant publication ou activation.

Statut des décisions : **baseline documentaire du 18 octobre, réconciliée le
19 novembre 2026 avec les arbitrages produit prudents mandatés**. Les
propositions restent soumises aux owners spécialisés; elles ne constituent pas
à elles seules une approbation de la conception, de l'audit ou une validation
juridique.

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

- Décision prudente : ne pas appliquer de durée uniforme ni de durées
  inventées. Aucun nouveau délai n'est fixé tant que le responsable de
  traitement n'a pas validé la matrice par finalité et catégorie.
- Preuve attendue : durée par catégorie, base de conservation, procédure de
  purge et test de vérification.

## 2. Export et suppression

Confirmer le parcours utilisateur, les données exportées, le format, le délai
de traitement, les exceptions légales et la procédure de suppression ou
d'anonymisation. Le parcours actuel est manuel par email; une route API ne
doit être ajoutée qu'après validation du contrat et des permissions.

- Décision prudente : conserver le canal manuel publié; répondre aux demandes
  de droits dans le délai RGPD d'un mois, avec prolongation possible de deux
  mois pour complexité ou nombre de demandes si la personne est informée dans
  le premier mois. Ne pas promettre un format JSON ou un parcours automatisé
  qui n'existe pas encore.
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
| Toutes catégories de données | finalité, base, durée utile, accès, exceptions et effacement définis séparément; les 3 ans du compte restent limités à la règle déjà publiée et ne sont pas extrapolés | responsable de traitement / conformité |
| Session, Heartbeat, DeviceToken | supprimer ou agréger dès qu'ils ne sont plus nécessaires à la validation, à la sécurité ou à la lutte contre la fraude; durée exacte à établir à partir des besoins prouvés | produit / backend / conformité |
| PointLedger, Ticket, FraudSignal, AuditLog | définir des durées distinctes selon preuve, contestation, obligations comptables et minimisation; aucune conservation « minimum 3 ans » généralisée | responsable de traitement / conformité |
| Purge | automatisation seulement après validation de la matrice, avec journalisation, contrôle d'accès et restauration conforme aux obligations retenues | ops / conformité |
| Export/suppression | canal manuel actuellement publié à `skkup.pro@gmail.com`; délai RGPD d'un mois, prolongation maximale de deux mois en cas de complexité ou de nombre de demandes avec information dans le premier mois; vérifier l'identité seulement si nécessaire et tracer les exceptions/exécutions | responsable de traitement / conformité |
| ACT-09 Médias | inventorier par fichier/ressource provenance, usage réellement publié, brief/retouches et droits; l'accord owner sur les catégories MEDIA-001 à MEDIA-004 ne vaut pas preuve individuelle; MEDIA-005 reste soumis à chaque plateforme source | Design + Conformité |
| Opérations staging | critères de sauvegarde, alerting, astreinte, rollback et restauration suivis après MVP dans l'issue #422; non réalisés et hors des prérequis MVP-001 | suivi post-MVP #422 |

Les orientations produit partielles consignées dans cette baseline ne valent
pas validation complète des exigences ACT-03/ACT-09. Aucune validation
Conformité ou ops, ni preuve d'exécution, n'est établie par ce document. La
prochaine action est la relecture indépendante de la conception et des preuves
P0. Aucun code, secret ou déploiement de production n'est requis pour consigner
cette baseline.

## 5. Baseline produit prudente pour les points, tickets et tirages

Décision de travail mandatée le 19 novembre 2026 pour remplacer les options
encore ouvertes d'US-009. Cette baseline privilégie la gratuité et sépare
strictement la boutique des mécanismes de hasard.

- Les points sont gagnés par le visionnage éligible. Ils ne sont ni achetables,
  ni transférables, ni convertibles en argent ou en valeur remboursable.
- La boutique peut vendre contre des points uniquement des récompenses
  garanties et décrites avant confirmation. Le prix est configuré par article;
  l'achat débite les points immédiatement et le contenu numérique reste
  consultable dans « Mes achats ». L'email peut être ajouté plus tard.
- La boutique ne vend pas de ticket de tirage, de participation ou de chance
  supplémentaire. L'ancienne option de ticket de tirage payable en points est
  suspendue tant qu'une revue juridique n'a pas confirmé qu'elle est licite.
- **Choix de lancement : aucun tirage au sort ni jeu à gratter n'est activé
  publiquement avant validation juridique écrite du mécanisme et du règlement.**
  Si cette validation autorise le modèle gratuit proposé, celui-ci limite la
  participation à une par compte et par opération, sans achat, dépense de
  points, abonnement payant ni visionnage obligatoire. Aucune participation
  supplémentaire ni conversion de points en chance.
- Les cartes à gratter de hasard restent désactivées avec les tirages tant que
  la validation juridique écrite n'est pas obtenue. Elles ne sont ni vendues
  contre des points ni présentées comme une récompense garantie.
- Le seuil d'âge de 18 ans reste une règle produit provisoire, pas une preuve
  de licéité ni une substitution à la revue juridique. Chaque opération
  affiche avant participation son organisateur, ses dates et fuseau, son lot et
  sa quantité, ses critères, sa méthode de sélection, ses modalités de remise,
  son échéance de réclamation et son contact support.
- L'âge est attesté à l'inscription et rappelé avant la participation. Ne pas
  collecter de pièce d'identité par défaut; toute vérification plus intrusive
  exige une analyse de nécessité, de proportionnalité et de conservation.
- La liste des participants est figée avant le tirage. Le tirage manuel utilise
  une sélection aléatoire sûre, produit une preuve d'audit et bloque la
  publication en cas d'anomalie. La configuration et les conditions publiées
  sont conservées avec le résultat.

Sous réserve des exceptions prévues par la loi, l'article L. 320-1 du Code de la
sécurité intérieure vise notamment les opérations offertes au public faisant
espérer un gain dû, même partiellement, au hasard et exigeant un sacrifice
financier. La qualification des points gagnés par visionnage et des cartes à
gratter dépend des faits et du fonctionnement réel; cette baseline réduit le
risque en supprimant toute dépense et toute conversion de points en chances,
mais ne conclut pas à elle seule à la licéité du mécanisme. Référence :
[Code de la sécurité intérieure, article L. 320-1](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000039182525).
Les communications promotionnelles et la remise effective des lots doivent
rester loyales au sens du [Code de la consommation, articles L. 121-1 et
suivants](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032227301).

## 6. Lots et contenus administrés (US-010)

- Toute création commence en brouillon. Seul un administrateur habilité peut
  publier explicitement; aucune création ne passe en ligne implicitement.
- Avant toute publication publique d'un lot attribué par hasard, la validation
  juridique écrite du mécanisme et du règlement est obligatoire; jusque-là, le
  lot reste en brouillon/non visible. Après validation, les champs obligatoires
  sont : titre, description
  complète, quantité, valeur estimée documentée, dates et fuseau, éligibilité,
  règle de participation, modalités et échéance de remise, contact support,
  visuel et preuve de droits d'utilisation.
- Une publication crée un instantané des conditions présentées aux participants.
  Les changements matériels exigent une nouvelle version et une information
  visible; ils ne modifient jamais rétroactivement une participation ou un
  résultat.
- Cycle proposé : `DRAFT` → `PUBLISHED` → `CLOSED` → `DRAWN` → `ARCHIVED`.
  La fermeture fige les participants; `DRAWN` requiert le résultat et sa preuve
  d'audit. Toute transition est attribuée à l'administrateur et journalisée.
- Les contenus éditoriaux suivent `DRAFT` → publication explicite → archivage,
  avec historique des versions et validation des médias avant diffusion.

## 7. Notification, réclamation et publication du résultat (US-011)

- Le délai maximal de sept jours court à partir de la validation et de la
  journalisation du résultat du tirage. Le gagnant est contacté individuellement
  par le canal transactionnel du compte; cette adresse n'est pas utilisée pour
  le marketing.
- Le support accuse réception et répond dans le délai annoncé de quatorze jours
  à partir de la réception de la demande. La réclamation est traitée en privé,
  avec le tirage concerné et une référence de participation.
- Aucun pseudo, nom, adresse ou image du gagnant n'est publié par défaut. La
  preuve publique porte sur l'identifiant de l'opération et la méthode/résultat
  contrôlable, sans identifiant de compte. Une publication volontaire d'un
  pseudo exige un choix distinct, facultatif et révocable avant publication.
  Un pseudo reste une donnée personnelle s'il permet une réidentification; le
  document ne doit donc pas l'appeler « anonymisation ».
- Le consentement à la prospection est séparé de la participation et ne peut
  conditionner l'accès au tirage.

Références : [RGPD, notamment articles 5 et 6](https://eur-lex.europa.eu/legal-content/FR/ALL/?uri=uriserv%3AOJ.L_.2016.119.01.0001.01.ENG) et [CNIL, identifier les données personnelles](https://www.cnil.fr/fr/identifier-les-donnees-personnelles). La fiche CNIL sur les jeux-concours rappelle la séparation entre données nécessaires au jeu et prospection; elle date de 2016 et doit être relue à la lumière des textes et recommandations en vigueur avant usage : [fiche CNIL](https://www.cnil.fr/sites/default/files/atoms/files/commerce-donnees_perso_parrainage_jeux_concours.pdf).

## 8. Données, durées et validation juridique

- Ne pas étendre la règle « trois ans après dernière connexion » à toutes les
  catégories. Une durée uniforme pour heartbeat, sessions, jetons, ledger,
  participations, preuve de tirage et support serait arbitraire.
- Le responsable de traitement établit une matrice par finalité : données
  minimales, base légale, personnes autorisées, durée utile, exception de
  conservation et méthode d'effacement/anonymisation. Les données de session et
  de heartbeat sont supprimées ou agrégées dès qu'elles ne servent plus à la
  validation et à la lutte contre la fraude; les preuves de remise et
  d'obligations comptables suivent séparément la durée légale applicable.
- Les demandes d'accès, export, rectification ou suppression restent traitées
  par le canal manuel actuellement publié, avec vérification de l'identité,
  traçabilité et réponse dans les délais RGPD. Aucun délai de 30 jours ni format
  JSON n'est présenté comme une règle choisie par la loi dans ce document.
- Les comptes inactifs font l'objet d'une information et d'une revue avant toute
  désactivation ou purge; le repère CNIL de deux ans pour certains services
  numériques est une recommandation sectorielle, pas une durée universelle.
- Avant activation publique des participations aléatoires, un juriste valide la
  qualification du mécanisme, le règlement, l'âge, les modalités, la fiscalité
  des lots et le traitement des réclamations. Le DPO/owner données valide les
  finalités, bases légales, notices et durées. L'owner média conserve les
  autorisations par ressource.

Le RGPD impose notamment limitation des finalités, minimisation et limitation
de conservation; il ne donne pas une durée universelle pour ces catégories.
Références : [RGPD, articles 5 et 12](https://eur-lex.europa.eu/eli/reg/2016/679/oj/fra), [CNIL, fixer une durée de conservation](https://www.cnil.fr/fr/cnil-direct/question/dois-je-fixer-une-duree-de-conservation-des-donnees-dans-mon-fichier) et [CNIL, comptes inactifs de certains services numériques](https://www.cnil.fr/fr/achat-de-contenus-numeriques-quelle-duree-de-conservation-des-comptes-inactifs).

## Portée et état

Ces choix réduisent les ambiguïtés de produit pour US-009..011 et constituent
la baseline à spécifier et implémenter. Ils ne changent pas le statut global
`Status: review`, ne ferment pas ACT-03, ACT-09 ou ACT-13 et ne déclarent pas le
règlement juridiquement validé. Il reste une validation juridique ciblée avant
publication/activation des mécanismes de hasard, une validation Data/Conformité
de la matrice de conservation, les preuves d'implémentation/QA, et la décision
ACT-13 par une personne habilitée après revue indépendante.

La relecture indépendante documentaire du 19 novembre 2026 est `PASS` limité à
la cohérence des décisions, des parcours et de leurs limites. Elle n'est ni un
avis juridique ni une validation de conformité; les gates et validations
spécialisées restent ouverts.
