import { IsOptional, IsNumber, IsEnum, IsString } from 'class-validator';
import { CommissionStatus } from '@prisma/client';

export class UpdateCommissionDto {
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsNumber()
  percentage?: number;

  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
