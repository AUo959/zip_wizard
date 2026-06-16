interface RedactionResult {
  redacted: string;
  preview: string;
  findings: string[];
}

const MAX_PREVIEW_LENGTH = 50_000;
const DEFAULT_PREVIEW_LENGTH = 1200;

type RedactionPattern = {
  label: string;
  regex: RegExp;
  replacement: string;
  validate?: (candidate: string) => boolean;
};

function normalizePreviewLength(previewLength: number): number {
  if (!Number.isFinite(previewLength)) return DEFAULT_PREVIEW_LENGTH;
  return Math.min(Math.max(Math.trunc(previewLength), 0), MAX_PREVIEW_LENGTH);
}

function isValidLuhn(candidate: string): boolean {
  const digits = candidate.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

const redactionPatterns: RedactionPattern[] = [
  {
    label: 'credit_card',
    regex: /\b(?:\d[ -]?){13,19}\b/g,
    replacement: '[REDACTED_CARD]',
    validate: isValidLuhn,
  },
  {
    label: 'email',
    regex: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,
    replacement: '[REDACTED_EMAIL]',
  },
  {
    label: 'phone',
    regex: /\b(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]\d{3}[-.\s]\d{4}\b/g,
    replacement: '[REDACTED_PHONE]',
  },
  { label: 'ssn', regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[REDACTED_SSN]' },
];

/**
 * Lightweight PII redaction for persisted/returned content.
 */
export function redactContent(content: string, previewLength = 1200): RedactionResult {
  let redacted = content;
  const findings: string[] = [];

  redactionPatterns.forEach(pattern => {
    let matched = false;
    redacted = redacted.replace(pattern.regex, match => {
      if (pattern.validate && !pattern.validate(match)) {
        return match;
      }
      matched = true;
      return pattern.replacement;
    });

    if (matched) {
      findings.push(pattern.label);
    }
  });

  const safePreview = redacted.slice(0, normalizePreviewLength(previewLength));

  return {
    redacted,
    preview: safePreview,
    findings,
  };
}
