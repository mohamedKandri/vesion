import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateConversationDto, SendMessageDto } from './dto/messages.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';

@ApiTags('Messages')
@ApiBearerAuth('access-token')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List own conversations with unread counts' })
  listConversations(@CurrentUser() user: AuthUser) {
    return this.messages.listConversations(user);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a conversation and mark it read' })
  getConversation(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.messages.getConversation(id, user);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Start a conversation (reuses existing 1:1 threads)' })
  createConversation(@Body() dto: CreateConversationDto, @CurrentUser() user: AuthUser) {
    return this.messages.createConversation(dto, user);
  }

  @Post('conversations/:id')
  @ApiOperation({ summary: 'Send a message' })
  send(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messages.sendMessage(id, dto, user);
  }

  @Get('conversations/:id/poll')
  @ApiQuery({ name: 'since', description: 'ISO timestamp; returns messages newer than this' })
  @ApiOperation({ summary: 'Poll for new messages (live chat)' })
  poll(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('since') since: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messages.pollMessages(id, since, user);
  }
}
