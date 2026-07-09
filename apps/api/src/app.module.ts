import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { configuration, validateEnv } from './config/configuration';
import { PrismaModule } from './database/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { MailModule } from './infrastructure/mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';
import { MessagesModule } from './modules/messages/messages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BlogModule } from './modules/blog/blog.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { CareersModule } from './modules/careers/careers.module';
import { ContactModule } from './modules/contact/contact.module';
import { FilesModule } from './modules/files/files.module';
import { AiModule } from './modules/ai/ai.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuditModule } from './modules/audit/audit.module';
import { SettingsModule } from './modules/settings/settings.module';
import { HealthModule } from './modules/health/health.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        autoLogging: { ignore: (req) => req.url === '/api/v1/health' },
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    MailModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    ProjectsModule,
    TasksModule,
    InvoicesModule,
    PaymentsModule,
    SubscriptionsModule,
    QuotesModule,
    ContractsModule,
    TicketsModule,
    KnowledgeBaseModule,
    MessagesModule,
    NotificationsModule,
    BlogModule,
    PortfolioModule,
    CareersModule,
    ContactModule,
    FilesModule,
    AiModule,
    AnalyticsModule,
    AuditModule,
    SettingsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
