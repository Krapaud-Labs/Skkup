import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateStreamRewardDto {
  @IsOptional()
  @IsBoolean()
  estPartenaire?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  bonusPointsHeure?: number;
}
