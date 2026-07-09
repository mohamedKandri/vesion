import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { renderEmail } from './templates';

export interface MailJob {
  to: string;
  subject: string;
  heading: string;
  bodyLines: string[];
  cta?: { label: string; url: string };
}

const QUEUE_NAME = 'mail';

@Injectable()
export class MailService implements OnModuleDestroy {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly queue: Queue<MailJob>;
  private readonly worker: Worker<MailJob>;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('mail.host'),
      port: config.get<number>('mail.port'),
      secure: config.get<boolean>('mail.secure'),
      auth: config.get('mail.user')
        ? { user: config.get<string>('mail.user'), pass: config.get<string>('mail.password') }
        : undefined,
    });

    const connection = {
      host: config.get<string>('redis.host'),
      port: config.get<number>('redis.port'),
      password: config.get<string>('redis.password'),
    };

    this.queue = new Queue<MailJob>(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });

    this.worker = new Worker<MailJob>(
      QUEUE_NAME,
      async (job) => {
        await this.transporter.sendMail({
          from: this.config.get<string>('mail.from'),
          to: job.data.to,
          subject: job.data.subject,
          html: renderEmail(job.data),
          text: [job.data.heading, ...job.data.bodyLines, job.data.cta?.url ?? ''].join('\n\n'),
        });
      },
      { connection, concurrency: 5 },
    );

    this.worker.on('failed', (job, err) =>
      this.logger.error(`Mail job ${job?.id} failed: ${err.message}`),
    );
  }

  /** Enqueue an email; delivery is retried with exponential backoff. */
  async send(job: MailJob): Promise<void> {
    await this.queue.add('send', job);
  }

  async onModuleDestroy() {
    await this.worker.close();
    await this.queue.close();
  }
}
