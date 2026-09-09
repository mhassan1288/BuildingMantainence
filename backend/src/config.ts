import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'development-only-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  corsOrigin: process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN ?? '*',
  nodeEnv: process.env.NODE_ENV ?? 'development',
};

if (config.nodeEnv === 'production') {
  if (!config.databaseUrl) throw new Error('DATABASE_URL is required in production');
  if (!process.env.JWT_SECRET || config.jwtSecret === 'development-only-secret') {
    throw new Error('A strong JWT_SECRET is required in production');
  }
  if (config.corsOrigin === '*') throw new Error('CORS_ORIGINS must be explicit in production');
}
