import { Module } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { CommissionsController } from './commissions.controller';
import { CommissionRulesController } from './commission-rules.controller';
import { CommissionCalculationService } from './commission-calculation.service';

@Module({
  providers: [CommissionsService, CommissionCalculationService],
  controllers: [CommissionsController, CommissionRulesController],
  exports: [CommissionsService, CommissionCalculationService],
})
export class CommissionsModule {}
