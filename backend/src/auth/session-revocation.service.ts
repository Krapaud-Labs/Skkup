import { Injectable } from '@nestjs/common';

type AuditeurRevocation = (userId: string) => void;

/** Relaye immédiatement une révocation aux canaux temps réel du processus API. */
@Injectable()
export class SessionRevocationService {
  private readonly auditeurs = new Set<AuditeurRevocation>();

  abonner(auditeur: AuditeurRevocation): () => void {
    this.auditeurs.add(auditeur);
    return () => this.auditeurs.delete(auditeur);
  }

  revoquer(userId: string): void {
    for (const auditeur of this.auditeurs) {
      auditeur(userId);
    }
  }
}
