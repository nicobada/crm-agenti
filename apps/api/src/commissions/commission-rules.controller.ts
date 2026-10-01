import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsUUID } from 'class-validator';

class CreateCommissionRuleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsEnum(['AGENT', 'CLIENT', 'PRODUCT', 'GLOBAL'])
  appliesTo: string;

  @IsOptional()
  @IsUUID()
  targetId?: string;

  @IsNumber()
  percentage: number;

  @IsOptional()
  @IsNumber()
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  maxAmount?: number;

  @IsOptional()
  validFrom?: string;

  @IsOptional()
  validUntil?: string;
}

@Controller('commission-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommissionRulesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER')
  findAll(@Query('appliesTo') appliesTo?: string, @Query('targetId') targetId?: string) {
    return this.prisma.commissionRule.findMany({
      where: {
        ...(appliesTo ? { appliesTo: appliesTo as any } : {}),
        ...(targetId ? { targetId } : {}),
      },
      orderBy: { priority: 'desc' },
      include: {
        _count: { select: { commissions: true } },
      },
    });
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Body() dto: CreateCommissionRuleDto) {
    return this.prisma.commissionRule.create({
      data: {
        name: dto.name,
        description: dto.description,
        priority: dto.priority ?? 0,
        isActive: dto.isActive ?? true,
        appliesTo: dto.appliesTo as any,
        targetId: dto.targetId || null,
        percentage: dto.percentage,
        minAmount: dto.minAmount || null,
        maxAmount: dto.maxAmount || null,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      },
    });
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  update(@Param('id') id: string, @Body() dto: Partial<CreateCommissionRuleDto>) {
    const data: any = { ...dto };
    if (dto.validFrom) data.validFrom = new Date(dto.validFrom);
    if (dto.validUntil) data.validUntil = new Date(dto.validUntil);
    return this.prisma.commissionRule.update({ where: { id }, data });
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.prisma.commissionRule.delete({ where: { id } });
  }
}
