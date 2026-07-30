# 10. Conformité juridique : jeu-concours et loterie publicitaire

Ce document identifie les points de conformité à valider avec un juriste
avant le lancement. Il ne constitue pas un conseil juridique définitif ; il
sert à cadrer les décisions techniques et fonctionnelles en attendant cette
validation.

## Qualification retenue

Le mécanisme choisi (points gagnés en regardant du contenu, convertis en
tickets de tirage au sort donnant accès à des lots réels) correspond en
France à un **jeu-concours ou loterie publicitaire**, encadré notamment par
les articles L.121-36 et suivants du Code de la consommation, à condition
qu'aucune contrepartie financière ou d'achat ne soit exigée du participant.
C'est le cas ici puisque les points s'obtiennent uniquement en regardant du
contenu, jamais en payant.

## Points à faire valider avant lancement

- Rédaction et dépôt d'un règlement de jeu précisant les modalités de
  participation, les dotations, les dates de tirage, l'âge minimum requis et
  les modalités de contact des gagnants.
- Vérification de la nécessité d'un dépôt du règlement auprès d'un huissier
  ou d'un organisme équivalent selon la valeur des lots.
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

## Prochaine étape

Faire valider ce document dans son intégralité par un juriste spécialisé en
droit du numérique et des jeux-concours avant toute ouverture publique du
site.
