import { IsString, IsOptional, IsEmail, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ClientType } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateClientDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString({ message: 'agentId deve essere una stringa valida' })
  agentId?: string;

  @IsEnum(ClientType, {
    message: `type deve essere uno di: ${Object.values(ClientType).join(', ')}`,
  })
  type: ClientType;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEmail({}, { message: 'Email non valida' })
  email?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MaxLength(20)
  vatNumber?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MaxLength(200)
  specialization?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MaxLength(1000)
  notes?: string;
}