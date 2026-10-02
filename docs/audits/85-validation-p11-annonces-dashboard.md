# Validation P11

## Flux livré

L’administration crée une annonce via `POST /admin/announcements`. L’endpoint public `GET /announcements/active` filtre les annonces actives dans leur fenêtre de publication, limite la projection aux champs destinés au viewer et applique un tri déterministe. Le dashboard charge ensuite ces annonces et les affiche dans une section dédiée.

## États couverts

- chargement annoncé avec `role=status` ;
- liste vide explicitement annoncée ;
- erreur réseau annoncée avec `role=alert` ;
- contenu long conservé, avec retour à la ligne et rupture des mots sur mobile ;
- libellés d’interface en français ou anglais ;
- contenu libre affiché sans traduction automatique.

## Contrôles

Les tests backend vérifient le filtrage existant et le tri déterministe. Les tests frontend conservent le chargement du dashboard et couvrent le nouveau contrat via le mock de l’endpoint public. La validation finale de la CI et de la publication reste attachée à la Pull Request P11.
