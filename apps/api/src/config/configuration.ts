const REQUIRED_ENV = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'ENCRYPTION_KEY',
  'COOKIE_SECRET',
] as const;

export function validateEnv(config: Record<string, unknown>) {
  const missing = REQUIRED_ENV.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  if (config.NODE_ENV === 'production') {
    const weak = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'COOKIE_SECRET'].filter(
      (key) => String(config[key]).length < 32 || String(config[key]).startsWith('replace-with'),
    );
    if (weak.length > 0) {
      throw new Error(`Production secrets are too weak or unset: ${weak.join(', ')}`);
    }
  }
  return config;
}

export const configuration = () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.API_PORT ?? '4000', 10),
  webUrl: process.env.WEB_URL ?? 'http://localhost:3000',
  apiUrl: process.env.API_URL ?? 'http://localhost:4000',
  database: { url: process.env.DATABASE_URL },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  auth: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: parseInt(process.env.JWT_ACCESS_TTL ?? '900', 10),
    refreshTtl: parseInt(process.env.JWT_REFRESH_TTL ?? '2592000', 10),
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
    encryptionKey: process.env.ENCRYPTION_KEY,
  },
  mail: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: parseInt(process.env.SMTP_PORT ?? '1025', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || undefined,
    password: process.env.SMTP_PASSWORD || undefined,
    from: process.env.MAIL_FROM ?? 'Vesion <no-reply@vesion.dev>',
  },
  uploads: {
    dir: process.env.UPLOAD_DIR ?? './uploads',
    maxSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB ?? '25', 10),
  },
});

export type AppConfig = ReturnType<typeof configuration>;
