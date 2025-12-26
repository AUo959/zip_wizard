interface RedactionResult {
  redacted: string;
  preview: string;
  findings: string[];
}

const redactionPatterns: { label: string; regex: RegExp; replacement: string }[] = [
  { label: 'email', regex: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, replacement: '[REDACTED_EMAIL]' },
  { label: 'phone', regex: /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g, replacement: '[REDACTED_PHONE]' },
  { label: 'ssn', regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[REDACTED_SSN]' },
  { label: 'credit_card', regex: /\b(?:\d[ -]*?){13,19}\b/g, replacement: '[REDACTED_CARD]' },
];

/**
 * Lightweight PII redaction for persisted/returned content.
 */
export function redactContent(content: string, previewLength = 1200): RedactionResult {
  let redacted = content;
  const findings: string[] = [];

  redactionPatterns.forEach(pattern => {
    pattern.regex.lastIndex = 0;
    if (pattern.regex.test(redacted)) {
      findings.push(pattern.label);
      redacted = redacted.replace(pattern.regex, pattern.replacement);
    }
  });

  const safePreview = redacted.slice(0, previewLength);

  return {
    redacted,
    preview: safePreview,
    findings,
  };
}
