import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { SettingsService, UpsertSettingDto } from './settings.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Public site settings (company name, contact email)' })
  getPublic() {
    return this.settings.getPublic();
  }

  @Get()
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all settings' })
  getAll() {
    return this.settings.getAll();
  }

  @Put()
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create or update a setting' })
  upsert(@Body() dto: UpsertSettingDto) {
    return this.settings.upsert(dto);
  }

  @Delete(':key')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a setting' })
  remove(@Param('key') key: string) {
    return this.settings.remove(key);
  }
}
