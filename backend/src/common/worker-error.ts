const MESSAGE_ERREUR_WORKER = 'Worker job failed.';

/** Remplace une erreur métier par une erreur sans détail sensible. */
export function erreurWorker(): Error {
  return new Error(MESSAGE_ERREUR_WORKER);
}
