import { Injectable } from '@nestjs/common';
import {
  EVENEMENT_CARTE_DEBLOQUEE,
  EVENEMENT_POINTS_MIS_A_JOUR,
  EVENEMENT_STREAK_MIS_A_JOUR,
  EVENEMENT_TIRAGE_RESULTAT,
  EVENEMENT_TIRAGE_STATUT,
  ROOM_TIRAGES,
  roomUtilisateur,
} from './realtime.constants';
import { RealtimeGateway } from './realtime.gateway';

// ---------------------------------------------------------------------
// Service de notification temps réel
//
// Seul point d'entrée pour le reste du backend : les services métier
// appellent ces méthodes après une écriture committée, sans rien savoir
// de Socket.io ni des noms de rooms.
// ---------------------------------------------------------------------

export interface NotificationPoints {
  soldePoints: number;
  montant: number;
  type: string;
}

export interface NotificationStreak {
  streakActuel: number;
  streakMax: number;
}

export interface NotificationCarteDebloquee {
  carteId: string;
  streakPalier: number;
}

export interface NotificationStatutTirage {
  raffleId: string;
  statut: string;
}

export interface NotificationResultatTirage {
  raffleId: string;
  graineAleatoire: string;
  empreinteParticipants: string;
  resultatPublieAt: Date;
  nombreTickets: number;
  gagnants: Array<{ lotId: string; ticketId: string; userId: string }>;
}

@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  // --- Notifications privées (room de l'utilisateur) ---

  notifierPoints(userId: string, donnees: NotificationPoints): void {
    this.gateway.emettre(
      roomUtilisateur(userId),
      EVENEMENT_POINTS_MIS_A_JOUR,
      donnees,
    );
  }

  notifierStreak(userId: string, donnees: NotificationStreak): void {
    this.gateway.emettre(
      roomUtilisateur(userId),
      EVENEMENT_STREAK_MIS_A_JOUR,
      donnees,
    );
  }

  notifierCarteDebloquee(
    userId: string,
    donnees: NotificationCarteDebloquee,
  ): void {
    this.gateway.emettre(
      roomUtilisateur(userId),
      EVENEMENT_CARTE_DEBLOQUEE,
      donnees,
    );
  }

  // --- Notifications de tirage (room commune) ---

  notifierStatutTirage(donnees: NotificationStatutTirage): void {
    this.gateway.emettre(ROOM_TIRAGES, EVENEMENT_TIRAGE_STATUT, donnees);
  }

  notifierResultatTirage(donnees: NotificationResultatTirage): void {
    this.gateway.emettre(ROOM_TIRAGES, EVENEMENT_TIRAGE_RESULTAT, donnees);
  }
}
