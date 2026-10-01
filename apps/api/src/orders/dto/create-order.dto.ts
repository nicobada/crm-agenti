import { IsString, IsNumber, IsArray, IsOptional, IsNotEmpty, Min, ValidateNested, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

export class OrderItemDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  @IsNotEmpty()
  productName!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  quantity!: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  unitPrice!: number;

  @IsOptional()
  @Transform(({ value }) => Number(value || 0))
  @IsNumber()
  discount?: number;
}

export class CreateOrderDto {
  @IsNotEmpty({ message: 'Il cliente è obbligatorio' })
  @IsString()
  clientId!: string;

  // Renderlo opzionale evita che il ValidationPipe blocchi la richiesta 
  // dato che ora il frontend non lo manda più.
  @IsOptional()
  @IsString()
  agentId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}