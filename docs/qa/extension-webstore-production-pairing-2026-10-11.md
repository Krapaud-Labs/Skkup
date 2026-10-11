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

## Limites restantes

Cette preuve ferme le parcours nominal production, la révocation et le
renouvellement après révocation. Elle ne prouve pas encore l’expiration
naturelle observée dans le popup publié, la reconnexion après expiration ni la
persistance après fermeture complète du navigateur. Ces sous-points restent
`NEEDS-REVIEW` et ne sont pas simulés.

## Sécurité et reproductibilité

Le code temporaire n’est ni commité ni ajouté à un commentaire public. La
preuve repose sur les états visibles du dashboard et du popup, l’identifiant
public de l’extension et le compte de test utilisé.
