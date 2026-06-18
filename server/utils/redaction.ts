interface RedactionResult {
  redacted: string;
  preview: string;
  findings: string[];
}

const MAX_PREVIEW_LENGTH = 50_000;
const DEFAULT_PREVIEW_LENGTH = 1200;

type RedactionPattern = {
  label: string;
  redact: (_input: string) => { redacted: string; matched: boolean };
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

function isCardCandidateChar(char: string): boolean {
  return isDigit(char) || char === ' ' || char === '-';
}

function readCardCandidate(
  input: string,
  start: number
): { raw: string; digits: string; end: number } {
  let raw = '';
  let digits = '';
  let cursor = start;

  while (cursor < input.length && raw.length < 32 && isCardCandidateChar(input.charAt(cursor))) {
    const char = input.charAt(cursor);
    raw += char;
    if (isDigit(char)) digits += char;
    cursor += 1;
  }

  return { raw, digits, end: cursor };
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

    const candidate = readCardCandidate(input, index);
    if (isValidLuhn(candidate.digits)) {
      redacted += '[REDACTED_CARD]';
      matched = true;
    } else {
      redacted += candidate.raw;
    }

    index = candidate.end;
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

function shouldContinuePhoneScan(input: string, start: number, cursor: number): boolean {
  return cursor < input.length && cursor - start < 24;
}

function scanPhoneCandidate(
  input: string,
  start: number
): { digits: string; hasSeparator: boolean; scanLength: number } {
  let digits = '';
  let hasSeparator = false;
  let cursor = start;

  while (shouldContinuePhoneScan(input, start, cursor)) {
    const char = input.charAt(cursor);
    const nextChar = input.charAt(cursor + 1);

    if (!isDigit(char) && !isPhoneSeparator(char, nextChar)) break;
    if (isDigit(char)) digits += char;
    if (isPhoneSeparator(char, nextChar)) hasSeparator = true;
    cursor += 1;
  }

  return { digits, hasSeparator, scanLength: cursor - start };
}

function readPhoneCandidate(
  input: string,
  start: number
): { matchLength: number; scanLength: number } {
  const candidate = scanPhoneCandidate(input, start);
  const hasPhoneDigits =
    candidate.digits.length === 10 ||
    (candidate.digits.length === 11 && candidate.digits.charAt(0) === '1');
  return {
    matchLength: candidate.hasSeparator && hasPhoneDigits ? candidate.scanLength : 0,
    scanLength: candidate.scanLength,
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
