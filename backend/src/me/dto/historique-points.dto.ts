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
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
