import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AiContext, AiRole, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { AuthUser } from '../../common/types/auth-user';
import { AssistantEngine } from './assistant-engine';
import { ChatMessageDto, StartConversationDto } from './dto/ai.dto';

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: AssistantEngine,
  ) {}

  async startConversation(dto: StartConversationDto, user: AuthUser | null) {
    if (!user && !dto.visitorId) {
      throw new BadRequestException('A visitorId is required for anonymous conversations');
    }
    const context = user ? dto.context ?? AiContext.WEBSITE : AiContext.WEBSITE;
    return this.prisma.aiConversation.create({
      data: { userId: user?.id, visitorId: user ? null : dto.visitorId, context },
    });
  }

  async listConversations(user: AuthUser) {
    return this.prisma.aiConversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
  }

  async getConversation(id: string, user: AuthUser | null, visitorId?: string) {
    const conversation = await this.prisma.aiConversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 200 } },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    this.assertOwnership(conversation, user, visitorId);
    return conversation;
  }

  /**
   * Processes a user message and produces the assistant reply. Conversation
   * history gives the engine short-term context (the last user turns are
   * appended to the retrieval query for follow-up questions).
   */
  async chat(conversationId: string, dto: ChatMessageDto, user: AuthUser | null) {
    const conversation = await this.getConversation(conversationId, user, dto.visitorId);

    await this.prisma.aiMessage.create({
      data: { conversationId, role: AiRole.USER, content: dto.message },
    });

    // Follow-up context: if the message is short, enrich with the previous user turn.
    let query = dto.message;
    if (dto.message.split(/\s+/).length <= 3) {
      const lastUser = [...conversation.messages].reverse().find((m) => m.role === AiRole.USER);
      if (lastUser) query = `${lastUser.content} ${dto.message}`;
    }

    const answer = await this.engine.answer(query, conversation.context, user, dto.projectId);

    const [reply] = await this.prisma.$transaction([
      this.prisma.aiMessage.create({
        data: {
          conversationId,
          role: AiRole.ASSISTANT,
          content: answer.content,
          sources: answer.sources.length > 0 ? (answer.sources as unknown as Prisma.InputJsonValue) : undefined,
        },
      }),
      this.prisma.aiConversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: new Date(),
          ...(conversation.messages.length === 0
            ? { title: dto.message.slice(0, 60) }
            : {}),
        },
      }),
    ]);

    return reply;
  }

  async deleteConversation(id: string, user: AuthUser) {
    const conversation = await this.prisma.aiConversation.findUnique({ where: { id } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.userId !== user.id) throw new ForbiddenException('Not your conversation');
    await this.prisma.aiConversation.delete({ where: { id } });
    return { message: 'Conversation deleted' };
  }

  private assertOwnership(
    conversation: { userId: string | null; visitorId: string | null },
    user: AuthUser | null,
    visitorId?: string,
  ) {
    const ownsAsUser = user && conversation.userId === user.id;
    const ownsAsVisitor = !conversation.userId && visitorId && conversation.visitorId === visitorId;
    if (!ownsAsUser && !ownsAsVisitor) {
      throw new ForbiddenException('You do not have access to this conversation');
    }
  }
}
