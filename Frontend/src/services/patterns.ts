export const PATTERNS = {
  // JWT: three base64-like segments separated by dots
  JWT: /^[\w-]*\.[\w-]*\.[\w-]*$/,

  // Base64: at least 20 characters of base64 characters
  BASE64: /^[A-Za-z0-9+/]{20,}={0,2}$/,

  // Email
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,

  // Phone number
  PHONE: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,

  // AWS Access Key ID
  AWS_KEY: /^AKIA[0-9A-Z]{16}$/,

  // GitHub Token
  GITHUB_TOKEN: /^ghp_[a-zA-Z0-9]{36}$/,

  // Credit Card (13-19 digits)
  CREDIT_CARD: /\b\d{13,19}\b/,

  // Social Security Number (XXX-XX-XXXX)
  SSN: /\b\d{3}-\d{2}-\d{4}\b/,

  // API Key patterns
  API_KEY: /[a-zA-Z0-9]{20,}/,

  // Bearer token
  BEARER: /^Bearer\s+[\w.-]+$/i,
};

export const SENSITIVE_KEYWORDS = [
  'token',
  'auth',
  'password',
  'secret',
  'key',
  'credential',
  'api_key',
  'private',
  'access',
  'bearer',
  'authorization',
  'session',
  'nonce',
  'csrf',
  'jwt',
];

export function detectPatterns(value: string, keyName?: string): string[] {
  const detected: string[] = [];
  const val = String(value || '');

  if (PATTERNS.JWT.test(val)) {
    detected.push('JWT');
  }

  if (PATTERNS.BASE64.test(val)) {
    detected.push('BASE64');
  }

  if (PATTERNS.AWS_KEY.test(val)) {
    detected.push('AWS_KEY');
  }

  if (PATTERNS.GITHUB_TOKEN.test(val)) {
    detected.push('GITHUB_TOKEN');
  }

  if (PATTERNS.BEARER.test(val)) {
    detected.push('BEARER');
  }

  if (PATTERNS.EMAIL.test(val)) {
    detected.push('EMAIL');
  }

  if (PATTERNS.PHONE.test(val)) {
    detected.push('PHONE');
  }

  if (hasValidatedCardNumber(val, keyName)) {
    detected.push('CREDIT_CARD');
  }

  if (PATTERNS.SSN.test(val)) {
    detected.push('SSN');
  }

  return detected;
}

function hasValidatedCardNumber(value: string, keyName?: string): boolean {
  const candidates = String(value || '').match(/(?:\d[ -]?){13,19}/g) || [];
  const hasCardContext = /(card|credit|debit|payment|pan|ccnum|cardnumber|billing)/i.test(
    String(keyName || '')
  );

  for (const candidate of candidates) {
    const digits = candidate.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) continue;
    if (!passesLuhn(digits)) continue;

    if (
      /^4\d{12}(\d{3})?$/.test(digits) ||
      /^5[1-5]\d{14}$/.test(digits) ||
      /^3[47]\d{13}$/.test(digits) ||
      /^6(?:011|5\d{2})\d{12}$/.test(digits) ||
      /^3(?:0[0-5]|[68]\d)\d{11}$/.test(digits)
    ) {
      return true;
    }

    if (hasCardContext) return true;
  }

  return false;
}

function passesLuhn(cardNumber: string): boolean {
  let sum = 0;
  let isEven = false;

  for (let i = cardNumber.length - 1; i >= 0; i -= 1) {
    let digit = Number(cardNumber[i]);
    if (Number.isNaN(digit)) return false;

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

export function detectKeywords(value: string, keyName?: string): string[] {
  const detected: string[] = [];
  const lowerValue = value.toLowerCase();
  const lowerKeyName = keyName?.toLowerCase() || '';

  SENSITIVE_KEYWORDS.forEach((keyword) => {
    if (
      lowerValue.includes(keyword) ||
      lowerKeyName.includes(keyword)
    ) {
      if (!detected.includes(keyword)) {
        detected.push(keyword);
      }
    }
  });

  return detected;
}
