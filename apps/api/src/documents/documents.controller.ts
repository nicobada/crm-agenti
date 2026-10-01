import { Controller, Get, Post, Delete, Param, UseGuards, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'AGENT')
  findAll(
    @Query('orderId') orderId?: string,
    @Query('clientId') clientId?: string,
    @Query('type') type?: string,
    @CurrentUser() user?: any,
  ) {
    const isAdmin = user?.roles?.some((r: any) => r.name === 'ADMIN' || r.name === 'MANAGER');
    const agentId = !isAdmin ? user?.agent?.id : undefined;

    return this.documentsService.findAll({ orderId, clientId, type, agentId });
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'AGENT')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/download')
  @Roles('ADMIN', 'MANAGER', 'AGENT')
  getDownloadUrl(@Param('id') id: string) {
    return this.documentsService.getDownloadUrl(id);
  }

  @Post('upload')
  @Roles('ADMIN', 'MANAGER', 'AGENT')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('orderId') orderId?: string,
    @Query('clientId') clientId?: string,
    @Query('type') type?: string,
    @CurrentUser() user?: any,
  ) {
    return this.documentsService.upload(file, {
      orderId,
      clientId,
      type,
      uploadedBy: user?.id,
    });
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
