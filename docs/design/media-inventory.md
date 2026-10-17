# Inventaire des médias

Chaque image, photo, illustration, vidéo, icône ou texture utilisée dans le produit doit être recensée avant livraison.

| ID | Fichier ou URL | Type | Auteur ou fournisseur | Licence et preuve | Date | Retouches | Usage | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MEDIA-001 | Logo et monogramme Skkup | marque | dépôt local, fichiers `frontend/public/` et extension | asset déclaré généré par IA pour le projet; décision produit enregistrée le 2026-10-07 | 2026-10-06 | aucune retouche externe; conserver la source éditable | identité de marque uniquement | inventorié, déclaration IA enregistrée |
| MEDIA-002 | Icônes de navigation et pictogrammes | icônes PNG/SVG | dépôt local `frontend/public/branding/` | assets déclarés générés par IA pour le projet; décision produit enregistrée le 2026-10-07 | 2026-10-07 | aucune retouche externe démontrée | navigation viewer/admin et états UI | inventorié, déclaration IA enregistrée |
| MEDIA-003 | Illustrations parcours vitrine | illustrations PNG | dépôt local `frontend/public/branding/marketing/` | assets déclarés générés par IA pour le projet; décision produit enregistrée le 2026-10-07 | 2026-10-07 | aucune retouche externe démontrée | étapes de la vitrine | inventorié, déclaration IA enregistrée |
| MEDIA-004 | Illustrations dashboard V3 | sprite/illustration PNG | dépôt local `frontend/public/branding/dashboard/` | assets déclarés générés par IA pour le projet; décision produit enregistrée le 2026-10-07 | 2026-10-07 | utilisé en sprite CSS; aucune retouche externe démontrée | récompenses et métriques | inventorié, déclaration IA enregistrée |
| MEDIA-005 | Miniatures de streams | images distantes de plateformes | URLs retournées par les contrats streams, notamment CDN Twitch | dépend de la plateforme et de la ressource; aucune licence Skkup générale démontrée | 2026-10-07 | aucune copie locale | aperçu de stream | usage conditionné aux règles de la plateforme et à la ressource publiée |

## Règles

- Pour les assets générés par IA, conserver la déclaration de génération et le brief ou la décision produit associés; ne pas inventer une licence de fournisseur.
- Conserver l'URL, la date de consultation et les obligations d'attribution.
- Documenter le brief et les retouches d'une image générée.
- Ne pas retirer de filigrane, scraper ou présenter un visuel temporaire comme final.
- Contrôler réalisme, artefacts, texte illisible, visages, mains, logos et conformité au produit.

## Preuve requise avant approbation

Pour MEDIA-001 à MEDIA-004, la preuve attendue est la déclaration produit de
génération par IA, le brief ou la décision associée, et la conservation des
sources éditables lorsqu'elles existent. Pour MEDIA-005, le propriétaire doit
documenter la base d'utilisation des miniatures fournies par la plateforme et
les conditions applicables. L'auditeur vérifiera ensuite que chaque média publié
est couvert par une entrée de ce tableau et qu'aucun visuel externe n'est utilisé
sans preuve d'autorisation.

## Provenance technique

Les fichiers locaux ont été introduits ou intégrés par les commits `ddf198b`
(icônes de navigation), `da292ea` (illustrations de récompense) et `cb945c7`
(parcours vitrine). Les audits locaux
`docs/audits/dashboard-v3-assets-accessibility-2026-10-03.md` et
`docs/audits/dashboard-v3-assets-motion-audit-2026-10-05.md` complètent
l'inventaire des fichiers et de leurs usages. La déclaration utilisateur du
2026-10-07 établit que MEDIA-001 à MEDIA-004 ont été générés par IA; elle ne
constitue pas une déclaration concernant les miniatures distantes MEDIA-005.
---
last_updated: 2026-10-07
---
