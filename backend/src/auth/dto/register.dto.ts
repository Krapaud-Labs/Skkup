import { IsEmail, IsString, MinLength } from 'class-validator';

/** Payload de POST /auth/register. */
export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  motDePasse!: string;

  @IsString()
  @MinLength(2)
  pseudo!: string;
}
