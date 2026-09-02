import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildCorsOptions } from '../utils/cors';

const originalEnv = { ...process.env };

function invokeOrigin(origin: string | undefined) {
  const options = buildCorsOptions();
  const originHandler = options.origin as (
    origin: string | undefined,
    callback: (error: Error | null, allowed?: boolean) => void
  ) => void;
  const callback = vi.fn();

  originHandler(origin, callback);

  return callback;
}

describe('buildCorsOptions', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.CORS_ALLOWED_ORIGINS;
    delete process.env.CORS_ORIGIN;
    delete process.env.CORS_ALLOW_NO_ORIGIN;
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('rejects no-origin requests unless explicitly allowed', () => {
    const callback = invokeOrigin(undefined);

    expect(callback).toHaveBeenCalledWith(expect.any(Error));
  });

  it('allows no-origin requests when explicitly configured', () => {
    process.env.CORS_ALLOW_NO_ORIGIN = 'true';

    const callback = invokeOrigin(undefined);

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('allows configured origins and rejects unlisted origins', () => {
    process.env.CORS_ALLOWED_ORIGINS = 'https://zip.example, https://app.example';

    expect(invokeOrigin('https://zip.example')).toHaveBeenCalledWith(null, true);
    expect(invokeOrigin('https://evil.example')).toHaveBeenCalledWith(expect.any(Error));
  });
});
