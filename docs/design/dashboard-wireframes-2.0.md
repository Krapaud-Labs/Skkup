# Références de maquettes dashboards 2.0

## Statut

`draft`, maquettes structurelles basse fidélité destinées à verrouiller la hiérarchie avant la direction visuelle finale. Elles ne valent pas validation d'implémentation.

## Viewer - Vue d'ensemble

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Logo Skkup        Vue d'ensemble                         Compte  ●  │
├───────────────┬──────────────────────────────────────────────────────┤
│ Vue d'ensemble│ Bonjour, Mickael                         [Aide]      │
│ Gagner points │                                                      │
│ Récompenses   │  POINTS AUJOURD'HUI   STREAK   PROCHAINE RÉCOMPENSE  │
│ Règles et aide│  1 240 / 2 000       12 jours  Ticket tirage         │
│ Compte        │                                                      │
│               │  [Commencer à gagner des points]                    │
│               │                                                      │
│               │  À reprendre              Activité récente           │
│               │  Session Twitch  18 min   +320 points   il y a 2 min │
└───────────────┴──────────────────────────────────────────────────────┘
```

Règle : la prochaine action et la progression dominent l'écran. Les métriques restent groupées et l'activité n'entre pas en concurrence avec le CTA.

## Admin - Cockpit

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Skkup Admin      Cockpit                                  Profil  ●  │
├────────────────┬─────────────────────────────────────────────────────┤
│ Cockpit         │ Santé du service                         [Filtrer] │
│ Utilisateurs    │                                                     │
│ et fraude       │  ALERTES 3     TÂCHES 8       API 99,98 %           │
│ Tirages         │                                                     │
│ Contenu         │  Priorité maintenant                               │
│ Catalogue       │  [Examiner le signal fraude #1842]                 │
│ Paramètres      │  Motif · niveau · dernière activité · permission    │
│                 │                                                     │
│                 │  Activité récente          Prochains tirages        │
│                 │  ...                       ...                       │
└────────────────┴─────────────────────────────────────────────────────┘
```

Règle : le cockpit présente l'état du système et une seule tâche prioritaire. Les actions sensibles sont confirmées dans un dialogue explicite et journalisées.

## Mobile

Sur mobile, la navigation contextuelle devient un sélecteur compact persistant. L'ordre est : titre et contexte, métrique principale, CTA, contenu secondaire, activité. Les tableaux deviennent des cartes de lignes sans perte de contexte ni d'action.

### Viewer mobile - Vue d'ensemble

```text
┌──────────────────────┐
│ ☰  Vue d'ensemble  ● │
├──────────────────────┤
│ Ton aventure Skkup   │
│ 1 240 pts / 2 000    │
│ Streak 12 jours      │
│                      │
│ [Commencer à gagner] │
│                      │
│ À reprendre          │
│ Session Twitch       │
│                      │
│ Activité récente     │
└──────────────────────┘
```

### Admin mobile - Cockpit

```text
┌──────────────────────┐
│ ☰  Cockpit        ●  │
├──────────────────────┤
│ Santé du service     │
│ Alertes 3 · Tâches 8 │
│                      │
│ [Traiter priorité]   │
│                      │
│ Priorité maintenant  │
│ Signal fraude #1842  │
│                      │
│ Activité récente     │
│ Prochains tirages    │
└──────────────────────┘
```

### Couverture des écrans secondaires

Les écrans secondaires reprennent le cadre suivant, avec une référence explicite par largeur :

| Écran | 320 px | 768 px | Desktop |
| --- | --- | --- | --- |
| Viewer - Gagner des points | sélecteur de stream puis CTA pleine largeur | deux zones stream/session | panneau session + activité |
| Viewer - Récompenses | carte empilée, action visible | grille 2 colonnes | grille 3 colonnes |
| Viewer - Règles et aide | accordéon | accordéon + aide contextuelle | navigation locale + contenu |
| Viewer - Compte | sections empilées | deux colonnes | panneau profil + sécurité |
| Admin - Utilisateurs et fraude | cartes de signaux | liste + panneau détail | tableau + panneau détail |
| Admin - Tirages | cartes de tirages | liste + filtres | tableau + panneau d'exécution |
| Admin - Contenu | sélecteur puis éditeur | liste + éditeur | navigation contenu + éditeur |
| Admin - Catalogue | cartes de streams | liste filtrable | tableau + panneau catalogue |
| Admin - Paramètres | sections empilées | navigation + section | navigation persistante + contenu |

Chaque écran possède les variantes suivantes dans la référence de conception :

```text
normal      : contenu et CTA disponibles
loading     : structure conservée, contrôles non trompeurs
vide        : raison + prochaine action
succès      : résultat + conséquence + aria-live="polite"
erreur      : message + retry ou reprise
bloquante   : impact + étape suivante, écriture empêchée
permission  : refus expliqué sans donnée révélée
session     : reconnexion, état sûr conservé
disabled    : contrôle désactivé avec raison compréhensible
focus       : anneau violet 2px, contraste renforcé, ordre visuel conservé
```

La navigation mobile secondaire utilise le même sélecteur compact que la vue d'ensemble; le changement de section conserve le titre, le contexte et le CTA dans le même ordre. Les notifications temps réel sont non bloquantes : elles apparaissent dans un `StatusBanner` avec `role="status"`, sont dédupliquées par événement et disposent d'un lien vers la source. En cas de reconnexion, un message indique si les données ont été rattrapées ou si un rafraîchissement manuel est nécessaire.

## Critères de relecture

- le header global historique n'apparaît plus;
- l'action principale est identifiable sans parcourir l'écran;
- le même écran possède une hiérarchie lisible à 320 px, 768 px et desktop;
- les états loading, vide, erreur et permission remplacent le contenu sans déplacer le CTA;
- le parcours clavier suit l'ordre visuel et conserve un focus visible.
