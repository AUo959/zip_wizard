import type { CorsOptions } from 'cors';

function parseOrigins(raw?: string): string[] {
  if (!raw) {
    return process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5000'];
  }
  return raw
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

export function buildCorsOptions(): CorsOptions {
  const allowedOrigins = parseOrigins(process.env.CORS_ALLOWED_ORIGINS ?? process.env.CORS_ORIGIN);
  const allowCredentials = process.env.CORS_ALLOW_CREDENTIALS === 'true';

  return {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, false);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin not allowed by CORS policy'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-ZipWizard-Archive-Truncated', 'X-ZipWizard-Skipped-Entries'],
    credentials: allowCredentials,
  };
}
