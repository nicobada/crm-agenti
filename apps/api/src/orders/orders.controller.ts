import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from '@prisma/client';
import { AuthenticatedUser } from '../common/types/auth-user.type';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findAll({ user });
  }

  @Get('recent')
  findRecent(
    @Query('limit') limit: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.findRecent(parseInt(limit || '5', 10), user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.findOne(id, user);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.updateStatus(id, dto.status as OrderStatus, user);
  }
}
