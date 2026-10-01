import { Controller, Get, Post, Patch, Param, UseGuards } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('commissions')
@UseGuards(JwtAuthGuard)
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  // Helper per assicurarsi che i ruoli siano sempre un array di stringhe piatte
  // Questo risolve i problemi con includes('ADMIN') all'interno del Service.
  private normalizeUser(user: any) {
    if (!user) return user;
    const roles = Array.isArray(user.roles) 
      ? user.roles.map((r: any) => typeof r === 'string' ? r : r.name)
      : [];
    return { ...user, roles };
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.commissionsService.findAll(this.normalizeUser(user));
  }

  @Post(':id/pay')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  pay(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.commissionsService.payCommission(id, this.normalizeUser(user));
  }

  @Patch(':id/pay')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  payPatch(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.commissionsService.payCommission(id, this.normalizeUser(user));
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  approve(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.commissionsService.approveCommission(id, this.normalizeUser(user));
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  approvePatch(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.commissionsService.approveCommission(id, this.normalizeUser(user));
  }
}