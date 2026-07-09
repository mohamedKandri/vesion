import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/database/prisma.service';

/**
 * API integration tests against a real PostgreSQL/Redis (provided by CI
 * services or `docker compose up`). Exercises health, auth registration,
 * validation, rate-limit wiring, and public content endpoints.
 */
describe('Vesion API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const email = `e2e-${Date.now()}@test.vesion.dev`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.use(cookieParser('test-secret'));
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  describe('GET /api/v1/health', () => {
    it('reports database and redis as up', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.data.info.database.status).toBe('up');
      expect(res.body.data.info.redis.status).toBe('up');
    });
  });

  describe('Auth flow', () => {
    it('rejects weak passwords with a validation error', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password: 'short', firstName: 'E2E', lastName: 'Tester' })
        .expect(400);
      expect(res.body.success).toBe(false);
    });

    it('registers a new account', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password: 'E2eStrongPass1', firstName: 'E2E', lastName: 'Tester' })
        .expect(201);
      expect(res.body.data.message).toMatch(/verify/i);
    });

    it('blocks login before email verification', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'E2eStrongPass1' })
        .expect(401);
    });

    it('logs in after verification and returns tokens', async () => {
      await prisma.user.update({ where: { email }, data: { emailVerifiedAt: new Date() } });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'E2eStrongPass1' })
        .expect(200);

      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(email);

      const me = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${res.body.data.tokens.accessToken}`)
        .expect(200);
      expect(me.body.data.email).toBe(email);
    });

    it('rejects protected routes without a token', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });

    it('enforces RBAC (client cannot list users)', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'E2eStrongPass1' })
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${login.body.data.tokens.accessToken}`)
        .expect(403);
    });
  });

  describe('Public content', () => {
    it('serves pricing plans without auth', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/subscriptions/plans').expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('serves the FAQ without auth', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/faq').expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('validates contact form submissions', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/contact')
        .send({ name: 'X', email: 'not-an-email', message: 'hi' })
        .expect(400);
    });
  });
});
