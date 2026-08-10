import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Pagination par offset (page/limit) : l'historique de points est
// consulté page par page dans l'interface, avec un compteur total, ce
// qu'un curseur ne permettrait pas simplement.
export class HistoriquePointsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  // Borne haute : au-delà, l'offset calculé dépasserait la capacité du
  // "skip" côté base et provoquerait une erreur serveur au lieu d'un 400.
  @Max(100000)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
