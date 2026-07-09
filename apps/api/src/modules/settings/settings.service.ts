import { BadRequestException, Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../infrastructure/redis/cache.service';

export class UpsertSettingDto {
  @ApiProperty({ example: 'billing.defaultDueDays' })
  @IsString()
  @Matches(/^[a-zA-Z0-9._-]{3,80}$/)
  key: string;

  @ApiProperty({ description: 'Any JSON value' })
  @IsNotEmpty()
  value: unknown;
}

export class DeleteSettingDto {
  @ApiProperty()
  @IsString()
  @MaxLength(80)
  key: string;
}

const PUBLIC_KEYS = ['company.name', 'company.email'];

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async getAll() {
    const settings = await this.prisma.setting.findMany({ orderBy: { key: 'asc' } });
    return settings;
  }

  getPublic() {
    return this.cache.remember('settings:public', 600, async () => {
      const settings = await this.prisma.setting.findMany({ where: { key: { in: PUBLIC_KEYS } } });
      return Object.fromEntries(settings.map((s) => [s.key, s.value]));
    });
  }

  async upsert(dto: UpsertSettingDto) {
    if (dto.value === undefined) throw new BadRequestException('A value is required');
    const setting = await this.prisma.setting.upsert({
      where: { key: dto.key },
      update: { value: dto.value as Prisma.InputJsonValue },
      create: { key: dto.key, value: dto.value as Prisma.InputJsonValue },
    });
    await this.cache.del('settings:public');
    return setting;
  }

  async remove(key: string) {
    await this.prisma.setting.deleteMany({ where: { key } });
    await this.cache.del('settings:public');
    return { message: 'Setting removed' };
  }
}
