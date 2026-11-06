---
last_updated: 2026-11-06
---

# 10. Conformité juridique : jeu-concours et loterie publicitaire

Ce document recense les sujets de conformité et les points à suivre. Il ne
constitue pas un conseil juridique définitif. Par décision du propriétaire du
2026-11-03, le MVP démarrera sans revue par avocat ou juriste; le propriétaire
envisage de faire vérifier le règlement si le site prend de l'ampleur. Cette
décision de calendrier ne vaut ni avis ni validation juridique.

## Qualification retenue

Le mécanisme choisi (points gagnés en regardant du contenu, puis tickets de
tirage au sort donnant accès à des lots réels) doit être qualifié en France au
regard du régime des **loteries publicitaires**, encadré par les articles
L. 121-1 et L. 121-20 du Code de la consommation. Une loterie publicitaire est
licite lorsqu'elle n'est pas déloyale. Skkup retient en plus une participation
gratuite et sans obligation d'achat : les points et tickets ne peuvent pas être
achetés avec de l'argent réel.

La qualification définitive et l'adéquation du fonctionnement concret n'ont
pas fait l'objet d'une validation juridique externe. Le projet de règlement
correspondant est disponible dans
[12-reglement-jeu-projet.md](12-reglement-jeu-projet.md). La revue juridique
est un suivi envisagé si le site prend de l'ampleur, pas une porte de lancement
du MVP selon la décision du propriétaire.

## Points à suivre, à réexaminer si le site prend de l'ampleur

- Finalisation et publication du règlement de jeu précisant les modalités de
  participation, les dotations, les dates de tirage, l'âge minimum requis et
  les modalités de contact des gagnants.
- Décision documentée sur l'intérêt d'un dépôt volontaire auprès d'un
  commissaire de justice ou d'un contrôle indépendant. Les anciennes
  dispositions imposant systématiquement le dépôt ont été abrogées ; ce dépôt
  ne doit donc pas être présenté comme une obligation légale automatique.
- Transparence du tirage : algorithme et graine aléatoire journalisés et
  consultables, pour permettre un audit indépendant en cas de contestation
  (voir [05-security.md](05-security.md)).
- Gestion fiscale et logistique des lots (achat ou partenariats fournisseurs,
  livraison, éventuelle déclaration fiscale selon la valeur des dotations).
- Politique de confidentialité et mentions légales couvrant la collecte de
  données à des fins anti-fraude (empreinte d'appareil, IP), conformément au
  RGPD.
- Conditions générales d'utilisation précisant explicitement l'absence de
  cash-out et la nature des points (aucune valeur monétaire, non
  transférables, non remboursables).

## Risque à surveiller

Le mécanisme de crédit de points via visionnage de streams externes doit
rester présenté comme une récompense pour le temps passé sur le site du
client, et non comme une mesure officielle du temps de visionnage Twitch,
YouTube ou Kick, afin d'éviter tout conflit avec les conditions d'utilisation de ces
plateformes concernant la manipulation de métriques d'engagement (voir
[02-architecture.md](02-architecture.md)).

## Références officielles vérifiées

- [Code de la consommation, articles L. 121-1 et
  L. 121-20](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000032227242),
  version en vigueur consultée le 27 août 2026 ;
- [DGCCRF, « Loterie : des pratiques commerciales
  réglementées »](https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/loterie-des-pratiques-commerciales-reglementees),
  mise à jour le 11 mars 2026 ;
- [CNIL, « Organisation de jeux-concours : que
  faire ? »](https://www.cnil.fr/fr/cnil-direct/question/organisation-de-jeux-concours-que-faire).

## Suivi décidé par le propriétaire

Le propriétaire prévoit de faire vérifier le règlement si le site prend de
l'ampleur. Les points ci-dessus restent des sujets à suivre; aucune validation
juridique externe n'est déclarée obtenue et cette décision ne constitue pas une
confirmation de conformité.
