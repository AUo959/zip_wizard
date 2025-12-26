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
});
