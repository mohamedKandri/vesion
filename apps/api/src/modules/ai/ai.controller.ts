import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AiService } from './ai.service';
import { ChatMessageDto, StartConversationDto } from './dto/ai.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';

@ApiTags('AI assistant')
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Post('conversations')
  @ApiOperation({ summary: 'Start an assistant conversation (works for anonymous visitors)' })
  start(@Body() dto: StartConversationDto, @CurrentUser() user?: AuthUser) {
    return this.ai.startConversation(dto, user ?? null);
  }

  @Get('conversations')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List own assistant conversations' })
  list(@CurrentUser() user: AuthUser) {
    return this.ai.listConversations(user);
  }

  @Public()
  @Get('conversations/:id')
  @ApiQuery({ name: 'visitorId', required: false })
  @ApiOperation({ summary: 'Get conversation history' })
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: AuthUser,
    @Query('visitorId') visitorId?: string,
  ) {
    return this.ai.getConversation(id, user ?? null, visitorId);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 15 } })
  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message and get the assistant reply' })
  chat(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChatMessageDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.ai.chat(id, dto, user ?? null);
  }

  /**
   * Streaming variant: emits the reply progressively as Server-Sent Events
   * (`chunk` events with word groups, then a final `done` event with sources).
   */
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 15 } })
  @Post('conversations/:id/stream')
  @ApiOperation({ summary: 'Send a message and stream the reply (SSE)' })
  async stream(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChatMessageDto,
    @Res() res: Response,
    @CurrentUser() user?: AuthUser,
  ) {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();

    try {
      const reply = await this.ai.chat(id, dto, user ?? null);
      const words = reply.content.split(/(\s+)/);
      const chunkSize = 4;

      for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join('');
        res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      res.write(
        `event: done\ndata: ${JSON.stringify({ id: reply.id, sources: reply.sources ?? [] })}\n\n`,
      );
    } catch (err) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: (err as Error).message })}\n\n`);
    } finally {
      res.end();
    }
  }

  @Delete('conversations/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a conversation' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.ai.deleteConversation(id, user);
  }
}
