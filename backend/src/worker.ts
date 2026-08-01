// Point d'entrée du worker BullMQ. Les jobs (agrégation de watch time,
// tirage au sort) seront ajoutés par les cartes Trello dédiées ; ce
// placeholder permet au service Docker `worker` de démarrer dès
// l'initialisation du projet.

console.log('Worker démarré (aucun job configuré pour le moment).');

// Garde le process actif tant qu'aucun job BullMQ n'est encore branché.
setInterval(() => {}, 1 << 30);
