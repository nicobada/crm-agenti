import { IsString, IsEmail, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateAgentDto {
  @IsEmail({}, { message: 'Inserisci un indirizzo email valido' })
  email!: string;

  @IsString({ message: 'La password è obbligatoria' })
  password!: string;

  @IsString({ message: 'Il nome è obbligatorio' })
  firstName!: string;

  @IsString({ message: 'Il cognome è obbligatorio' })
  lastName!: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;
}