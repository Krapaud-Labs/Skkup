# 10. Conformité juridique : jeu-concours et loterie publicitaire

Ce document identifie les points de conformité à valider avec un juriste
avant le lancement. Il ne constitue pas un conseil juridique définitif ; il
sert à cadrer les décisions techniques et fonctionnelles en attendant cette
validation.

## Qualification retenue

Le mécanisme choisi (points gagnés en regardant du contenu, puis tickets de
tirage au sort donnant accès à des lots réels) doit être qualifié en France au
regard du régime des **loteries publicitaires**, encadré par les articles
L. 121-1 et L. 121-20 du Code de la consommation. Une loterie publicitaire est
licite lorsqu'elle n'est pas déloyale. Skkup retient en plus une participation
gratuite et sans obligation d'achat : les points et tickets ne peuvent pas être
achetés avec de l'argent réel.

La qualification définitive et l'adéquation du fonctionnement concret restent
à valider par un juriste. Le projet de règlement correspondant est disponible
dans [12-reglement-jeu-projet.md](12-reglement-jeu-projet.md).

## Points à faire valider avant lancement

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
client, et non comme une mesure officielle du temps de visionnage Twitch ou
YouTube, afin d'éviter tout conflit avec les conditions d'utilisation de ces
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

## Prochaine étape

Compléter les mentions signalées dans le projet de règlement, harmoniser les
CGU, les mentions légales et la politique de confidentialité, puis faire
valider l'ensemble par un juriste spécialisé en droit du numérique et des
jeux-concours avant toute ouverture publique du site.
