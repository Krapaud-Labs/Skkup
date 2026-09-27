import { IsBoolean, IsInt, Min } from 'class-validator';

export class HeartbeatDto {
  // Position de lecture rapportée par le client (secondes), à des fins de
  // traçabilité ; la durée créditée est calculée côté serveur, jamais
  // déduite de cette valeur.
  @IsInt()
  @Min(0)
  positionLectureSecondes!: number;

  // Corrélation avec l'état réel du lecteur (contexte sécurité agentic) : un
  // heartbeat envoyé alors que la lecture est en pause n'est jamais crédité.
  @IsBoolean()
  enLecture!: boolean;
}
