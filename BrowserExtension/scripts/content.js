(() => {
  const SENSITIVE_KEYWORDS = [
    "token",
    "auth",
    "password",
    "secret",
    "key",
    "credential",
    "api_key",
    "private",
    "access",
    "bearer",
    "authorization",
    "session",
    "nonce",
    "csrf",
    "jwt"
  ];

  const PATTERNS = {
    // Basic patterns
    JWT: /^[\w-]*\.[\w-]*\.[\w-]*$/,
    BASE64: /^[A-Za-z0-9+/]{20,}={0,2}$/,
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    PHONE: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
    BEARER: /^Bearer\s+[\w.-]+$/i,
    
    // Level 3: Advanced patterns
    // Credit card patterns
    VISA: /\b(?:4[0-9]{12}(?:[0-9]{3})?)\b/,
    MASTERCARD: /\b(?:5[1-5][0-9]{14})\b/,
    AMEX: /\b(?:3[47][0-9]{13})\b/,
    DISCOVER: /\b(?:6(?:011|5[0-9]{2})[0-9]{12})\b/,
    DINERS: /\b(?:3(?:0[0-5]|[68][0-9])[0-9]{11})\b/,
    
    // API key patterns (Level 3 enhancement)
    AWS_ACCESS: /\b(?:ASIA[0-9A-Z]{16})\b/,
    AWS_SECRET: /(?:aws_secret_access_key|aws_access_key_id)["\']?\s*[:=]\s*["\']?([A-Za-z0-9\/+=]{40})/i,
    GITHUB_TOKEN: /^(?:ghp_|gho_|ghu_)[A-Za-z0-9_]{36,255}$/,
    GITHUB_PAT: /ghp_[A-Za-z0-9_]{36,255}/,
    GITHUB_OAUTH: /gho_[A-Za-z0-9_]{36,255}/,
    GITHUB_APP: /ghu_[A-Za-z0-9_]{36,255}/,
    SLACK_BOT: /xoxb-[0-9]{10,13}-[0-9]{10,13}-[A-Za-z0-9]{24,34}/,
    SLACK_USER: /xoxp-[0-9]{10,13}-[0-9]{10,13}-[0-9]{10,13}-[A-Za-z0-9]{32}/,
    STRIPE_TEST: /sk_test_[A-Za-z0-9]{24,}/,
    STRIPE_LIVE: /sk_live_[A-Za-z0-9]{24,}/,
    HEROKU_API: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
    CLOUDFLARE: /Bearer [A-Za-z0-9_-]{40,}/,
    MONGODB_URI: /mongodb(?:\+srv)?:\/\/[^@\s]+@/,
    DATABASE_URL: /(?:postgresql|mysql|mongodb):\/\/[^\s]+/,
    PRIVATE_KEY: /-----BEGIN (?:RSA|OPENSSH|PRIVATE) KEY-----/,
    
    // Legacy patterns
    AWS_KEY: /^AKIA[0-9A-Z]{16}$/,
    CREDIT_CARD: /\b\d{13,19}\b/,
    SSN: /\b\d{3}-\d{2}-\d{4}\b/
  };

  const XSS_PATTERNS = {
    SCRIPT_TAG: /<script[\s\S]*?<\/script>/gi,
    EVENT_HANDLER: /on\w+\s*=\s*["'][^"']*["']/gi,
    JAVASCRIPT_URL: /javascript:/gi,
    IFRAME_INJECTION: /<iframe[\s\S]*?>/gi,
    IMG_ONERROR: /<img[\s\S]*?onerror[\s\S]*?>/gi,
    SVG_SCRIPT: /<svg[\s\S]*?<script[\s\S]*?<\/script>/gi,
    ENCODED_SCRIPT: /&#x3c;script|&#60;script|%3Cscript/gi
  };

  const HUNTER_MODE_STORAGE_KEY = "BMI_HUNTER_SCAN_MODE";
  const HUNTER_POLICY_STORAGE_KEY = "BMI_HUNTER_POLICY_V1";
  const HUNTER_SEVERITY_ORDER = { critical: 4, high: 3, medium: 2, low: 1 };
  const SECRET_PATTERNS = [
    "AWS_ACCESS",
    "AWS_SECRET",
    "AWS_KEY",
    "GITHUB_TOKEN",
    "GITHUB_PAT",
    "GITHUB_OAUTH",
    "GITHUB_APP",
    "SLACK_BOT",
    "SLACK_USER",
    "STRIPE_LIVE",
    "STRIPE_TEST",
    "PRIVATE_KEY",
    "DATABASE_URL",
    "MONGODB_URI"
  ];

  let hunterScanMode = "passive";
  let hunterPolicy = {
    killSwitch: false,
    allowlistHosts: [],
    maxScansPerMinute: 24,
    activeProfile: "",
    identityProfiles: []
  };
  let networkInstrumentationInstalled = false;
  const networkActivityLog = [];
  const hunterScanTimestamps = [];

  // ==================== LEVEL 3: ADVANCED DETECTION ====================

  // Shannon Entropy Calculator (detect random/high-entropy strings)
  function calculateEntropy(str) {
    if (!str || str.length === 0) return 0;

    const frequencies = {};
    for (const char of str) {
      frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    for (const count of Object.values(frequencies)) {
      const probability = count / str.length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy; // 0-8 bits per character
  }

  function isLikelyToken(str, minLength = 16) {
    if (str.length < minLength) return false;

    const entropy = calculateEntropy(str);
    const isHighEntropy = entropy > 4.0;
    const hasLowReadability = /^[A-Za-z0-9+/=_\-]*$/.test(str);
    const isNotCommonWords = !/^(password|secret|key|token|auth|test|demo|user)$/i.test(str);

    return isHighEntropy && hasLowReadability && isNotCommonWords;
  }

  // Credit card validation using Luhn algorithm
  function validateCreditCard(cardNumber) {
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  // Enhanced JWT validation
  function validateJWT(token) {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    try {
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));

      return (
        header?.alg &&
        (payload?.exp || payload?.iat || payload?.sub || payload?.aud || payload?.user_id)
      );
    } catch {
      return false;
    }
  }

  // DOM Scanner - find hidden inputs and sensitive data in page
  function scanDOMForSensitiveData() {
    const findings = [];

    // Scan hidden input fields
    const hiddenInputs = document.querySelectorAll('input[type="hidden"]');
    for (const input of hiddenInputs) {
      const { name, value } = input;
      if (!value) continue;

      const isSensitive = isSensitiveKeyName(name) || isLikelyToken(value);
      if (isSensitive) {
        findings.push({
          type: "hidden_input",
          name,
          valuePreview: maskValue(value),
          location: "DOM - Hidden Input",
          risk: "medium"
        });
      }
    }

    // Scan data attributes
    const dataElements = document.querySelectorAll("[data-token], [data-key], [data-api], [data-secret], [data-auth]");
    for (const elem of dataElements) {
      const attrs = Array.from(elem.attributes).filter((attr) =>
        /data-(token|key|api|secret|auth|password|credential)/i.test(attr.name)
      );

      for (const attr of attrs) {
        findings.push({
          type: "data_attribute",
          key: attr.name,
          valuePreview: maskValue(attr.value),
          location: `DOM - ${elem.tagName}`,
          risk: "high"
        });
      }
    }

    // Scan inline scripts for credential assignments
    const scripts = document.querySelectorAll("script:not([src])");
    for (const script of scripts) {
      const matches = script.textContent.match(/(api_key|token|password|secret|auth)\s*[:=]\s*["']([^"']{20,})["']/gi);
      if (matches) {
        findings.push({
          type: "inline_script",
          content: `Found ${matches.length} credential assignment(s)`,
          location: "DOM - Inline Script",
          risk: "critical"
        });
      }
    }

    return findings;
  }

  // URL Endpoint Detection
  function detectAPIEndpoints() {
    const endpoints = [];

    // Check current URL for API patterns
    const urlPatterns = /\/api\/v\d+\/[a-z0-9_\-]+|\/graphql|\/rest\/|\/webhooks?\/|\/oauth|\/auth/gi;
    const matches = window.location.href.match(urlPatterns);
    if (matches) {
      endpoints.push(
        ...matches.map((endpoint) => ({
          endpoint,
          type: "url_path",
          location: "Current URL",
          risk: "low"
        }))
      );
    }

    // Check for API-like hostnames
    const apiHosts = /api\.|api-|backend\.|gateway\.|service\.|auth\./i;
    if (apiHosts.test(window.location.hostname)) {
      endpoints.push({
        endpoint: window.location.origin,
        type: "api_hostname",
        location: "Hostname",
        risk: "low"
      });
    }

    // Scan localStorage for API endpoints
    for (let i = 0; i < localStorage.length; i++) {
      const value = localStorage.getItem(localStorage.key(i)) || "";
      const apiMatches = value.match(urlPatterns);
      if (apiMatches) {
        endpoints.push(
          ...apiMatches.map((endpoint) => ({
            endpoint,
            type: "endpoint_in_storage",
            location: "localStorage",
            risk: "medium"
          }))
        );
      }
    }

    return endpoints;
  }

  function maskValue(value, showChars = 4) {
    if (value.length <= showChars) return "***";
    return value.substring(0, showChars) + "*".repeat(Math.max(3, value.length - showChars));
  }

  function isSensitiveKeyName(name) {
    const sensitivePatterns = [
      /token/i,
      /api/i,
      /key/i,
      /secret/i,
      /password/i,
      /auth/i,
      /credential/i,
      /session/i,
      /jwt/i,
      /bearer/i
    ];
    return sensitivePatterns.some((pattern) => pattern.test(name));
  }

  // ==================== END LEVEL 3 ====================

  async function hydrateHunterMode() {
    try {
      const stored = await chrome.storage.local.get(HUNTER_MODE_STORAGE_KEY);
      const mode = String(stored?.[HUNTER_MODE_STORAGE_KEY] || "passive").toLowerCase();
      hunterScanMode = mode === "active" ? "active" : "passive";
    } catch (_err) {
      hunterScanMode = "passive";
    }
  }

  async function hydrateHunterPolicy() {
    try {
      const stored = await chrome.storage.local.get(HUNTER_POLICY_STORAGE_KEY);
      const rawPolicy = stored?.[HUNTER_POLICY_STORAGE_KEY];
      if (!rawPolicy || typeof rawPolicy !== "object") {
        return;
      }

      hunterPolicy = {
        ...hunterPolicy,
        ...rawPolicy,
        allowlistHosts: Array.isArray(rawPolicy.allowlistHosts)
          ? rawPolicy.allowlistHosts.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean)
          : [],
        maxScansPerMinute: Number.isFinite(Number(rawPolicy.maxScansPerMinute))
          ? Math.min(120, Math.max(1, Math.floor(Number(rawPolicy.maxScansPerMinute))))
          : 24,
        activeProfile: String(rawPolicy.activeProfile || "").trim(),
        identityProfiles: Array.isArray(rawPolicy.identityProfiles)
          ? rawPolicy.identityProfiles
              .filter((item) => item && typeof item === "object")
              .map((item) => ({
                name: String(item.name || "").trim(),
                role: String(item.role || "user").trim(),
                ids: Array.isArray(item.ids) ? item.ids.map((id) => String(id)) : []
              }))
              .filter((item) => item.name)
          : []
      };
    } catch (_err) {
      // Keep previously loaded/default policy.
    }
  }

  function hostAllowedByPolicy(host) {
    const allowlist = hunterPolicy.allowlistHosts || [];
    if (!allowlist.length) return true;

    const normalizedHost = String(host || "").toLowerCase();
    return allowlist.some((entry) => {
      const normalizedEntry = String(entry || "").toLowerCase();
      if (!normalizedEntry) return false;
      return normalizedHost === normalizedEntry || normalizedHost.endsWith(`.${normalizedEntry}`);
    });
  }

  function consumeScanBudget() {
    const now = Date.now();
    const oneMinuteAgo = now - 60_000;

    while (hunterScanTimestamps.length > 0 && hunterScanTimestamps[0] < oneMinuteAgo) {
      hunterScanTimestamps.shift();
    }

    const budget = Number(hunterPolicy.maxScansPerMinute || 24);
    if (hunterScanTimestamps.length >= budget) {
      return false;
    }

    hunterScanTimestamps.push(now);
    return true;
  }

  function appendNetworkLog(entry) {
    networkActivityLog.push({
      ...entry,
      timestamp: Date.now()
    });
    if (networkActivityLog.length > 300) {
      networkActivityLog.splice(0, networkActivityLog.length - 300);
    }
  }

  function installNetworkInstrumentation() {
    if (networkInstrumentationInstalled) return;
    networkInstrumentationInstalled = true;

    try {
      const originalFetch = window.fetch?.bind(window);
      if (originalFetch) {
        window.fetch = async (...args) => {
          let url = "unknown";
          let method = "GET";
          let credentials = "same-origin";
          let mode = "cors";
          let targetOrigin = "unknown";

          try {
            const resource = args[0];
            const init = args[1] || {};
            url = typeof resource === "string" ? resource : resource?.url || "unknown";
            method = String(init.method || (typeof resource !== "string" ? resource?.method : "GET") || "GET").toUpperCase();
            credentials = String(init.credentials || (typeof resource !== "string" ? resource?.credentials : "same-origin") || "same-origin");
            mode = String(init.mode || (typeof resource !== "string" ? resource?.mode : "cors") || "cors");
            targetOrigin = new URL(url, window.location.origin).origin;
          } catch (_err) {
            // Ignore parse errors and proceed.
          }

          try {
            const response = await originalFetch(...args);
            appendNetworkLog({
              type: "fetch",
              url,
              method,
              status: response?.status ?? null,
              credentials,
              mode,
              origin: window.location.origin,
              targetOrigin,
              crossOrigin: targetOrigin !== "unknown" && targetOrigin !== window.location.origin
            });
            return response;
          } catch (error) {
            appendNetworkLog({
              type: "fetch",
              url,
              method,
              status: null,
              error: true,
              credentials,
              mode,
              origin: window.location.origin,
              targetOrigin,
              crossOrigin: targetOrigin !== "unknown" && targetOrigin !== window.location.origin
            });
            throw error;
          }
        };
      }
    } catch (_err) {
      // Ignore instrumentation failures.
    }

    try {
      const originalOpen = XMLHttpRequest.prototype.open;
      const originalSend = XMLHttpRequest.prototype.send;

      XMLHttpRequest.prototype.open = function patchedOpen(method, url, ...rest) {
        this.__bmiMethod = String(method || "GET").toUpperCase();
        this.__bmiUrl = String(url || "unknown");
        return originalOpen.call(this, method, url, ...rest);
      };

      XMLHttpRequest.prototype.send = function patchedSend(...args) {
        this.addEventListener("loadend", () => {
          let targetOrigin = "unknown";
          try {
            targetOrigin = new URL(this.__bmiUrl || "", window.location.origin).origin;
          } catch (_err) {
            targetOrigin = "unknown";
          }
          appendNetworkLog({
            type: "xhr",
            url: this.__bmiUrl || "unknown",
            method: this.__bmiMethod || "GET",
            status: Number.isFinite(this.status) ? this.status : null,
            withCredentials: Boolean(this.withCredentials),
            origin: window.location.origin,
            targetOrigin,
            crossOrigin: targetOrigin !== "unknown" && targetOrigin !== window.location.origin
          });
        });
        return originalSend.call(this, ...args);
      };
    } catch (_err) {
      // Ignore instrumentation failures.
    }
  }

  function createHunterFinding({ category, title, severity, confidence, path, evidence, remediation, verified = false, references = [] }) {
    return {
      id: `hunter:${category}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`,
      category,
      title,
      severity,
      confidence,
      host: window.location.host,
      path: path || window.location.pathname || "/",
      evidence: evidence || [],
      verified,
      remediation: remediation || [],
      references,
      firstSeen: Date.now(),
      lastSeen: Date.now()
    };
  }

  function dedupeHunterFindings(findings) {
    const seen = new Set();
    const unique = [];
    for (const finding of findings) {
      const fingerprint = `${finding.category}:${finding.path}:${finding.title}`;
      if (seen.has(fingerprint)) continue;
      seen.add(fingerprint);
      unique.push(finding);
    }
    return unique;
  }

  function sortHunterFindings(findings) {
    return [...findings].sort((a, b) => {
      const bySeverity = (HUNTER_SEVERITY_ORDER[b.severity] || 0) - (HUNTER_SEVERITY_ORDER[a.severity] || 0);
      if (bySeverity !== 0) return bySeverity;
      return (b.confidence || 0) - (a.confidence || 0);
    });
  }

  function collectDocumentSecuritySignals() {
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute("content") || "";
    const hasFrameAncestors = /frame-ancestors/i.test(cspMeta);
    const hasUnsafeInline = /unsafe-inline/i.test(cspMeta);
    const hasUnsafeEval = /unsafe-eval/i.test(cspMeta);

    const postForms = Array.from(document.querySelectorAll("form"))
      .filter((form) => String(form.method || "get").toLowerCase() === "post")
      .map((form) => ({
        action: form.getAttribute("action") || window.location.pathname,
        hasCsrfField: Boolean(form.querySelector('input[name*="csrf" i], input[name*="token" i], input[name*="nonce" i]'))
      }));

    return {
      cspMeta,
      hasFrameAncestors,
      hasUnsafeInline,
      hasUnsafeEval,
      postForms
    };
  }

  function extractResourceIdsFromString(value) {
    const str = String(value || "");
    const numericIds = str.match(/\b\d{2,12}\b/g) || [];
    const uuidIds = str.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi) || [];
    return [...new Set([...numericIds, ...uuidIds])];
  }

  function detectIdorCandidates(context) {
    const findings = [];
    const endpointSamples = [];

    for (const endpoint of context.endpoints || []) {
      endpointSamples.push(String(endpoint.endpoint || ""));
    }
    for (const req of context.networkActivity || []) {
      endpointSamples.push(String(req.url || ""));
    }

    const idBearing = endpointSamples.filter((item) => /\/(users?|accounts?|orders?|profiles?|invoices?|projects?)\//i.test(item));
    const observedIds = idBearing.flatMap((item) => extractResourceIdsFromString(item));
    const uniqueIds = [...new Set(observedIds)];
    const profiles = Array.isArray(hunterPolicy.identityProfiles) ? hunterPolicy.identityProfiles : [];
    const activeProfile = String(hunterPolicy.activeProfile || "").trim();

    const matchedProfiles = profiles
      .map((profile) => ({
        name: profile.name,
        role: profile.role,
        matched: (profile.ids || []).filter((id) => uniqueIds.includes(String(id)))
      }))
      .filter((item) => item.matched.length > 0);

    const activeProfileMatch = matchedProfiles.find((item) => item.name === activeProfile);
    const crossProfileMismatch = Boolean(activeProfileMatch)
      && matchedProfiles.some((item) => item.name !== activeProfile);

    if (idBearing.length >= 1 && uniqueIds.length >= 1) {
      findings.push(createHunterFinding({
        category: "idor_bola",
        title: crossProfileMismatch
          ? "Potential cross-profile object access indicator (IDOR/BOLA)"
          : "Potential IDOR/BOLA candidate route discovered",
        severity: crossProfileMismatch ? "high" : (uniqueIds.length > 1 ? "high" : "medium"),
        confidence: crossProfileMismatch ? 0.82 : (uniqueIds.length > 1 ? 0.72 : 0.55),
        path: window.location.pathname,
        evidence: [
          {
            requestFingerprint: `idor-candidate:${uniqueIds.slice(0, 3).join(",")}`,
            endpoint: idBearing[0] || "unknown",
            method: "GET",
            signal: `ID-bearing endpoint pattern with ${uniqueIds.length} distinct identifier(s)`
          },
          ...(crossProfileMismatch
            ? [{
                requestFingerprint: `idor-profile-mismatch:${activeProfile || "none"}`,
                endpoint: idBearing[0] || "unknown",
                method: "GET",
                signal: `Observed identifiers mapped to multiple identity profiles while active profile is '${activeProfile}'`
              }]
            : [])
        ],
        remediation: [
          "Enforce object-level authorization checks on every resource access.",
          "Validate ownership/tenant boundaries server-side before returning data.",
          "Use deny-by-default authorization middleware for API routes."
        ],
        verified: crossProfileMismatch,
        references: ["OWASP API1:2023", "CWE-639"]
      }));
    }

    return findings;
  }

  function detectAuthAndTokenExposure(context) {
    const findings = [];
    const riskyEntries = (context.entries || []).filter((entry) => {
      const key = String(entry.key || "").toLowerCase();
      const value = String(entry.value || "");
      return (entry.type === "localStorage" || entry.type === "sessionStorage")
        && (/(token|jwt|auth|session|bearer)/i.test(key) || detectPatterns(value, entry.key).includes("JWT") || /^Bearer\s+/i.test(value));
    });

    if (riskyEntries.length > 0) {
      findings.push(createHunterFinding({
        category: "broken_auth",
        title: "Sensitive session/auth token stored in script-accessible storage",
        severity: "high",
        confidence: 0.86,
        path: window.location.pathname,
        evidence: riskyEntries.slice(0, 3).map((entry) => ({
          requestFingerprint: `${entry.type}:${entry.key}`,
          endpoint: entry.url || window.location.href,
          method: "N/A",
          signal: `${entry.type} key '${entry.key}' contains auth/session token indicators`,
          preview: maskValue(String(entry.value || ""))
        })),
        remediation: [
          "Move session tokens to HttpOnly + Secure cookies.",
          "Shorten token TTL and rotate refresh tokens.",
          "Add strong CSP to reduce XSS token exfiltration risk."
        ],
        verified: true,
        references: ["OWASP A07:2021", "CWE-922"]
      }));
    }

    return findings;
  }

  function detectSecretExposure(context) {
    const findings = [];
    const secretAlerts = [];

    for (const entry of context.entries || []) {
      const patterns = detectPatterns(entry.value, entry.key);
      const matched = patterns.filter((pattern) => SECRET_PATTERNS.includes(pattern));
      if (matched.length > 0) {
        secretAlerts.push({ entry, matched });
      }
    }

    if (secretAlerts.length > 0) {
      findings.push(createHunterFinding({
        category: "sensitive_data",
        title: "Client-side secret or high-value credential pattern detected",
        severity: "critical",
        confidence: 0.92,
        path: window.location.pathname,
        evidence: secretAlerts.slice(0, 4).map(({ entry, matched }) => ({
          requestFingerprint: `${entry.type}:${entry.key}`,
          endpoint: entry.url || window.location.href,
          method: "N/A",
          signal: `Matched secret pattern(s): ${matched.join(", ")}`,
          preview: maskValue(String(entry.value || ""))
        })),
        remediation: [
          "Revoke and rotate exposed secrets immediately.",
          "Store secrets server-side only and return short-lived scoped tokens.",
          "Remove hardcoded credentials from client bundles and storage."
        ],
        verified: true,
        references: ["CWE-798", "OWASP A02:2021"]
      }));
    }

    return findings;
  }

  function detectXssExposure(context) {
    const findings = [];
    const xssEntries = [];

    for (const entry of context.entries || []) {
      const xss = detectXSSPatterns(entry.value);
      if (xss.length > 0) {
        xssEntries.push({ entry, xss });
      }
    }

    if (xssEntries.length > 0) {
      findings.push(createHunterFinding({
        category: "xss",
        title: "Stored XSS pattern detected in browser-accessible data",
        severity: "high",
        confidence: 0.84,
        path: window.location.pathname,
        evidence: xssEntries.slice(0, 4).map(({ entry, xss }) => ({
          requestFingerprint: `${entry.type}:${entry.key}`,
          endpoint: entry.url || window.location.href,
          method: "N/A",
          signal: `Matched XSS pattern(s): ${xss.join(", ")}`,
          preview: maskValue(String(entry.value || ""))
        })),
        remediation: [
          "Sanitize untrusted input and encode output in DOM sinks.",
          "Set strict CSP and avoid inline scripts.",
          "Avoid persisting executable content in client storage."
        ],
        verified: false,
        references: ["OWASP A03:2021", "CWE-79"]
      }));
    }

    return findings;
  }

  function detectCsrfAndClickjacking(context) {
    const findings = [];
    const postForms = context.securitySignals?.postForms || [];
    const formsWithoutToken = postForms.filter((form) => !form.hasCsrfField);

    if (formsWithoutToken.length > 0) {
      findings.push(createHunterFinding({
        category: "csrf",
        title: "POST form(s) without visible CSRF token indicator",
        severity: "medium",
        confidence: 0.61,
        path: window.location.pathname,
        evidence: formsWithoutToken.slice(0, 3).map((form) => ({
          requestFingerprint: `post-form:${form.action}`,
          endpoint: form.action,
          method: "POST",
          signal: "No csrf/token/nonce hidden field detected"
        })),
        remediation: [
          "Use anti-CSRF tokens validated server-side.",
          "Set SameSite cookies appropriately for session cookies.",
          "Validate origin/referer for sensitive actions where possible."
        ],
        verified: false,
        references: ["OWASP A01:2021", "CWE-352"]
      }));
    }

    const cspMeta = context.securitySignals?.cspMeta || "";
    if (!context.securitySignals?.hasFrameAncestors) {
      findings.push(createHunterFinding({
        category: "clickjacking",
        title: "Frame-ancestors protection not visible from page metadata",
        severity: "medium",
        confidence: 0.45,
        path: window.location.pathname,
        evidence: [{
          requestFingerprint: "csp-frame-ancestors-missing",
          endpoint: window.location.href,
          method: "GET",
          signal: "No frame-ancestors directive detected in meta CSP",
          preview: cspMeta ? cspMeta.slice(0, 120) : "no meta CSP present"
        }],
        remediation: [
          "Set frame-ancestors 'none' or trusted origins in CSP response header.",
          "Add X-Frame-Options DENY/SAMEORIGIN for legacy browser coverage."
        ],
        verified: false,
        references: ["CWE-1021"]
      }));
    }

    if (context.securitySignals?.hasUnsafeInline || context.securitySignals?.hasUnsafeEval) {
      findings.push(createHunterFinding({
        category: "security_headers",
        title: "Weak CSP directive detected (unsafe-inline or unsafe-eval)",
        severity: "medium",
        confidence: 0.7,
        path: window.location.pathname,
        evidence: [{
          requestFingerprint: "weak-csp",
          endpoint: window.location.href,
          method: "GET",
          signal: `CSP meta contains ${context.securitySignals.hasUnsafeInline ? "unsafe-inline" : ""} ${context.securitySignals.hasUnsafeEval ? "unsafe-eval" : ""}`.trim(),
          preview: String(cspMeta || "").slice(0, 140)
        }],
        remediation: [
          "Remove unsafe-inline and unsafe-eval from CSP.",
          "Use nonce/hash-based script policies.",
          "Deliver CSP via response headers for stronger enforcement."
        ],
        verified: true,
        references: ["OWASP A05:2021", "CWE-693"]
      }));
    }

    return findings;
  }

  function detectOpenRedirectIndicators() {
    const findings = [];
    const urlObj = new URL(window.location.href);
    const redirectKeys = ["next", "redirect", "return", "returnTo", "url", "target", "dest", "destination"];
    const suspicious = [];

    for (const key of redirectKeys) {
      const value = urlObj.searchParams.get(key);
      if (!value) continue;
      if (/^https?:\/\//i.test(value) || /^\/\//.test(value)) {
        suspicious.push({ key, value });
      }
    }

    if (suspicious.length > 0) {
      findings.push(createHunterFinding({
        category: "open_redirect",
        title: "Open redirect parameter indicator found in URL",
        severity: "medium",
        confidence: 0.68,
        path: window.location.pathname,
        evidence: suspicious.slice(0, 3).map((item) => ({
          requestFingerprint: `redirect-param:${item.key}`,
          endpoint: window.location.href,
          method: "GET",
          signal: `Parameter '${item.key}' contains external URL`,
          preview: item.value
        })),
        remediation: [
          "Use strict allowlist validation for redirect destinations.",
          "Prefer server-side route identifiers over direct URLs.",
          "Block protocol-relative and external redirects by default."
        ],
        verified: false,
        references: ["CWE-601"]
      }));
    }

    return findings;
  }

  function detectApiAndGraphqlIssues(context) {
    const findings = [];
    const endpoints = context.endpoints || [];
    const network = context.networkActivity || [];
    const graphqlEndpoints = endpoints.filter((item) => /graphql/i.test(String(item.endpoint || "")));

    if (graphqlEndpoints.length > 0) {
      const introspectionSeen = network.some((item) => /__schema|IntrospectionQuery/i.test(String(item.url || "")));
      findings.push(createHunterFinding({
        category: "graphql",
        title: introspectionSeen ? "GraphQL introspection query indicator observed" : "GraphQL endpoint exposed in client attack surface",
        severity: introspectionSeen ? "high" : "medium",
        confidence: introspectionSeen ? 0.74 : 0.6,
        path: window.location.pathname,
        evidence: graphqlEndpoints.slice(0, 3).map((item) => ({
          requestFingerprint: `graphql:${item.endpoint}`,
          endpoint: item.endpoint,
          method: "POST",
          signal: introspectionSeen ? "Introspection indicator observed in network activity" : "GraphQL route discovered"
        })),
        remediation: [
          "Disable introspection in production unless explicitly required.",
          "Apply resolver-level authorization checks for every object/field.",
          "Limit query depth/complexity and enforce strict schema validation."
        ],
        verified: false,
        references: ["OWASP API8:2023", "OWASP API1:2023"]
      }));
    }

    return findings;
  }

  function detectCorsIssues(context) {
    const findings = [];
    const network = context.networkActivity || [];
    const crossOriginWithCredentials = network.filter((item) =>
      item.crossOrigin && (String(item.credentials || "").toLowerCase() === "include" || item.withCredentials)
    );

    if (crossOriginWithCredentials.length > 0) {
      findings.push(createHunterFinding({
        category: "cors",
        title: "Cross-origin credentialed request activity observed",
        severity: "medium",
        confidence: 0.58,
        path: window.location.pathname,
        evidence: crossOriginWithCredentials.slice(0, 4).map((item) => ({
          requestFingerprint: `cors:${item.method}:${item.targetOrigin}`,
          endpoint: item.url || "unknown",
          method: item.method || "GET",
          signal: `Cross-origin request with credentials to ${item.targetOrigin || "unknown"}`
        })),
        remediation: [
          "Review CORS response headers on target API (origin allowlist and credentials policy).",
          "Avoid wildcard origins when credentials are allowed.",
          "Restrict cross-origin credential use to strictly required trusted origins."
        ],
        verified: false,
        references: ["CWE-942", "OWASP API8:2023"]
      }));
    }

    return findings;
  }

  function detectInjectionIndicators(context) {
    const findings = [];
    const signals = [];
    const suspiciousInput = /('|"|`|;|--|\/\*|\*\/|\bunion\b|\bselect\b|\bor\b\s+1=1|\$where|\$ne|\$regex)/i;

    for (const req of context.networkActivity || []) {
      const text = `${req.url || ""}`;
      if (suspiciousInput.test(text)) {
        signals.push(req);
      }
    }

    if (signals.length > 0) {
      findings.push(createHunterFinding({
        category: "sqli_nosqli",
        title: "Potential injection-style payload indicator observed in request patterns",
        severity: "medium",
        confidence: 0.52,
        path: window.location.pathname,
        evidence: signals.slice(0, 4).map((item) => ({
          requestFingerprint: `inj:${item.method}:${String(item.url || "").slice(0, 64)}`,
          endpoint: item.url || "unknown",
          method: item.method || "GET",
          signal: "Request URL contains SQLi/NoSQLi indicator tokens",
          preview: String(item.url || "").slice(0, 140)
        })),
        remediation: [
          "Use parameterized queries and strict server-side validation.",
          "Apply schema validation and reject dangerous operators by policy.",
          "Add centralized input sanitization and logging for suspicious payloads."
        ],
        verified: false,
        references: ["CWE-89", "CWE-943"]
      }));
    }

    return findings;
  }

  function runHunterDetectors(context) {
    const all = [];
    all.push(...detectAuthAndTokenExposure(context));
    all.push(...detectSecretExposure(context));
    all.push(...detectXssExposure(context));
    all.push(...detectInjectionIndicators(context));
    all.push(...detectCsrfAndClickjacking(context));
    all.push(...detectCorsIssues(context));
    all.push(...detectOpenRedirectIndicators(context));
    all.push(...detectApiAndGraphqlIssues(context));
    all.push(...detectIdorCandidates(context));

    return sortHunterFindings(dedupeHunterFindings(all));
  }

  function withTimeout(promise, timeoutMs, fallbackValue) {
    return Promise.race([
      promise,
      new Promise((resolve) => {
        setTimeout(() => resolve(fallbackValue), timeoutMs);
      })
    ]);
  }

  function detectKeywords(value, keyName) {
    const detected = [];
    const lowerValue = String(value || "").toLowerCase();
    const lowerKeyName = String(keyName || "").toLowerCase();

    for (const keyword of SENSITIVE_KEYWORDS) {
      if (lowerValue.includes(keyword) || lowerKeyName.includes(keyword)) {
        detected.push(keyword);
      }
    }

    return [...new Set(detected)];
  }

  function detectPatterns(value, keyName) {
    const detected = [];
    const val = String(value || "");

    for (const [name, pattern] of Object.entries(PATTERNS)) {
      // Card detection is handled separately with strict Luhn validation.
      if (["CREDIT_CARD", "VISA", "MASTERCARD", "AMEX", "DISCOVER", "DINERS"].includes(name)) {
        continue;
      }

      if (pattern.global || pattern.sticky) {
        pattern.lastIndex = 0;
      }

      if (pattern.test(val)) {
        detected.push(name);
      }
    }

    const cardPatterns = detectValidatedCardPatterns(val, keyName);
    detected.push(...cardPatterns);

    return detected;
  }

  function detectValidatedCardPatterns(value, keyName) {
    const detected = new Set();
    const candidates = String(value || "").match(/(?:\d[ -]?){13,19}/g) || [];
    const lowerKeyName = String(keyName || "").toLowerCase();
    const hasCardContext = /(card|credit|debit|payment|pan|ccnum|cardnumber|billing)/i.test(lowerKeyName);

    for (const candidate of candidates) {
      const digits = candidate.replace(/\D/g, "");
      if (digits.length < 13 || digits.length > 19) {
        continue;
      }

      if (!validateCreditCard(digits)) {
        continue;
      }

      if (/^4\d{12}(\d{3})?$/.test(digits)) {
        detected.add("VISA");
      } else if (/^5[1-5]\d{14}$/.test(digits)) {
        detected.add("MASTERCARD");
      } else if (/^3[47]\d{13}$/.test(digits)) {
        detected.add("AMEX");
      } else if (/^6(?:011|5\d{2})\d{12}$/.test(digits)) {
        detected.add("DISCOVER");
      } else if (/^3(?:0[0-5]|[68]\d)\d{11}$/.test(digits)) {
        detected.add("DINERS");
      } else if (hasCardContext) {
        detected.add("CREDIT_CARD");
      }
    }

    return [...detected];
  }

  // Level 3: Enhanced multi-factor risk scoring
  function scoreRisk(keywords, patterns, keyName, entryType, value) {
    let score = 0;
    const lowerKeyName = String(keyName || "").toLowerCase();

    // 1. Pattern detection (0-100)
    const patternScores = {
      PRIVATE_KEY: 100,
      DATABASE_URL: 92,
      AWS_SECRET: 90,
      CREDIT_CARD: 95,
      VISA: 95,
      MASTERCARD: 95,
      AMEX: 95,
      DISCOVER: 95,
      AWS_ACCESS: 88,
      GITHUB_TOKEN: 88,
      GITHUB_PAT: 88,
      SLACK_BOT: 85,
      SLACK_USER: 85,
      STRIPE_LIVE: 95,
      STRIPE_TEST: 85,
      HEROKU_API: 85,
      JWT: 80,
      BEARER: 75,
      MONGODB_URI: 85,
      AWS_KEY: 85
    };

    for (const pattern of patterns) {
      const patternScore = patternScores[pattern] || 50;
      score = Math.max(score, patternScore);
    }

    // 2. Keyword matching (0-60)
    if (keywords.length > 0) {
      score = Math.max(score, 40 + keywords.length * 5);
    }

    if (SENSITIVE_KEYWORDS.some((k) => lowerKeyName.includes(k))) {
      score = Math.max(score, 55);
    }

    // 3. Entropy analysis (Level 3 feature)
    if (value && value.length > 16) {
      const entropy = calculateEntropy(value);
      if (entropy > 6.5) {
        score = Math.max(score, 65);
      } else if (entropy > 4.0) {
        score = Math.max(score, 50);
      }
    }

    // 4. Luhn validation for credit cards (Level 3 feature)
    if (patterns.some((p) => ["VISA", "MASTERCARD", "AMEX", "DISCOVER", "DINERS"].includes(p))) {
      if (validateCreditCard(String(value || ""))) {
        score = 100;
      }
    }

    // 5. JWT payload validation (Level 3 feature)
    if (patterns.includes("JWT") && validateJWT(String(value || ""))) {
      score = Math.max(score, 90);
    }

    // 6. String characteristics (0-40)
    if (value && /^[A-Za-z0-9+/=_\-]{32,}$/.test(String(value))) {
      score = Math.max(score, 35);
    }

    // 7. Storage type considerations
    if (entryType === "indexedDB" && keywords.length > 0) score += 10;

    // Clamp score to 0-100 range
    score = Math.min(100, Math.max(0, score));

    // Level classification
    if (score >= 80) return "high";
    if (score >= 50) return "medium";
    return "low";
  }

  // Level 3: Enhanced recommendations with emoji indicators
  function buildRecommendation(riskLevel) {
    if (riskLevel === "high") {
      return "🔴 CRITICAL: Exposed sensitive data detected. Immediate action required. Remove from browser storage and move to secure server-side/session-only handling.";
    }
    if (riskLevel === "medium") {
      return "🟠 WARNING: Potentially sensitive data found. Validate necessity and consider encryption or alternative storage methods.";
    }
    return "🟢 INFO: Normal application data. No immediate action needed.";
  }

  function detectXSSPatterns(value) {
    const detected = [];
    const val = String(value || "");

    for (const [name, pattern] of Object.entries(XSS_PATTERNS)) {
      if (pattern.global || pattern.sticky) {
        pattern.lastIndex = 0;
      }
      if (pattern.test(val)) {
        detected.push(name);
      }
    }

    return detected;
  }

  function validateCookieSecurity(cookieName) {
    // Note: Content scripts can't access Set-Cookie headers or full cookie attributes
    // However, we can detect if a cookie is accessible from JavaScript
    // If accessible from JavaScript, it's NOT HttpOnly (which is good for detection)

    const reasons = [];
    
    // Check if cookie name suggests security-sensitive content
    const lowerName = cookieName.toLowerCase();
    const secureHints = ["session", "auth", "token", "jwt", "api", "key", "credential"];
    
    if (secureHints.some((hint) => lowerName.includes(hint))) {
      reasons.push("Cookie name suggests sensitive content (auth/session)");
      reasons.push("⚠️ Verify HttpOnly flag is set (prevents XSS access)");
      reasons.push("⚠️ Verify Secure flag is set (HTTPS-only transmission)");
      reasons.push("⚠️ Verify SameSite=Strict is set (CSRF protection)");
    }

    return reasons;
  }

  function getStoreCount(db, storeName) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const countRequest = store.count();

        countRequest.onsuccess = () => resolve(countRequest.result ?? null);
        countRequest.onerror = () => resolve(null);
      } catch (_error) {
        resolve(null);
      }
    });
  }

  async function openDatabaseMetadata(dbName, dbVersion) {
    return withTimeout(
      new Promise((resolve) => {
        let settled = false;
        try {
          const request = Number.isFinite(dbVersion)
            ? indexedDB.open(dbName, dbVersion)
            : indexedDB.open(dbName);

          request.onsuccess = async () => {
            if (settled) return;
            settled = true;

            const db = request.result;
            const storeNames = Array.from(db.objectStoreNames || []);

            const stores = await Promise.all(
              storeNames.map(async (storeName) => {
                let keyPath = null;
                try {
                  const tx = db.transaction(storeName, "readonly");
                  const store = tx.objectStore(storeName);
                  keyPath = store.keyPath ?? null;
                } catch (_err) {
                  keyPath = null;
                }

                const approximateCount = await getStoreCount(db, storeName);

                return {
                  name: storeName,
                  keyPath,
                  approximateCount
                };
              })
            );

            db.close();
            resolve({
              name: db.name,
              version: db.version,
              stores
            });
          };

          request.onerror = () => {
            if (settled) return;
            settled = true;
            resolve({
              name: dbName,
              version: Number.isFinite(dbVersion) ? dbVersion : null,
              stores: [],
              error: "Failed to open IndexedDB database"
            });
          };

          request.onblocked = () => {
            if (settled) return;
            settled = true;
            resolve({
              name: dbName,
              version: Number.isFinite(dbVersion) ? dbVersion : null,
              stores: [],
              error: "IndexedDB database open blocked"
            });
          };
        } catch (_error) {
          resolve({
            name: dbName,
            version: Number.isFinite(dbVersion) ? dbVersion : null,
            stores: [],
            error: "IndexedDB metadata read threw an exception"
          });
        }
      }),
      2000,
      {
        name: dbName,
        version: Number.isFinite(dbVersion) ? dbVersion : null,
        stores: [],
        error: "IndexedDB metadata read timed out"
      }
    );
  }

  async function collectIndexedDbMetadata(host, url, now) {
    const result = {
      databases: [],
      error: null,
      entries: []
    };

    if (!window.indexedDB) {
      result.error = "IndexedDB is not available on this page";
      return result;
    }

    if (typeof indexedDB.databases !== "function") {
      result.error = "indexedDB.databases() is not supported by this browser";
      return result;
    }

    try {
      const dbList = await withTimeout(indexedDB.databases(), 1500, []);
      for (const dbInfo of dbList) {
        const dbName = dbInfo?.name;
        if (!dbName) continue;
        const metadata = await openDatabaseMetadata(dbName, dbInfo?.version);
        result.databases.push(metadata);
      }
    } catch (_error) {
      result.error = "Failed to list IndexedDB databases";
    }

    for (const db of result.databases) {
      for (const store of db.stores || []) {
        const valuePreview = JSON.stringify({
          database: db.name,
          store: store.name,
          keyPath: store.keyPath,
          approximateCount: typeof store.approximateCount === "number" ? store.approximateCount : "unknown"
        });

        result.entries.push({
          id: `indexedDB:${db.name}:${store.name}:${now}`,
          type: "indexedDB",
          key: `${db.name}/${store.name}`,
          value: valuePreview,
          host,
          url,
          metadata: {
            database: db.name,
            version: db.version,
            storeName: store.name,
            keyPath: store.keyPath,
            approximateCount: store.approximateCount
          },
          timestamp: now
        });
      }
    }

    return result;
  }

  async function collectEntries() {
    const entries = [];
    const host = window.location.host;
    const url = window.location.href;
    const now = Date.now();

    if (document.cookie) {
      for (const cookieString of document.cookie.split(";")) {
        const [name, ...rest] = cookieString.trim().split("=");
        if (!name) continue;

        entries.push({
          id: `cookie:${name}:${now}`,
          type: "cookie",
          key: name,
          value: rest.join("="),
          host,
          url,
          metadata: {
            domain: window.location.hostname,
            path: "/"
          },
          timestamp: now
        });
      }
    }

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key) || "";
      entries.push({
        id: `localStorage:${key}:${now}`,
        type: "localStorage",
        key,
        value,
        host,
        url,
        metadata: { size: (key.length + value.length) * 2 },
        timestamp: now
      });
    }

    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      const value = sessionStorage.getItem(key) || "";
      entries.push({
        id: `sessionStorage:${key}:${now}`,
        type: "sessionStorage",
        key,
        value,
        host,
        url,
        metadata: { size: (key.length + value.length) * 2 },
        timestamp: now
      });
    }

    const indexedDb = await collectIndexedDbMetadata(host, url, now);
    entries.push(...indexedDb.entries);

    return { entries, indexedDb };
  }

  function analyzeEntries(entries) {
    const alerts = [];

    for (const entry of entries) {
      const keywords = detectKeywords(entry.value, entry.key);
      const patterns = detectPatterns(entry.value, entry.key);
      const xssPatterns = detectXSSPatterns(entry.value);
      let riskLevel = scoreRisk(keywords, patterns, entry.key, entry.type, entry.value);

      // XSS threat escalates risk
      if (xssPatterns.length > 0) {
        riskLevel = "high"; // Any XSS pattern is high risk
      }

      // Cookie-specific checks
      let cookieSecurityReasons = [];
      if (entry.type === "cookie") {
        cookieSecurityReasons = validateCookieSecurity(entry.key);
      }

      if (riskLevel === "low" && cookieSecurityReasons.length === 0) {
        continue;
      }

      const reasons = [];
      
      // XSS reasons first (highest priority)
      for (const pattern of xssPatterns) {
        reasons.push(`⚠️ XSS THREAT: ${pattern} detected in stored value`);
      }

      // Keyword reasons
      if (keywords.length > 0) {
        reasons.push(`Sensitive keywords: ${keywords.join(", ")}`);
      }

      // Pattern reasons
      for (const pattern of patterns) {
        reasons.push(`Detected pattern: ${pattern}`);
      }

      // Cookie security reasons
      reasons.push(...cookieSecurityReasons);

      alerts.push({
        id: `${entry.type}:${entry.key}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`,
        location: {
          host: entry.host,
          url: entry.url,
          storageType: entry.type,
          key: entry.key
        },
        entry,
        riskLevel,
        reasons,
        recommendation: buildRecommendation(riskLevel),
        detectedPatterns: patterns,
        xssPatterns: xssPatterns
      });
    }

    return alerts.sort((a, b) => {
      const order = { high: 3, medium: 2, low: 1 };
      return order[b.riskLevel] - order[a.riskLevel];
    });
  }

  async function publishScan() {
    try {
      await hydrateHunterMode();
      const scan = await collectEntries();
      const entries = scan.entries;
      const alerts = analyzeEntries(entries);

      // Level 3: Collect DOM findings and API endpoints
      const domFindings = scanDOMForSensitiveData();
      const endpoints = detectAPIEndpoints();
      const securitySignals = collectDocumentSecuritySignals();
      const hunterFindings = runHunterDetectors({
        entries,
        alerts,
        domFindings,
        endpoints,
        securitySignals,
        networkActivity: [...networkActivityLog],
        mode: hunterScanMode
      });

      chrome.runtime.sendMessage({
        type: "BMI_SCAN_RESULT",
        payload: {
          host: window.location.host,
          url: window.location.href,
          title: document.title,
          timestamp: Date.now(),
          entries,
          indexedDb: {
            databases: scan.indexedDb.databases,
            error: scan.indexedDb.error
          },
          alerts,
          // Level 3 findings
          level3Findings: {
            domFindings,
            endpoints
          },
          hunterFindings,
          hunterMeta: {
            mode: hunterScanMode,
            networkEvents: networkActivityLog.length
          }
        }
      });
    } catch (error) {
      chrome.runtime.sendMessage({
        type: "BMI_SCAN_ERROR",
        payload: {
          host: window.location.host,
          url: window.location.href,
          timestamp: Date.now(),
          message: error instanceof Error ? error.message : "Unknown scan error"
        }
      });
    }
  }

  const guardedPublish = async () => {
    try {
      await publishScan();
    } catch (_err) {
      // Prevent extension script crash loops on edge pages.
    }
  };

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "BMI_TRIGGER_SCAN") {
      guardedPublish().then(() => {
        sendResponse({ ok: true });
      });
      return true;
    }
    return false;
  });

  window.addEventListener("focus", () => {
    guardedPublish();
  });
  window.addEventListener("storage", () => {
    guardedPublish();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      guardedPublish();
    }
  });

  setInterval(() => {
    guardedPublish();
  }, 5000);

  installNetworkInstrumentation();
  guardedPublish();
})();
