import { IsString, Length } from 'class-validator';

export class PairDto {
  // Bornes larges : la forme exacte (alphabet, séparateurs tolérés) est
  // vérifiée par la normalisation du service. La validation ne sert ici
  // qu'à écarter les charges utiles hors gabarit avant tout traitement.
  @IsString()
  @Length(8, 32)
  code!: string;
}
