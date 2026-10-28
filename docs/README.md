---
last_updated: 2026-10-23
---

# Index documentaire Skkup

## Où trouver la source de vérité

- **État de conception et gate globale** : [design-readiness](design/design-readiness.md). `Status: review` signifie que la conception n'est pas approuvée.
- **Stories produit et critères acceptés** : [user stories](product/user-stories.md). US-008 couvre le cycle owner accepté `DRAFT`/`PUBLISHED`/`ARCHIVED`; son implémentation et son E2E ciblé sont documentés, tandis que le statut `needs-review` attend la revue finale MVP.
- **Obligations ACT, owners proposés et preuves attendues** : [registre de traçabilité](design/design-traceability-and-open-actions-2026-10-18.md).
- **Preuves QA par story** : [matrice P0](quality/p0-evidence-matrix.md), avec résultats datés, SHA observé et limites de portée; US-004 couvre le plafond de 65 points et deux requêtes parallèles (sans chevauchement transactionnel imposé); US-006 couvre le tirage/CSPRNG ciblé et la course inscription/clôture (3/3 tests), sans preuve d'idempotence exhaustive, worker CSPRNG déployé ou snapshot immuable.
- **Décisions et limites ACT-03/ACT-09** : [demande de readiness](delivery/readiness-decision-request.md) et [journal des décisions](delivery/decision-log.md). Les orientations produit partielles ne remplacent pas les validations spécialisées ou les preuves d'exécution.
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
