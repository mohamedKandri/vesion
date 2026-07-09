import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateContractDto {
  @ApiProperty()
  @IsUUID()
  companyId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Markdown contract body' })
  @IsString()
  @MaxLength(500000)
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class SignContractDto {
  @ApiProperty({ description: 'Full legal name typed as signature' })
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  signedByName: string;
}
