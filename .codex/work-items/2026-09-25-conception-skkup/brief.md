# 2026-09-25-conception-skkup

## Métadonnées

| Champ | Valeur |
|---|---|
| Statut | in-progress |
| Propriétaire | Mickael MUR |
| Risque | élevé |
| Skill | conception, project-onboarding |
| Budget de tours | non défini |

## Résultat attendu

Dossier de conception complet et validé par les contrôles disponibles, avec stack détectée, Trello relié et décisions métier tracées.

## Hors périmètre

Implémentation produit, lancement commercial et validation juridique externe.

## Fichiers autorisés

`.codex/PROJECT-BRIEF.md`, `.codex/project-profile.toml`, `.codex/RUNTIME-STATE.md`, `.codex/work-items/`, `docs/` et scripts de validation strictement nécessaires.

## Critères d'acceptation

- [x] Cahier accepté et décisions de cadrage enregistrées
- [x] Trello relu et documenté
- [x] Stack détectée et profil complété
- [x] Dossier docs complété sans marqueurs
- [x] Preflight exécuté avec succès

## Preuves

| Critère | Preuve | Résultat |
|---|---|---|
| Cahier accepté | `.codex/PROJECT-BRIEF.md` | réussi |
| Trello vérifié | `docs/project-management/trello-board.md` | réussi |
| Validation kit | `bash .codex/scripts/preflight.sh` | Preflight OK |

## Risques résiduels

## Décision

Conception prête pour revue métier, sécurité et conformité avant implémentation.
