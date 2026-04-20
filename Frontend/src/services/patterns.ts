export const PATTERNS = {
  // JWT: three base64-like segments separated by dots
  JWT: /^[\w-]*\.[\w-]*\.[\w-]*$/,

  // Base64: at least 20 characters of base64 characters
  BASE64: /^[A-Za-z0-9+/]{20,}={0,2}$/,

  // Email
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

  // Phone number
  PHONE: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,

  // AWS Access Key ID
  AWS_KEY: /^AKIA[0-9A-Z]{16}$/,

  // GitHub Token
  GITHUB_TOKEN: /^ghp_[a-zA-Z0-9]{36}$/,

  // Credit Card (13-19 digits)
  CREDIT_CARD: /\b\d{13,19}\b/g,

  // Social Security Number (XXX-XX-XXXX)
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,

  // API Key patterns
  API_KEY: /[a-zA-Z0-9]{20,}/g,

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

export function detectPatterns(value: string): string[] {
  const detected: string[] = [];

  if (PATTERNS.JWT.test(value)) {
    detected.push('JWT');
  }

  if (PATTERNS.BASE64.test(value)) {
    detected.push('BASE64');
  }

  if (PATTERNS.AWS_KEY.test(value)) {
    detected.push('AWS_KEY');
  }

  if (PATTERNS.GITHUB_TOKEN.test(value)) {
    detected.push('GITHUB_TOKEN');
  }

  if (PATTERNS.BEARER.test(value)) {
    detected.push('BEARER');
  }

  if (PATTERNS.EMAIL.test(value)) {
    detected.push('EMAIL');
  }

  if (PATTERNS.PHONE.test(value)) {
    detected.push('PHONE');
  }

  if (PATTERNS.CREDIT_CARD.test(value)) {
    detected.push('CREDIT_CARD');
  }

  if (PATTERNS.SSN.test(value)) {
    detected.push('SSN');
  }

  return detected;
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
