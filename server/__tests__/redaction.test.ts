import { describe, expect, it } from 'vitest';
import { redactContent } from '../utils/redaction';

describe('redactContent', () => {
  it('redacts emails and phone numbers and returns a preview', () => {
    const sample =
      'Reach us at admin@example.com or call +1 (555) 123-4567. Do not leak 123-45-6789.';

    const result = redactContent(sample, 80);

    expect(result.redacted).not.toContain('admin@example.com');
    expect(result.redacted).toContain('[REDACTED_EMAIL]');
    expect(result.redacted).toContain('[REDACTED_PHONE]');
    expect(result.preview.length).toBeLessThanOrEqual(80);
    expect(result.findings).toEqual(expect.arrayContaining(['email', 'phone', 'ssn']));
  });

  it('redacts repeated matches without skipping due to global regex state', () => {
    const sample = 'alpha@example.com beta@example.com gamma@example.com';

    const result = redactContent(sample);

    expect(result.redacted).not.toContain('@example.com');
    expect(result.redacted.match(/\[REDACTED_EMAIL\]/g)).toHaveLength(3);
    expect(result.findings).toContain('email');
  });

  it('only redacts credit card candidates that pass Luhn validation', () => {
    const sample = 'Valid card 4111 1111 1111 1111, fake sequence 1111 1111 1111 1111.';

    const result = redactContent(sample);

    expect(result.redacted).toContain('[REDACTED_CARD]');
    expect(result.redacted).toContain('1111 1111 1111 1111');
    expect(result.findings).toContain('credit_card');
  });

  it('clamps unsafe preview lengths', () => {
    const result = redactContent('abcdef', -5);

    expect(result.preview).toBe('');
  });
});
