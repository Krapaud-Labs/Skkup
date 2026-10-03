# Rapport QA design fidelity DASH-V3

Date : 3 octobre 2026  
Rôle : spécialiste QA design fidelity  
Périmètre : références `docs/design/skkup-dashboard-references/`, routes frontend et captures versionnées dans `docs/design/evidence/`.

## Verdict

**Bloqué : la conformité visuelle et fonctionnelle DASH-V3 n'est pas démontrée.**

La comparaison des deux écrans principaux montre un écart structurel, pas un simple écart de finition :

- la référence viewer est un cockpit bleu nuit dense avec stream illustré, extension, cartes à gratter, tirages et activité récente ; le rendu courant est un prototype violet beaucoup plus vide, sans média ni extension et avec plusieurs textes en anglais ;
- la référence admin est un cockpit opérationnel avec barre d'environnement, tableaux illustrés, lots, annonces, signalements et journal ; le rendu courant est une page violette longue avec formulaires et sections historiques, sans la composition ni la densité de la référence ;
- les captures actuelles sont des preuves de branche locale/e2e, pas une preuve du déploiement `dev` ;
- aucune preuve indépendante écran par écran n'établit encore les actions, états, permissions et responsive des routes secondaires.

La carte ne doit pas être clôturée.

## Sources et limites de preuve

| Source | Ce qu'elle prouve | Limite |
|---|---|---|
| `skkup-dashboard-references/*.png` | cible visuelle et contenu attendu | ne prouve pas l'implémentation |
| `evidence/dashboard-viewer-1280.png` | rendu local capturé du viewer | rendu différent de la cible ; desktop seulement pour cette comparaison |
| `evidence/dashboard-admin-1280.png` | rendu local capturé de l'admin | rendu différent de la cible ; desktop seulement pour cette comparaison |
| `dashboard-v3-gap-audit-2026-10-03.md` | audit historique des écarts | ne remplace pas une revue navigateur actuelle |
| code `frontend/src/app/**` et `frontend/src/components/**` | routes et composants présents | présence du code ne prouve ni fidélité ni action fonctionnelle |
| `dashboard-redesign-2.0.md` | architecture et états attendus | document de conception, pas preuve runtime |

La tentative de charger le skill BrowserAct a échoué avant ouverture de navigateur à cause d'une permission d'écriture sur `/Users/krapaud/Library/Application Support/browseract/logs`. Aucune validation navigateur live n'est donc déclarée dans ce rapport.

## Légende

- **P0 bloquant** : la structure ou une fonction essentielle de la maquette manque ; interdit la clôture.
- **P1 majeur** : parcours présent ou partiel mais non conforme, non prouvé ou visuellement très différent.
- **P2** : finition, cohérence ou preuve à compléter après les P0/P1.

## Matrice principale

