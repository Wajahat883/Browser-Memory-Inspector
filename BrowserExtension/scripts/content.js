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
    JWT: /^[\w-]*\.[\w-]*\.[\w-]*$/,
    BASE64: /^[A-Za-z0-9+/]{20,}={0,2}$/,
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    PHONE: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
    AWS_KEY: /^AKIA[0-9A-Z]{16}$/,
    GITHUB_TOKEN: /^ghp_[a-zA-Z0-9]{36}$/,
    CREDIT_CARD: /\b\d{13,19}\b/,
    SSN: /\b\d{3}-\d{2}-\d{4}\b/,
    BEARER: /^Bearer\s+[\w.-]+$/i
  };

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

  function scoreRisk(keywords, patterns, keyName, entryType) {
    let score = 0;
    const lowerKeyName = String(keyName || "").toLowerCase();

    if (keywords.length > 0) score += 30;
    if (SENSITIVE_KEYWORDS.some((k) => lowerKeyName.includes(k))) score += 40;
    if (patterns.includes("JWT")) score += 50;
    if (patterns.includes("AWS_KEY") || patterns.includes("GITHUB_TOKEN")) score += 70;
    if (patterns.includes("BEARER")) score += 60;
    if (patterns.includes("CREDIT_CARD") || patterns.includes("SSN")) score += 80;
    if (entryType === "indexedDB" && keywords.length > 0) score += 20;

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
      const patterns = detectPatterns(entry.value);
      const riskLevel = scoreRisk(keywords, patterns, entry.key, entry.type);

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

  async function publishScan() {
    try {
      const scan = await collectEntries();
      const entries = scan.entries;
      const alerts = analyzeEntries(entries);

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

  guardedPublish();
})();
