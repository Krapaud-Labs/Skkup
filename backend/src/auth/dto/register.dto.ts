import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

/** Payload de POST /auth/register. */
export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  @Matches(/[a-z]/)
  @Matches(/[A-Z]/)
  @Matches(/[0-9]/)
  motDePasse!: string;

  @IsString()
  @MinLength(2)
  pseudo!: string;
}
