import { IsEmail, IsString } from 'class-validator';

/** Payload de POST /auth/login. */
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  motDePasse!: string;
}
