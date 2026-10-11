# Limite de preuve Chrome Web Store

Date: 2026-10-11

## Observation

La fiche publique SKKUP est ouverte dans le profil Chrome connecté à la session
de recette. L'outil navigateur renvoie explicitement : « The extensions gallery
cannot be scripted. »

## Conséquence

La présence de la fiche publique est observable, mais l'installation, la saisie
du code et la persistance de l'association depuis le paquet publié ne peuvent
pas être automatisées ni déclarées vérifiées avec cette session. Les preuves
Docker locales restent valides et distinctes de cette preuve externe.

## Prochaine action

Effectuer une association manuelle dans un profil Chrome de recette autorisé,
puis archiver les quatre états : code généré, code accepté, extension associée
et association persistante. Aucun résultat n'est simulé en attendant cette
preuve.
