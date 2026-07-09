import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiContext } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class StartConversationDto {
  @ApiPropertyOptional({ enum: AiContext, default: AiContext.WEBSITE })
  @IsOptional()
  @IsEnum(AiContext)
  context?: AiContext;

  @ApiPropertyOptional({ description: 'Anonymous visitor id (website chat without an account)' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  visitorId?: string;
}

export class ChatMessageDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({ description: 'Anonymous visitor id for public website chat' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  visitorId?: string;

  @ApiPropertyOptional({ description: 'Project in focus for PROJECT context questions' })
  @IsOptional()
  @IsUUID()
  projectId?: string;
}
