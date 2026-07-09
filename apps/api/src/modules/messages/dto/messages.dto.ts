import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ type: [String], description: 'Participant user ids (the creator is added automatically)' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  participantIds: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @ApiPropertyOptional({ description: 'First message body' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  message?: string;
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body: string;
}
