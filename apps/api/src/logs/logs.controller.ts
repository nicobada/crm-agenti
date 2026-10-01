import { Controller, Get, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN') // Protezione altissima: solo gli ADMIN vedono il registro
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  findAll() {
    return this.logsService.findAll();
  }
}