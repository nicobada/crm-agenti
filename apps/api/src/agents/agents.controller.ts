import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { AgentsService, UpdateAgentDto } from './agents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateAgentDto } from './dto/create-agent.dto';

@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  create(@Body() createAgentDto: CreateAgentDto, @CurrentUser() user: any) {
    return this.agentsService.create(createAgentDto, user);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.agentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAgentDto: UpdateAgentDto, @CurrentUser() user: any) {
    return this.agentsService.update(id, updateAgentDto, user);
  }

  // Aggiunto l'endpoint per il toggle
  @Patch(':id/toggle-status')
  toggleStatus(@Param('id') id: string, @CurrentUser() user: any) {
    return this.agentsService.toggleStatus(id, user);
  }
}