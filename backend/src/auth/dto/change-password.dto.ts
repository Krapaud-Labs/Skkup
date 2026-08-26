import { IsString, Matches, MinLength } from 'class-validator';

/** Payload de PATCH /auth/password. */
export class ChangePasswordDto {
  @IsString()
  ancienMotDePasse!: string;

  @IsString()
  @MinLength(12)
  @Matches(/[a-z]/)
  @Matches(/[A-Z]/)
  @Matches(/[0-9]/)
  nouveauMotDePasse!: string;
}
