/**
 * Point d'accès unique aux API du navigateur.
 *
 * `webextension-polyfill` expose l'API `browser.*` à promesses aussi bien
 * sur Chrome que sur Firefox : la V1.0 ne cible que Chrome, mais passer
 * par ce module dès maintenant évite d'avoir à réécrire les appels au
 * moment d'ajouter Firefox en V1.1 (ADR-001, contexte architecture agentic).
 *
 * Tous les modules porteurs de logique reçoivent ces objets en paramètre
 * plutôt que d'importer ce fichier : c'est ce qui les rend vérifiables
 * sans navigateur.
 */

import navigateur from "webextension-polyfill";

export { navigateur };
