# Suppression du bloc streams du dashboard viewer

## Objectif

Retirer le bloc « Temps de visionnage » redondant de la page principale du
dashboard. Le catalogue reste accessible dans la navigation latérale et sur sa
page dédiée.

## Definition of Done

- aucun rendu du bloc streams sur le dashboard principal
- aucun appel `listerStreams` depuis ce dashboard
- la carte Extension reste visible et sans débordement
- les tests dashboard et la documentation sont à jour
- livraison par PR vers `dev`

## Limite de validation visuelle

Les tests responsive locaux couvrent les scénarios déclarés. Le navigateur
automatisé n'a pas pu démarrer car son CLI ne peut pas créer son dossier de
logs utilisateur dans l'environnement courant.
