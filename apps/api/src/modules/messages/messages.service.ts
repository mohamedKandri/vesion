import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { AuthUser } from '../../common/types/auth-user';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateConversationDto, SendMessageDto } from './dto/messages.dto';

const PARTICIPANT_SELECT = {
  user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
  lastReadAt: true,
} as const;

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async listConversations(actor: AuthUser) {
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId: actor.id } } },
      include: {
        participants: { select: PARTICIPANT_SELECT },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    // Compute unread counts per conversation for the badge UI.
    return Promise.all(
      conversations.map(async (c) => {
        const me = await this.prisma.conversationParticipant.findUnique({
          where: { conversationId_userId: { conversationId: c.id, userId: actor.id } },
        });
        const unread = await this.prisma.chatMessage.count({
          where: {
            conversationId: c.id,
            senderId: { not: actor.id },
            createdAt: { gt: me?.lastReadAt ?? new Date(0) },
          },
        });
        return { ...c, lastMessage: c.messages[0] ?? null, messages: undefined, unread };
      }),
    );
  }

  async getConversation(id: string, actor: AuthUser) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: { select: PARTICIPANT_SELECT },
        messages: {
          include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
          take: 500,
        },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    this.assertParticipant(conversation.participants, actor);

    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: id, userId: actor.id } },
      data: { lastReadAt: new Date() },
    });
    return conversation;
  }

  async createConversation(dto: CreateConversationDto, actor: AuthUser) {
    const participantIds = [...new Set([actor.id, ...dto.participantIds])];

    // Reuse an existing 1:1 conversation instead of creating duplicates.
    if (participantIds.length === 2 && !dto.subject) {
      const existing = await this.prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: participantIds.map((userId) => ({ participants: { some: { userId } } })),
        },
      });
      if (existing) {
        if (dto.message) await this.sendMessage(existing.id, { body: dto.message }, actor);
        return this.getConversation(existing.id, actor);
      }
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        subject: dto.subject,
        isGroup: participantIds.length > 2,
        participants: { create: participantIds.map((userId) => ({ userId })) },
      },
    });

    if (dto.message) await this.sendMessage(conversation.id, { body: dto.message }, actor);
    return this.getConversation(conversation.id, actor);
  }

  async sendMessage(conversationId: string, dto: SendMessageDto, actor: AuthUser) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (!conversation.participants.some((p) => p.userId === actor.id)) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    const [message] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: { conversationId, senderId: actor.id, body: dto.body },
        include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      }),
      this.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
      this.prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId: actor.id } },
        data: { lastReadAt: new Date() },
      }),
    ]);

    const recipients = conversation.participants.filter((p) => p.userId !== actor.id);
    await Promise.all(
      recipients.map((p) =>
        this.notifications.notifyUser(p.userId, {
          type: NotificationType.MESSAGE,
          title: `New message from ${actor.firstName} ${actor.lastName}`,
          body: dto.body.slice(0, 140),
          link: `/dashboard/messages/${conversationId}`,
        }),
      ),
    );
    return message;
  }

  /** Poll endpoint for live chat: messages newer than a given timestamp. */
  async pollMessages(conversationId: string, since: string, actor: AuthUser) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { select: PARTICIPANT_SELECT } },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    this.assertParticipant(conversation.participants, actor);

    const sinceDate = new Date(since);
    return this.prisma.chatMessage.findMany({
      where: {
        conversationId,
        createdAt: { gt: isNaN(sinceDate.getTime()) ? new Date(0) : sinceDate },
      },
      include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  private assertParticipant(
    participants: { user: { id: string } }[],
    actor: AuthUser,
  ): void {
    if (!participants.some((p) => p.user.id === actor.id)) {
      throw new ForbiddenException('You are not part of this conversation');
    }
  }
}
