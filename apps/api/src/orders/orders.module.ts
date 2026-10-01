import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { CommissionCalculationService } from '../commissions/commission-calculation.service';

@Module({
  providers: [OrdersService, CommissionCalculationService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
