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
    JWT: /^[\\w-]*\\.[\\w-]*\\.[\\w-]*$/,
    BASE64: /^[A-Za-z0-9+/]{20,}={0,2}$/,
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/,
    PHONE: /\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b/,
    AWS_KEY: /^AKIA[0-9A-Z]{16}$/,
    GITHUB_TOKEN: /^ghp_[a-zA-Z0-9]{36}$/,
    CREDIT_CARD: /\\b\\d{13,19}\\b/,
    SSN: /\\b\\d{3}-\\d{2}-\\d{4}\\b/,
    BEARER: /^Bearer\\s+[\\w.-]+$/i
  };

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

  function detectPatterns(value) {
    const detected = [];
    const val = String(value || "");

    for (const [name, pattern] of Object.entries(PATTERNS)) {
      if (pattern.test(val)) {
        detected.push(name);
      }
    }

    return detected;
  }

  function scoreRisk(keywords, patterns, keyName) {
    let score = 0;
    const lowerKeyName = String(keyName || "").toLowerCase();

    if (keywords.length > 0) score += 30;
    if (SENSITIVE_KEYWORDS.some((k) => lowerKeyName.includes(k))) score += 40;
    if (patterns.includes("JWT")) score += 50;
    if (patterns.includes("AWS_KEY") || patterns.includes("GITHUB_TOKEN")) score += 70;
    if (patterns.includes("BEARER")) score += 60;
    if (patterns.includes("CREDIT_CARD") || patterns.includes("SSN")) score += 80;

    if (score >= 70) return "high";
    if (score >= 40) return "medium";
    return "low";
  }

  function buildRecommendation(riskLevel) {
    if (riskLevel === "high") {
      return "Critical exposure detected. Remove from browser storage and move to secure server-side/session-only handling.";
    }
    if (riskLevel === "medium") {
      return "Potentially sensitive data found. Validate necessity and encrypt/minimize stored values.";
    }
    return "No immediate action required.";
  }

  function collectEntries() {
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

    return entries;
  }

  function analyzeEntries(entries) {
    const alerts = [];

    for (const entry of entries) {
      const keywords = detectKeywords(entry.value, entry.key);
      const patterns = detectPatterns(entry.value);
      const riskLevel = scoreRisk(keywords, patterns, entry.key);

      if (riskLevel === "low") {
        continue;
      }

      const reasons = [];
      if (keywords.length > 0) {
        reasons.push(`Sensitive keywords: ${keywords.join(", ")}`);
      }
      for (const pattern of patterns) {
        reasons.push(`Detected pattern: ${pattern}`);
      }

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
        detectedPatterns: patterns
      });
    }

    return alerts.sort((a, b) => {
      const order = { high: 3, medium: 2, low: 1 };
      return order[b.riskLevel] - order[a.riskLevel];
    });
  }

  function publishScan() {
    try {
      const entries = collectEntries();
      const alerts = analyzeEntries(entries);

      chrome.runtime.sendMessage({
        type: "BMI_SCAN_RESULT",
        payload: {
          host: window.location.host,
          url: window.location.href,
          title: document.title,
          timestamp: Date.now(),
          entries,
          alerts
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

  const guardedPublish = () => {
    try {
      publishScan();
    } catch (_err) {
      // Prevent extension script crash loops on edge pages.
    }
  };

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "BMI_TRIGGER_SCAN") {
      guardedPublish();
      sendResponse({ ok: true });
      return true;
    }
    return false;
  });

  window.addEventListener("focus", guardedPublish);
  window.addEventListener("storage", guardedPublish);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      guardedPublish();
    }
  });

  setInterval(guardedPublish, 5000);
  guardedPublish();
})();
