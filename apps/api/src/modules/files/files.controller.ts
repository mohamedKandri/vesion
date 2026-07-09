import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { IsOptional, IsUUID } from 'class-validator';
import { FilesService } from './files.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';

class UploadContextDto {
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsUUID()
  ticketId?: string;
}

@ApiTags('Files')
@ApiBearerAuth('access-token')
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        projectId: { type: 'string', format: 'uuid' },
        taskId: { type: 'string', format: 'uuid' },
        ticketId: { type: 'string', format: 'uuid' },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Upload a file attached to a project, task, or ticket' })
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() context: UploadContextDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.files.register(file, context, user);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'List files for a project' })
  listForProject(@Param('projectId', ParseUUIDPipe) projectId: string, @CurrentUser() user: AuthUser) {
    return this.files.listForProject(projectId, user);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a file' })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const { stream, name, mimeType, size } = await this.files.download(id, user);
    res.set({
      'Content-Type': mimeType,
      'Content-Length': size,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(name)}"`,
      'X-Content-Type-Options': 'nosniff',
    });
    stream.pipe(res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file (uploader or staff)' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.files.remove(id, user);
  }
}
