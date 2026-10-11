# Pairing production de l’extension Chrome Web Store

Date : 2026-10-11  
Carte : DASH-V3  
Branche de développement : `chore/dash-v3-final-design-1-16-30`

## Périmètre

Contrôle navigateur du paquet Chrome Web Store publié, avec un compte de test
autorisé sur `https://skkup.fr/dashboard/extension`.

Extension observée :

- identifiant Chrome : `ajececidgjfpacommefhibbcfoakopil` ;
- popup rendue depuis `chrome-extension://ajececidgjfpacommefhibbcfoakopil/popup.html` ;
- compte de test : `qa-admin-stg-20261010` ;
- origine du dashboard : `https://skkup.fr`.

## Preuves observées

1. Le dashboard production a généré un code temporaire valide cinq minutes.
   La valeur du code n’est pas enregistrée dans le dépôt.
2. Le popup de l’extension publiée a accepté ce code sans erreur.
3. Le popup a affiché `Suivi actif`, le pseudo du compte et `Compte associé`.
4. Après fermeture du popup, le dashboard a été rechargé et a affiché un
   appareil associé actif.
5. La révocation a été déclenchée depuis le dashboard production.
6. Après la révocation, le dashboard a affiché `Aucun appareil associé`.
7. Un nouveau code production a ensuite réassocié l’extension publiée après
   dissociation de son jeton local.
8. Après rechargement du dashboard, le nouvel appareil est affiché `actif` et
   l’ancien appareil reste visible `révoqué`.
9. Après expiration naturelle d’un code non utilisé, le popup publié a refusé
   sa soumission avec `Code d’appariement invalide, expiré ou déjà utilisé`.
10. Après fermeture complète de Chrome puis réouverture, le dashboard a
    retrouvé les appareils associés et le popup publié a affiché `Suivi actif`
    pour `qa-admin-stg-20261010`.

## Limites restantes

Cette preuve ferme le parcours nominal production, la révocation, le
renouvellement après révocation, l’expiration naturelle observée dans le popup
publié et la persistance après fermeture complète de Chrome. Elle ne prouve
pas une reconnexion silencieuse d’une session déjà expirée, qui n’est pas le
comportement attendu : le dépôt efface un appariement expiré avant nouvel appel
(`extension/src/commun/stockage-jeton.ts`) et suspend le suivi sur refus 401
(`extension/src/arriere-plan/orchestrateur.ts`). Le renouvellement passe donc
par un nouveau pairing explicite. Ce comportement est couvert par les tests
unitaires du dépôt et ne constitue pas une reconnexion automatique à valider.

## Sécurité et reproductibilité

Le code temporaire n’est ni commité ni ajouté à un commentaire public. La
preuve repose sur les états visibles du dashboard et du popup, l’identifiant
public de l’extension et le compte de test utilisé.
