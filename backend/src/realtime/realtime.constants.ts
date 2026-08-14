// ==================== CONSTANTES DU CANAL TEMPS RÉEL ====================
// Noms de rooms et d'événements partagés entre la Gateway (processus
// API) et le worker BullMQ (processus séparé, qui publie via Redis).

// ==================== ROOMS ====================

/**
 * Room privée d'un utilisateur. Le `userId` provient toujours du JWT
 * vérifié à la poignée de main, jamais d'une valeur fournie par le
 * client : c'est ce qui empêche un client de s'abonner au canal d'un
 * autre utilisateur.
 */
export function roomUtilisateur(userId: string): string {
  return `user:${userId}`;
}

/**
 * Room commune aux annonces de tirage. Choix V1.0 : plutôt qu'une room
 * par tirage avec un abonnement explicite à gérer, tout utilisateur
 * authentifié rejoint cette room unique et le `raffleId` est porté par
 * le payload. Les événements de tirage sont publics (les mêmes données
 * sont exposées par `GET /raffles*`), il n'y a donc rien à cloisonner
 * ici. Une room par tirage restera possible sans changer les payloads.
 */
export const ROOM_TIRAGES = 'raffles';

// ==================== ÉVÉNEMENTS POUSSÉS VERS LE CLIENT ====================

export const EVENEMENT_POINTS_MIS_A_JOUR = 'points:updated';
export const EVENEMENT_STREAK_MIS_A_JOUR = 'streak:updated';
export const EVENEMENT_CARTE_DEBLOQUEE = 'scratch-card:unlocked';
export const EVENEMENT_TIRAGE_STATUT = 'raffle:status';
export const EVENEMENT_TIRAGE_RESULTAT = 'raffle:result';

/**
 * Liste blanche des événements diffusables. Le pont Redis ne relaie que
 * ces noms : un message inattendu sur le canal ne peut pas faire émettre
 * un événement arbitraire aux clients connectés.
 */
export const EVENEMENTS_AUTORISES: readonly string[] = [
  EVENEMENT_POINTS_MIS_A_JOUR,
  EVENEMENT_STREAK_MIS_A_JOUR,
  EVENEMENT_CARTE_DEBLOQUEE,
  EVENEMENT_TIRAGE_STATUT,
  EVENEMENT_TIRAGE_RESULTAT,
];

// ==================== PONT INTER-PROCESSUS ====================

/**
 * Canal Redis pub/sub par lequel le worker BullMQ fait diffuser ses
 * événements par la Gateway : le worker n'héberge pas de serveur
 * Socket.io, il ne peut donc pas émettre directement.
 */
export const CANAL_REDIS_TEMPS_REEL = 'realtime:events';

export interface MessageTempsReel {
  room: string;
  evenement: string;
  donnees: unknown;
}
