import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Même mécanique de pagination par offset que l'historique de points
// (contexte API agentic) : un utilisateur consulte ses tickets page
// par page, avec un compteur total.
export class MesTicketsTirageDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
