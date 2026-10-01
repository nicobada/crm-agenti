import { Module, Global } from '@nestjs/common';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [LogsController], // <-- Aggiunto il controller qui
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsModule {}