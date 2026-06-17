interface RedactionResult {
  redacted: string;
  preview: string;
  findings: string[];
}

const MAX_PREVIEW_LENGTH = 50_000;
const DEFAULT_PREVIEW_LENGTH = 1200;

type RedactionPattern = {
  label: string;
  redact: (input: string) => { redacted: string; matched: boolean };
};

function normalizePreviewLength(previewLength: number): number {
  if (!Number.isFinite(previewLength)) return DEFAULT_PREVIEW_LENGTH;
  return Math.min(Math.max(Math.trunc(previewLength), 0), MAX_PREVIEW_LENGTH);
}

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9';
}

function isValidLuhn(candidate: string): boolean {
  let digits = '';
  for (let index = 0; index < candidate.length; index += 1) {
    const char = candidate.charAt(index);
    if (isDigit(char)) {
      digits += char;
    }
  }

  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    const char = digits.charAt(index);
    let digit = Number(char);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function replaceRegexMatches(input: string, regex: RegExp, replacement: string) {
  const redacted = input.replace(regex, replacement);
  return { redacted, matched: redacted !== input };
}

function redactCreditCards(input: string) {
  let redacted = '';
  let matched = false;
  let index = 0;

  while (index < input.length) {
    const current = input.charAt(index);

    if (!isDigit(current)) {
      redacted += current;
      index += 1;
      continue;
    }

    let raw = '';
    let digits = '';
    let cursor = index;

    while (cursor < input.length && raw.length < 32) {
      const char = input.charAt(cursor);
      if (isDigit(char)) {
        digits += char;
      } else if (char !== ' ' && char !== '-') {
        break;
      }
      raw += char;
      cursor += 1;
    }

    if (isValidLuhn(digits)) {
      redacted += '[REDACTED_CARD]';
      matched = true;
    } else {
      redacted += raw;
    }

    index = cursor;
  }

  return { redacted, matched };
}

function isPhoneStart(char: string): boolean {
  return char === '+' || char === '(' || isDigit(char);
}

function isPhoneSeparator(char: string, nextChar: string): boolean {
  return (
    char === ' ' ||
    char === '-' ||
    char === '(' ||
    char === ')' ||
    (char === '.' && isDigit(nextChar))
  );
}

function readPhoneCandidate(
  input: string,
  start: number
): { matchLength: number; scanLength: number } {
  let digits = '';
  let hasSeparator = false;
  let cursor = start;

  while (cursor < input.length && cursor - start < 24) {
    const char = input.charAt(cursor);
    const nextChar = input.charAt(cursor + 1);

    if (isDigit(char)) {
      digits += char;
    } else if (isPhoneSeparator(char, nextChar)) {
      hasSeparator = true;
    } else {
      break;
    }

    cursor += 1;
  }

  const hasPhoneDigits = digits.length === 10 || (digits.length === 11 && digits.charAt(0) === '1');
  const scanLength = cursor - start;
  return {
    matchLength: hasSeparator && hasPhoneDigits ? scanLength : 0,
    scanLength,
  };
}

function redactPhoneNumbers(input: string) {
  let redacted = '';
  let matched = false;
  let index = 0;

  while (index < input.length) {
    const current = input.charAt(index);
    const candidate = isPhoneStart(current)
      ? readPhoneCandidate(input, index)
      : { matchLength: 0, scanLength: 0 };

    if (candidate.matchLength > 0) {
      redacted += '[REDACTED_PHONE]';
      matched = true;
      index += candidate.matchLength;
      continue;
    }

    if (candidate.scanLength > 1) {
      redacted += input.slice(index, index + candidate.scanLength);
      index += candidate.scanLength;
      continue;
    }

    redacted += current;
    index += 1;
  }

  return { redacted, matched };
}

const redactionPatterns: RedactionPattern[] = [
  {
    label: 'credit_card',
    redact: redactCreditCards,
  },
  {
    label: 'email',
    redact: input =>
      replaceRegexMatches(input, /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, '[REDACTED_EMAIL]'),
  },
  {
    label: 'phone',
    redact: redactPhoneNumbers,
  },
  {
    label: 'ssn',
    redact: input => replaceRegexMatches(input, /\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]'),
  },
];

/**
 * Lightweight PII redaction for persisted/returned content.
 */
export function redactContent(content: string, previewLength = 1200): RedactionResult {
  let redacted = content;
  const findings: string[] = [];

  redactionPatterns.forEach(pattern => {
    const result = pattern.redact(redacted);
    redacted = result.redacted;

    if (result.matched) {
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
