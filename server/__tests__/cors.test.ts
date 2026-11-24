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
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('leaves no-origin requests to normal authentication without emitting CORS headers', () => {
    expect(invokeOrigin(undefined)).toHaveBeenCalledWith(null, false);
  });

  it('allows configured origins and rejects unlisted origins', () => {
    process.env.CORS_ALLOWED_ORIGINS = 'https://zip.example, https://app.example';

    expect(invokeOrigin('https://zip.example')).toHaveBeenCalledWith(null, true);
    expect(invokeOrigin('https://evil.example')).toHaveBeenCalledWith(expect.any(Error));
  });
});
