---
last_updated: 2026-10-30
---

# Index documentaire Skkup

## Où trouver la source de vérité

- **État de conception et gate globale** : [design-readiness](design/design-readiness.md). `Status: review` signifie que la conception n'est pas approuvée.
- **Stories produit et critères acceptés** : [user stories](product/user-stories.md). US-008 couvre le cycle owner accepté `DRAFT`/`PUBLISHED`/`ARCHIVED`; son implémentation et son E2E ciblé sont documentés, tandis que le statut `needs-review` attend la revue finale MVP.
- **Roadmap et architecture cible des dashboards** : [plan de livraison](delivery/roadmap.md) et [conception DASH-V3](design/dashboard-redesign-2.0.md), avec le delta de portée Viewer Streams daté du 30 octobre 2026.
- **Obligations ACT, responsables et preuves attendues** : [registre de traçabilité](design/design-traceability-and-open-actions-2026-10-18.md), avec les responsables connus et les vérificateurs/échéances encore ouverts.
- **Preuves QA par story** : [matrice P0](quality/p0-evidence-matrix.md), avec résultats datés, logs et specs hachés, SHA source lorsqu’il est disponible et limites de portée; US-004 couvre le plafond de 65 points et deux requêtes parallèles (sans chevauchement transactionnel imposé); US-006 couvre le tirage/CSPRNG ciblé et la course inscription/clôture (3/3 tests), sans preuve d'idempotence exhaustive, worker CSPRNG déployé ou snapshot immuable.

Les logs bruts Docker de cette campagne conservent les espaces de fin émis par
Compose. Le contrôle Git des espaces est désactivé uniquement pour ces deux
fichiers d'évidence afin de préserver leurs octets d'origine.
- **Sources légales et limites ACT-03/ACT-09** : le [gabarit de règlement](12-reglement-jeu-projet.md), les [politiques de confidentialité](13-politique-confidentialite.md) et [note de statut de la page publique](15-politique-confidentialite.md) sont les textes du dépôt. Le DOCX sous `artifacts/Reglement_Skuup.docx` est un gabarit distinct de la révision propriétaire `Reglement_Skuup.docx` retrouvée dans Drive (modifiée le 23 septembre 2026); la [demande de readiness](delivery/readiness-decision-request.md) documente leurs écarts, les fallbacks frontend et les décisions owner, sans recopier de coordonnées privées ni d'identifiant/lien Drive. Les textes restent des versions de travail ou à vérifier; ils ne remplacent ni la validation juridique/Conformité ni les preuves d'exécution.
- **Inventaire des assets et médias** : [inventaire média](design/media-inventory.md), avec références de code, métadonnées binaires vérifiées et limites de preuve ACT-09.
- **Icônes PNG des dashboards** : [usage par route, formats, correspondances et règles d'accessibilité](design/dashboard-icon-usage.md), complété par les [formats et dimensions réels des assets](design/dashboard-v3-assets.md).

## Règle de lecture des preuves

Les snapshots et rapports historiques décrivent uniquement leur date, leur SHA
et leur périmètre. Ils ne modifient pas l'état courant et ne font pas passer une
story ou une gate à l'approbation sans nouvelle preuve datée et rattachée à un
SHA précis, puis sa relecture requise.

Les [audits transversaux](audits/76-audit-complet.md) et le
[pentest complet](audits/62-pentest-complet.md) restent consultables comme
rapports historiques; leur contenu ne remplace pas les sources canoniques ci-dessus.
