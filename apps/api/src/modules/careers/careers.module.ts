import { Module } from '@nestjs/common';
import { CareersController } from './careers.controller';
import { CareersService } from './careers.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [CareersController],
  providers: [CareersService],
})
export class CareersModule {}