| Écran cible | Route attendue | Écarts observés | Sévérité | Preuves à collecter |
|---|---|---|---|---|
| Viewer principal | `/dashboard` | La maquette exige sidebar avec icônes, trois KPI illustrés, visionnage avec image et plateformes, extension connectée, notification de gain, cartes à gratter illustrées, prochains lots et activité récente. La capture courante montre un hero générique, KPI texte, annonces, loterie vide, cartes/historique/tickets vides ; pas de stream, extension, lot ni activité équivalents. | **P0** | Capture live 1280 comparée à la référence avec grille d'annotations ; données fixture non vide ; clic de chaque CTA ; capture 768/320 ; preuve de loading/vide/erreur/succès. |
| Viewer streams | `/dashboard/streams` | La référence détaillée attend catalogue visuel, recherche, filtres plateformes, favoris, pagination et CTA extension. Le composant `ListeStreams` existe, mais sa présence ne prouve pas médias, états ni alignement de densité. | **P1** | Parcours live recherche, filtre, favori, pagination, ouverture stream et extension ; captures 1280/768/320 ; états API. |
| Viewer tirages | `/dashboard/tirages` | La référence attend cartes de tirage, lot illustré, compte à rebours, ticket/coût, participation et résultat. La route existe via `ListeTirages`, mais aucune preuve d'alignement des cartes, visuels et états de participation. | **P1** | Tirage ouvert, fermé, déjà inscrit, sans ticket, erreur API et résultat ; preuve que les CTA écrivent réellement côté API. |
| Viewer récompenses | `/dashboard/recompenses` | La référence attend cartes à gratter illustrées avec disponible/verrouillée, progression, coût, gain et interaction de grattage. Le composant `CentreRecompenses` existe, mais la capture principale ne rend aucune carte et la fidélité des visuels n'est pas prouvée. | **P0** | Capture de chaque état de carte ; interaction gratter ; solde/ticket mis à jour ; erreur et double clic ; comparaison des images/icônes. |
| Viewer historique | `/dashboard/historique` | La référence attend historique de visionnage et points avec plateformes, gains, filtres et pagination. Le composant `HistoriquePointsViewer` existe ; le dashboard principal affiche seulement un état vide et aucune preuve de l'écran détaillé. | **P1** | Jeu de données non vide ; filtres/pagination ; historique vide/erreur ; cohérence des totaux avec API ; desktop/mobile. |
| Viewer extension | `/dashboard/extension` | La référence attend installation, navigateur, état connecté, appariement, appareils et reprise en cas d'expiration. `CodeAppariement` existe mais le parcours complet n'est pas prouvé. | **P0** | Installation, code valide, code expiré, code invalide, appareil connecté/déconnecté, suppression et reprise ; capture des états et test mobile. |
| Viewer compte / aide | `/dashboard/compte`, `/dashboard/reglement`, `/faq` | La cible inclut compte, règles et aide dans la navigation et exige états permission/session. La matrice complète des actions et du retour vers le shell n'est pas fournie. | **P1** | Navigation clavier, session expirée, profil, déconnexion, règlement/FAQ, liens retour et capture mobile. |
| Admin principal | `/admin` | La maquette exige barre d'environnement, topbar, KPI illustrés, tableaux Tirages/Lots, annonces/contenus, signalements et journal d'audit. Le code actuel rend KPI et quelques liens, puis un tableau générique opérations/audit. La capture courante montre au contraire un prototype violet avec formulaires, sponsors et sections longues. | **P0** | Capture live 1280 annotée sur chaque zone de la référence ; données non vides pour 4 KPI et 5 lignes de tableaux ; liens opérationnels ; comparaison 768/320. |
| Admin tirage | `/admin/raffles` | La référence attend pilotage détaillé d'un tirage : statut, participants, lot, tirage cryptographique, confirmation et résultat. La route existe mais la correspondance visuelle/actionnelle n'est pas prouvée. | **P0** | Ouvrir, modifier, fermer/exécuter selon permission, confirmation, hash/preuve, résultat, erreur et audit ; desktop/mobile. |
| Admin lots | `/admin/lots` | La référence attend inventaire illustré, stock disponible/faible/rupture, fournisseur, édition et actions contextuelles. Existence de la route non suffisante ; visuels et statuts doivent être comparés. | **P1** | CRUD lot, image, stock 0/faible/disponible, validation, suppression protégée, confirmation et audit. |
| Admin annonces et contenus | `/admin/announcements`, `/admin/content` | La référence attend listes illustrées, édition, publication, planification, archivage et historique de versions. Le rendu capture un éditeur prototype et des formulaires ; la séparation et les actions de la référence ne sont pas prouvées. | **P0** | Créer/brouillon, prévisualiser, publier, planifier, archiver, restaurer/versionner ; permissions ; erreurs ; capture des listes et détails. |
| Admin signalements / utilisateurs | `/admin/moderation`, `/admin/users` | La référence attend dossiers de modération, priorité, contexte utilisateur, décision, suspension et historique. Le code expose des routes mais aucune preuve de dossier complet ni de protection par permission. | **P0** | Ouvrir signalement, examiner contexte, traiter/ignorer, suspendre selon rôle, confirmation, audit, accès refusé et données masquées. |
| Admin audit | `/admin/audit` | La référence attend une timeline lisible avec acteur, heure, objet et résultat. La capture montre un bloc journal différent et partiel. | **P1** | Filtres, détail événement, pagination, lien depuis chaque action mutante, état vide/erreur et mobile sans perte de contexte. |
| Shell commun / navigation | layouts viewer/admin | La référence utilise des shells distincts mais cohérents, icônes visibles, actif clair et navigation compacte. La capture viewer/admin ne partage pas le langage visuel de la cible et contient des textes/labels de prototype. | **P0** | Parcours complet des liens, état actif, retour, clavier, focus, mobile, session expirée, permission refusée, aucun lien mort. |

## Contrôles transverses bloquants

| Contrôle | État actuel | Preuve exigée |
|---|---|---|
| Fidélité visuelle | **Non conforme sur les deux principaux** | superposition ou grille d'annotation référence/rendu à 1280, 768 et 320 pour chaque écran |
| Contenu et langue | **Écart visible** : la capture viewer contient plusieurs libellés anglais alors que la maquette est française | inventaire des libellés, capture FR et contrôle i18n |
| Médias et icônes | **Non démontré** ; la cible contient des visuels de stream, lots, cartes, navigateur et icônes dédiées | inventaire asset -> écran -> composant, absence de placeholder non prévu |
| Fonctionnalités | **Non démontré** ; les routes existent mais les actions réelles ne sont pas toutes tracées | matrice CTA -> endpoint -> résultat -> audit |
| États | **Partiel** ; le code prévoit certains états mais aucune preuve écran par écran | loading, vide contextualisé, erreur récupérable, permission, succès et session expirée par route |
| Responsive | **Non démontré** pour les routes secondaires et le rendu de référence | captures et parcours 320/768/1280, sans débordement ni perte d'action |
| Accessibilité visuelle | **Non démontré** au niveau maquette finale | contraste surfaces/texte/focus, ordre clavier, nom accessible des icônes, réduction mouvement |
| Déploiement | **Non démontré dans cette revue** | URL `dev`, commit exact, captures live et logs de version |

## Definition of Done QA design fidelity

La validation QA ne pourra être donnée que lorsque les preuves suivantes seront attachées à la carte :

1. Une matrice remplie pour chaque ligne ci-dessus, avec URL, commit et capture.
2. Une comparaison visuelle aux trois largeurs pour les 2 écrans principaux et chaque écran secondaire.
3. Un parcours manuel réussi pour chaque CTA, avec endpoint ou changement d'état vérifiable.
4. Les assets et icônes de la référence reliés à un fichier source et utilisés dans le rendu.
5. Les états loading, vide, erreur, permission, succès et session expirée prouvés par écran.
6. Une vérification admin par rôle, incluant refus d'accès et traçabilité des actions sensibles.
7. Une preuve de déploiement sur `dev` après fusion propre, puis relecture de l'URL déployée.
8. Une revue finale sans écart P0/P1. Toute divergence de structure, contenu clé, action ou densité reste bloquante même si les tests automatisés sont verts.

## Décision QA

**Ne pas approuver la Definition of Done et ne pas clôturer DASH-V3.** Les captures disponibles démontrent une baseline de prototype, pas la réalisation des maquettes de référence.
