const highCount = document.getElementById("highCount");
const mediumCount = document.getElementById("mediumCount");
const totalCount = document.getElementById("totalCount");
const siteCount = document.getElementById("siteCount");
const statusLine = document.getElementById("statusLine");
const highList = document.getElementById("highList");
const mediumList = document.getElementById("mediumList");
const hunterFindingsList = document.getElementById("hunterFindingsList");
const indexedDbList = document.getElementById("indexedDbList");
const domFindingsList = document.getElementById("domFindingsList");
const endpointsList = document.getElementById("endpointsList");
const errorPanel = document.getElementById("errorPanel");
const errorText = document.getElementById("errorText");
const refreshButton = document.getElementById("refreshButton");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const exportHtmlBtn = document.getElementById("exportHtmlBtn");
const exportCopyBtn = document.getElementById("exportCopyBtn");
const exportSarifBtn = document.getElementById("exportSarifBtn");
const geminiApiKeyInput = document.getElementById("geminiApiKey");
const saveGeminiKeyBtn = document.getElementById("saveGeminiKeyBtn");
const aiStatus = document.getElementById("aiStatus");
const hostFilterInput = document.getElementById("hostFilter");
const sortSelect = document.getElementById("sortSelect");
const siteSelect = document.getElementById("siteSelect");
const hunterModeSelect = document.getElementById("hunterModeSelect");
const saveHunterModeBtn = document.getElementById("saveHunterModeBtn");
const hunterAllowlistInput = document.getElementById("hunterAllowlistInput");
const hunterRateLimitInput = document.getElementById("hunterRateLimitInput");
const hunterActiveProfileInput = document.getElementById("hunterActiveProfileInput");
const hunterKillSwitchInput = document.getElementById("hunterKillSwitchInput");
const hunterProfilesInput = document.getElementById("hunterProfilesInput");
const saveHunterPolicyBtn = document.getElementById("saveHunterPolicyBtn");
const comparisonBody = document.getElementById("comparisonBody");
const siteTitle = document.getElementById("siteTitle");
const siteMeta = document.getElementById("siteMeta");
const riskFormula = document.getElementById("riskFormula");
const riskSummary = document.getElementById("riskSummary");
const aiInsight = document.getElementById("aiInsight");

let lastState = null;
let selectedHost = "";
let savedGeminiKey = "";

const HUNTER_MODE_STORAGE_KEY = "BMI_HUNTER_SCAN_MODE";
const HUNTER_POLICY_STORAGE_KEY = "BMI_HUNTER_POLICY_V1";

function formatTime(timestamp) {
  if (!timestamp) return "n/a";
  return new Date(timestamp).toLocaleTimeString();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function loadGeminiKey() {
  try {
    const stored = await chrome.storage.local.get("BMI_GEMINI_API_KEY");
    savedGeminiKey = stored?.BMI_GEMINI_API_KEY || "";
    if (geminiApiKeyInput) {
      geminiApiKeyInput.value = "";
    }
    if (aiStatus) {
      aiStatus.textContent = savedGeminiKey
        ? "Gemini API key is saved locally. AI responses will be generated dynamically."
        : "Paste your Gemini API key to enable dynamic AI explanations.";
    }
  } catch (_error) {
    if (aiStatus) aiStatus.textContent = "Unable to load saved Gemini key.";
  }
}

async function saveGeminiKey() {
  const enteredKey = String(geminiApiKeyInput?.value || "").trim();
  if (!enteredKey) {
    if (aiStatus) aiStatus.textContent = "Enter a Gemini API key first.";
    return;
  }

  await chrome.storage.local.set({ BMI_GEMINI_API_KEY: enteredKey });
  savedGeminiKey = enteredKey;
  if (geminiApiKeyInput) {
    geminiApiKeyInput.value = "";
  }
  if (aiStatus) {
    aiStatus.textContent = "Gemini API key saved locally in this extension.";
  }
}

async function getGeminiCompletion(prompt) {
  if (!savedGeminiKey) {
    await loadGeminiKey();
  }
  if (!savedGeminiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + encodeURIComponent(savedGeminiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 512 }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed (${response.status})`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }
  return text;
}

async function loadHunterMode() {
  if (!hunterModeSelect) return;
  try {
    const stored = await chrome.storage.local.get(HUNTER_MODE_STORAGE_KEY);
    const mode = String(stored?.[HUNTER_MODE_STORAGE_KEY] || "passive").toLowerCase();
    hunterModeSelect.value = mode === "active" ? "active" : "passive";
  } catch (_error) {
    hunterModeSelect.value = "passive";
  }
}

async function saveHunterMode() {
  if (!hunterModeSelect) return;
  const mode = hunterModeSelect.value === "active" ? "active" : "passive";
  await chrome.storage.local.set({ [HUNTER_MODE_STORAGE_KEY]: mode });
  statusLine.textContent = `Hunter mode saved: ${mode}. Click Refresh Scan to apply immediately.`;
}

function defaultHunterPolicy() {
  return {
    killSwitch: false,
    allowlistHosts: [],
    maxScansPerMinute: 24,
    activeProfile: "",
    identityProfiles: []
  };
}

async function loadHunterPolicy() {
  if (!hunterAllowlistInput || !hunterRateLimitInput || !hunterActiveProfileInput || !hunterKillSwitchInput || !hunterProfilesInput) {
    return;
  }

  let policy = defaultHunterPolicy();
  try {
    const stored = await chrome.storage.local.get(HUNTER_POLICY_STORAGE_KEY);
    if (stored?.[HUNTER_POLICY_STORAGE_KEY] && typeof stored[HUNTER_POLICY_STORAGE_KEY] === "object") {
      policy = {
        ...policy,
        ...stored[HUNTER_POLICY_STORAGE_KEY]
      };
    }
  } catch (_err) {
    // Keep defaults when storage read fails.
  }

  hunterAllowlistInput.value = (policy.allowlistHosts || []).join(", ");
  hunterRateLimitInput.value = String(Number(policy.maxScansPerMinute) || 24);
  hunterActiveProfileInput.value = String(policy.activeProfile || "");
  hunterKillSwitchInput.checked = Boolean(policy.killSwitch);
  hunterProfilesInput.value = JSON.stringify(policy.identityProfiles || [], null, 2);
}

async function saveHunterPolicy() {
  const allowlistHosts = String(hunterAllowlistInput?.value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const maxScansRaw = Number(hunterRateLimitInput?.value || 24);
  const maxScansPerMinute = Number.isFinite(maxScansRaw)
    ? Math.min(120, Math.max(1, Math.floor(maxScansRaw)))
    : 24;

  let identityProfiles = [];
  const profilesText = String(hunterProfilesInput?.value || "").trim();
  if (profilesText) {
    const parsed = JSON.parse(profilesText);
    if (!Array.isArray(parsed)) {
      throw new Error("Identity profiles must be a JSON array.");
    }
    identityProfiles = parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        name: String(item.name || "").trim(),
        role: String(item.role || "user").trim(),
        ids: Array.isArray(item.ids) ? item.ids.map((id) => String(id)) : []
      }))
      .filter((item) => item.name);
  }

  const policy = {
    killSwitch: Boolean(hunterKillSwitchInput?.checked),
    allowlistHosts,
    maxScansPerMinute,
    activeProfile: String(hunterActiveProfileInput?.value || "").trim(),
    identityProfiles
  };

  await chrome.storage.local.set({ [HUNTER_POLICY_STORAGE_KEY]: policy });
  statusLine.textContent = "Hunter policy saved. Click Refresh Scan to apply on current tab.";
}

function findingItemMarkup(alert) {
  const firstReason = alert.reasons?.[0] || "Potential sensitive data exposure";
  return `
    <li class="finding-item">
      <p class="title">${escapeHtml(alert.location?.key || alert.entry?.key || "unknown")}</p>
      <p class="meta">Site: ${escapeHtml(alert.location?.host || "unknown")}</p>
      <p class="meta">Storage: ${escapeHtml(alert.location?.storageType || alert.entry?.type || "unknown")}</p>
      <p class="meta">Reason: ${escapeHtml(firstReason)}</p>
    </li>
  `;
}

function renderList(element, alerts, emptyText) {
  if (!alerts || alerts.length === 0) {
    element.innerHTML = `<li class="empty">${escapeHtml(emptyText)}</li>`;
    return;
  }

  element.innerHTML = alerts.slice(0, 8).map(findingItemMarkup).join("");
}

function renderIndexedDb(scan) {
  const databases = scan?.indexedDb?.databases || [];
  const dbError = scan?.indexedDb?.error;

  if (dbError) {
    indexedDbList.innerHTML = `<li class="empty">${escapeHtml(dbError)}</li>`;
    return;
  }

  if (!databases.length) {
    indexedDbList.innerHTML = '<li class="empty">No IndexedDB metadata found.</li>';
    return;
  }

  const items = [];
  for (const db of databases.slice(0, 10)) {
    const stores = db.stores || [];
    if (!stores.length) {
      items.push(`
        <li class="finding-item">
          <p class="title">DB: ${escapeHtml(db.name)}</p>
          <p class="meta">Version: ${escapeHtml(db.version)}</p>
          <p class="meta">No object stores found.</p>
        </li>
      `);
      continue;
    }

    for (const store of stores.slice(0, 5)) {
      items.push(`
        <li class="finding-item">
          <p class="title">${escapeHtml(db.name)} / ${escapeHtml(store.name)}</p>
          <p class="meta">Version: ${escapeHtml(db.version)}</p>
          <p class="meta">KeyPath: ${escapeHtml(store.keyPath ?? "n/a")}</p>
          <p class="meta">Approx Count: ${escapeHtml(store.approximateCount ?? "unknown")}</p>
        </li>
      `);
    }
  }

  indexedDbList.innerHTML = items.join("");
}

function renderDOMFindings(scan) {
  const findings = scan?.level3Findings?.domFindings || [];

  if (!findings.length) {
    domFindingsList.innerHTML = '<li class="empty">No DOM findings detected.</li>';
    return;
  }

  domFindingsList.innerHTML = findings
    .slice(0, 12)
    .map((finding) => {
      const title = finding.type ? finding.type.replaceAll("_", " ") : "DOM finding";
      const preview = finding.valuePreview || finding.content || finding.name || finding.key || "n/a";
      return `
        <li class="finding-item">
          <p class="title">${escapeHtml(title)}</p>
          <p class="meta">Location: ${escapeHtml(finding.location || "unknown")}</p>
          <p class="meta">Risk: ${escapeHtml(finding.risk || "unknown")}</p>
          <p class="meta">Value: ${escapeHtml(preview)}</p>
        </li>
      `;
    })
    .join("");
}

function renderEndpoints(scan) {
  const endpoints = scan?.level3Findings?.endpoints || [];

  if (!endpoints.length) {
    endpointsList.innerHTML = '<li class="empty">No API endpoints detected.</li>';
    return;
  }

  endpointsList.innerHTML = endpoints
    .slice(0, 12)
    .map((endpoint) => `
      <li class="finding-item">
        <p class="title">${escapeHtml(endpoint.endpoint || "unknown")}</p>
        <p class="meta">Type: ${escapeHtml(endpoint.type || "unknown")}</p>
        <p class="meta">Location: ${escapeHtml(endpoint.location || "unknown")}</p>
        <p class="meta">Risk: ${escapeHtml(endpoint.risk || "unknown")}</p>
      </li>
    `)
    .join("");
}

function hunterFindingMarkup(finding) {
  const evidence = finding?.evidence?.[0]?.signal || "No evidence detail";
  const confidence = Number.isFinite(finding?.confidence)
    ? `${Math.round(finding.confidence * 100)}%`
    : "n/a";

  return `
    <li class="finding-item">
      <p class="title">${escapeHtml(finding?.title || "Hunter finding")}</p>
      <p class="meta">Category: ${escapeHtml(finding?.category || "unknown")}</p>
      <p class="meta">Severity: ${escapeHtml(finding?.severity || "unknown")} | Confidence: ${escapeHtml(confidence)}</p>
      <p class="meta">Verified: ${escapeHtml(finding?.verified ? "yes" : "no")}</p>
      <p class="meta">Evidence: ${escapeHtml(evidence)}</p>
    </li>
  `;
}

function renderHunterFindings(scan) {
  const findings = scan?.hunterFindings || [];

  if (!findings.length) {
    hunterFindingsList.innerHTML = '<li class="empty">No hunter findings detected yet.</li>';
    return;
  }

  hunterFindingsList.innerHTML = findings.slice(0, 12).map(hunterFindingMarkup).join("");
}

function buildHostRows(state) {
  const scansByHost = state?.scansByHost || {};
  return Object.entries(scansByHost).map(([host, scan]) => {
    const alerts = scan?.alerts || [];
    const high = alerts.filter((a) => a.riskLevel === "high").length;
    const medium = alerts.filter((a) => a.riskLevel === "medium").length;

    return {
      host,
      scan,
      high,
      medium,
      total: alerts.length,
      timestamp: scan?.timestamp || 0
    };
  });
}

function sortRows(rows, mode) {
  const list = [...rows];

  if (mode === "high") {
    return list.sort((a, b) => b.high - a.high || b.timestamp - a.timestamp);
  }
  if (mode === "medium") {
    return list.sort((a, b) => b.medium - a.medium || b.timestamp - a.timestamp);
  }
  if (mode === "host") {
    return list.sort((a, b) => a.host.localeCompare(b.host));
  }
  return list.sort((a, b) => b.timestamp - a.timestamp);
}

function renderComparisonRows(rows) {
  if (!rows.length) {
    comparisonBody.innerHTML = '<tr><td colspan="5" class="empty-cell">No scanned sites available.</td></tr>';
    return;
  }

  comparisonBody.innerHTML = rows
    .map((row) => {
      const activeClass = row.host === selectedHost ? " active-row" : "";
      return `
        <tr data-host="${escapeHtml(row.host)}" class="comparison-row${activeClass}">
          <td>${escapeHtml(row.host)}</td>
          <td>${row.high}</td>
          <td>${row.medium}</td>
          <td>${row.total}</td>
          <td>${escapeHtml(formatTime(row.timestamp))}</td>
        </tr>
      `;
    })
    .join("");

  Array.from(comparisonBody.querySelectorAll(".comparison-row")).forEach((rowEl) => {
    rowEl.addEventListener("click", () => {
      selectedHost = rowEl.getAttribute("data-host") || "";
      siteSelect.value = selectedHost;
      render(lastState);
    });
  });
}

function syncSiteSelect(allRows) {
  const options = allRows
    .map((row) => `<option value="${escapeHtml(row.host)}">${escapeHtml(row.host)}</option>`)
    .join("");

  siteSelect.innerHTML = options || '<option value="">No sites</option>';

  if (!selectedHost && allRows.length > 0) {
    selectedHost = allRows[0].host;
  }

  if (selectedHost && allRows.some((row) => row.host === selectedHost)) {
    siteSelect.value = selectedHost;
  } else if (allRows.length > 0) {
    selectedHost = allRows[0].host;
    siteSelect.value = selectedHost;
  }
}

function renderSelectedSite(state) {
  const selectedScan = state?.scansByHost?.[selectedHost] || null;

  if (!selectedScan) {
    siteTitle.textContent = "Selected Site Details";
    siteMeta.textContent = "No site selected";
    if (riskFormula) riskFormula.textContent = "keyword + context + validation = risk";
    if (riskSummary) riskSummary.innerHTML = '<div class="empty">No findings selected.</div>';
    if (aiInsight) aiInsight.innerHTML = '<div class="empty">No AI insight available.</div>';
    renderList(highList, [], "No High vulnerabilities found.");
    renderList(mediumList, [], "No Medium vulnerabilities found.");
    renderHunterFindings(null);
    renderIndexedDb(null);
    renderDOMFindings(null);
    renderEndpoints(null);
    return;
  }

  const alerts = selectedScan.alerts || [];
  const highAlerts = alerts.filter((a) => a.riskLevel === "high");
  const mediumAlerts = alerts.filter((a) => a.riskLevel === "medium");
  const report = generateDetailedJsonReport(state, true);

  siteTitle.textContent = `Selected Site: ${selectedHost}`;
  siteMeta.textContent = `Last Scan: ${formatTime(selectedScan.timestamp)} | URL: ${selectedScan.url || "n/a"}`;

  const selectedAlerts = alerts.slice(0, 3);
  const riskSummaryHtml = selectedAlerts.length
    ? selectedAlerts.map((alert) => {
        const basis = createDetailedFinding(alert).riskBasis;
        return `
          <div class="finding-item">
            <p class="title">${escapeHtml(alert.location?.key || alert.entry?.key || "unknown")}</p>
            <p class="meta">Formula: ${escapeHtml(basis.formula)}</p>
            <p class="meta">Keywords: ${escapeHtml((basis.keywordMatches || []).join(", ") || "none")}</p>
            <p class="meta">Context: ${escapeHtml((basis.contextFactors || []).join(" | ") || "none")}</p>
            <p class="meta">Validation: ${escapeHtml((basis.validationChecks || []).join(" | ") || "none")}</p>
          </div>
        `;
      }).join("")
    : '<div class="empty">No findings selected.</div>';

  if (riskFormula) {
    riskFormula.textContent = "keyword + context + validation = risk";
  }
  if (riskSummary) {
    riskSummary.innerHTML = riskSummaryHtml;
  }

  const localInsight = buildLocalAppInsight(report);
  if (aiInsight) {
    aiInsight.innerHTML = renderAppInsightHtml(localInsight, "Local AI App Summary");
  }

  refreshGeminiAppSummary(report);

  renderList(highList, highAlerts, "No High vulnerabilities found.");
  renderList(mediumList, mediumAlerts, "No Medium vulnerabilities found.");
  renderHunterFindings(selectedScan);
  renderIndexedDb(selectedScan);
  renderDOMFindings(selectedScan);
  renderEndpoints(selectedScan);
}

function render(state) {
  lastState = state;

  const activeScan = state?.activeScan;
  const activeAlerts = activeScan?.alerts || [];
  const activeHigh = activeAlerts.filter((a) => a.riskLevel === "high");
  const activeMedium = activeAlerts.filter((a) => a.riskLevel === "medium");

  highCount.textContent = String(activeHigh.length);
  mediumCount.textContent = String(activeMedium.length);
  totalCount.textContent = String(activeScan?.entries?.length || 0);

  const allRows = buildHostRows(state);
  siteCount.textContent = String(allRows.length);

  if (activeScan?.host) {
    const hunterCount = (activeScan?.hunterFindings || []).length;
    const mode = activeScan?.hunterMeta?.mode || "passive";
    statusLine.textContent = `Active site: ${activeScan.host} | Last scan: ${formatTime(activeScan.timestamp)} | Hunter findings: ${hunterCount} (${mode})`;
  } else {
    statusLine.textContent = "Open a website tab and click Refresh Scan.";
  }

  const filterText = hostFilterInput.value.trim().toLowerCase();
  const filteredRows = allRows.filter((row) => row.host.toLowerCase().includes(filterText));
  const sortedRows = sortRows(filteredRows, sortSelect.value);

  syncSiteSelect(allRows);
  renderComparisonRows(sortedRows);
  renderSelectedSite(state);

  if (state?.lastError?.message) {
    errorPanel.hidden = false;
    errorText.textContent = `${state.lastError.message} (${state.lastError.host || "unknown host"})`;
  } else {
    errorPanel.hidden = true;
    errorText.textContent = "";
  }
}

function requestState() {
  chrome.runtime.sendMessage({ type: "BMI_GET_STATE" }, (response) => {
    if (chrome.runtime.lastError) {
      statusLine.textContent = chrome.runtime.lastError.message;
      return;
    }

    if (response?.ok) {
      render(response.payload);
    }
  });
}

function buildFixActions(alert) {
  const actions = [];
  const storage = alert?.location?.storageType || "unknown";
  const patterns = alert?.detectedPatterns || [];
  const xssPatterns = alert?.xssPatterns || [];

  if (xssPatterns.length > 0) {
    actions.push("Sanitize and encode untrusted input before rendering in the DOM.");
    actions.push("Enforce a strict Content-Security-Policy (CSP) and disable inline scripts where possible.");
  }

  if (patterns.includes("JWT") || patterns.includes("BEARER")) {
    actions.push("Move tokens to HttpOnly + Secure cookies and shorten token lifetime.");
    actions.push("Rotate existing tokens and invalidate exposed sessions.");
  }

  if (patterns.some((p) => ["VISA", "MASTERCARD", "AMEX", "DISCOVER", "DINERS", "CREDIT_CARD"].includes(p))) {
    actions.push("Do not store card data in browser storage; tokenize payment data server-side.");
  }

  if (patterns.some((p) => ["AWS_ACCESS", "AWS_SECRET", "GITHUB_TOKEN", "GITHUB_PAT", "GITHUB_OAUTH", "GITHUB_APP", "SLACK_BOT", "SLACK_USER", "STRIPE_LIVE", "STRIPE_TEST", "PRIVATE_KEY"].includes(p))) {
    actions.push("Revoke and rotate exposed API keys/secrets immediately.");
    actions.push("Store secrets on the server and return only scoped, short-lived tokens to clients.");
  }

  if (storage === "localStorage" || storage === "sessionStorage") {
    actions.push("Minimize sensitive data in web storage and encrypt where unavoidable.");
  }

  if (storage === "cookie") {
    actions.push("Set HttpOnly, Secure, and SameSite=Strict on sensitive cookies.");
  }

  actions.push(alert?.recommendation || "Review data exposure and apply least-privilege storage practices.");
  return [...new Set(actions)];
}

function buildRiskBasis(alert) {
  const patterns = alert?.detectedPatterns || [];
  const reasons = alert?.reasons || [];
  const storage = alert?.location?.storageType || "unknown";
  const host = alert?.location?.host || "unknown";
  const pageUrl = alert?.location?.url || "unknown";
  const key = alert?.location?.key || "unknown";
  const xssPatterns = alert?.xssPatterns || [];

  const keywordMatches = reasons
    .filter((reason) => /Sensitive keywords:/i.test(reason))
    .flatMap((reason) => reason.split(":").slice(1).join(":").split(","))
    .map((item) => item.trim())
    .filter(Boolean);

  const contextFactors = [
    `storageType=${storage}`,
    `host=${host}`,
    `pageUrl=${pageUrl}`,
    `key=${key}`,
    xssPatterns.length > 0 ? "xssIndicators=true" : "xssIndicators=false"
  ];

  const validationChecks = [];
  if (patterns.includes("JWT")) validationChecks.push("JWT structure detected and parsed");
  if (patterns.some((p) => ["VISA", "MASTERCARD", "AMEX", "DISCOVER", "DINERS", "CREDIT_CARD"].includes(p))) {
    validationChecks.push("Credit card candidate validated with Luhn check where applicable");
  }
  if (patterns.some((p) => ["AWS_ACCESS", "AWS_SECRET", "GITHUB_TOKEN", "GITHUB_PAT", "GITHUB_OAUTH", "GITHUB_APP", "SLACK_BOT", "SLACK_USER", "STRIPE_LIVE", "STRIPE_TEST", "PRIVATE_KEY"].includes(p))) {
    validationChecks.push("Secret/token format matched high-confidence provider pattern");
  }
  if (xssPatterns.length > 0) validationChecks.push("DOM/XSS payload pattern matched");
  if (storage === "cookie") validationChecks.push("Cookie accessibility implies HttpOnly review needed");
  if (storage === "localStorage" || storage === "sessionStorage") validationChecks.push("Browser storage is directly script-accessible");

  return {
    formula: "keyword + context + validation = risk",
    keywordMatches: [...new Set(keywordMatches)],
    contextFactors,
    validationChecks,
    riskDrivers: patterns,
    xssIndicators: xssPatterns
  };
}

function buildAIExplanation(alert) {
  const patterns = alert?.detectedPatterns || [];
  const storage = alert?.location?.storageType || "unknown";
  const key = alert?.location?.key || "unknown";
  const riskLevel = alert?.riskLevel || "low";

  const ruleMap = [
    {
      matches: (items) => items.includes("JWT"),
      riskDescription: "JWT-like credential found in browser-accessible storage.",
      businessImpact: "If a script execution issue occurs, the session token can be stolen and replayed.",
      remediation: [
        "Move the token to an HttpOnly and Secure cookie.",
        "Shorten expiry and rotate tokens regularly.",
        "Add CSP to reduce XSS exposure."
      ],
      complianceNotes: "OWASP ASVS and CSRF hardening recommended."
    },
    {
      matches: (items) => items.some((item) => ["AWS_ACCESS", "AWS_SECRET", "GITHUB_TOKEN", "GITHUB_PAT", "GITHUB_OAUTH", "GITHUB_APP", "SLACK_BOT", "SLACK_USER", "STRIPE_LIVE", "STRIPE_TEST", "PRIVATE_KEY"].includes(item)),
      riskDescription: "High-value API secret or private key detected.",
      businessImpact: "An exposed secret can lead to account takeover, data access, or infrastructure abuse.",
      remediation: [
        "Revoke and rotate the exposed secret immediately.",
        "Store secrets server-side only.",
        "Issue short-lived scoped tokens to the client instead."
      ],
      complianceNotes: "Treat as a credential incident; review secret management controls."
    },
    {
      matches: (items) => items.some((item) => ["VISA", "MASTERCARD", "AMEX", "DISCOVER", "DINERS", "CREDIT_CARD"].includes(item)),
      riskDescription: "Payment card data detected in client storage.",
      businessImpact: "Card exposure can create PCI-DSS and fraud risk.",
      remediation: [
        "Remove card data from browser storage.",
        "Use server-side tokenization or a PCI-compliant provider.",
        "Never persist raw PAN values in the browser."
      ],
      complianceNotes: "PCI-DSS controls likely apply."
    }
  ];

  const matchedRule = ruleMap.find((rule) => rule.matches(patterns));
  const fallback = {
    riskDescription: "Sensitive value detected by keyword/context/validation logic.",
    businessImpact: "The data is readable from browser-side code and may be exposed through XSS or debugging paths.",
    remediation: [
      "Minimize what is stored in the browser.",
      "Move secrets and tokens server-side.",
      "Apply encryption or tokenization where possible."
    ],
    complianceNotes: "Review according to your data classification policy."
  };

  return {
    severity: riskLevel,
    title: `${storage.toUpperCase()} finding: ${key}`,
    ...fallback,
    ...(matchedRule || {})
  };
}

function buildComplianceSummary(report) {
  const patterns = (report?.findings || []).flatMap((finding) => finding.whyDetected?.matchedPatterns || []);
  const risks = report?.summary || {};

  const hasPersonalData = patterns.some((pattern) => ["EMAIL", "PHONE", "SSN"].includes(pattern));
  const hasPaymentData = patterns.some((pattern) => ["VISA", "MASTERCARD", "AMEX", "DISCOVER", "DINERS", "CREDIT_CARD"].includes(pattern));
  const hasSecrets = patterns.some((pattern) => ["JWT", "AWS_ACCESS", "AWS_SECRET", "GITHUB_TOKEN", "GITHUB_PAT", "GITHUB_OAUTH", "GITHUB_APP", "SLACK_BOT", "SLACK_USER", "STRIPE_LIVE", "PRIVATE_KEY"].includes(pattern));

  return {
    gdpr: {
      applicable: hasPersonalData || hasSecrets,
      note: hasPersonalData ? "Personal data detected; review minimization and retention." : "No obvious personal data detected in this scan."
    },
    ccpa: {
      applicable: hasPersonalData,
      note: hasPersonalData ? "California consumer data may be present; verify disclosure and opt-out handling." : "No direct CCPA signals found."
    },
    pciDss: {
      applicable: hasPaymentData,
      note: hasPaymentData ? "Payment card patterns detected; treat as PCI scope until confirmed otherwise." : "No direct PCI payment indicators found."
    },
    riskSummary: {
      high: risks.high || 0,
      medium: risks.medium || 0,
      low: risks.low || 0,
      total: risks.totalFindings || 0
    }
  };
}

function buildExecutiveSummary(report) {
  const findings = report?.findings || [];
  const topThreats = findings.slice(0, 3).map((finding) => `${finding.whereFound.key} (${finding.severity})`);
  const score = Math.max(0, 100 - ((report?.summary?.high || 0) * 20 + (report?.summary?.medium || 0) * 8));
  const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 45 ? "D" : "F";

  return {
    score,
    grade,
    summary: `${report?.summary?.totalFindings || 0} findings across ${report?.summary?.scannedHosts || 0} host(s).`,
    topThreats,
    recommendedActions: [
      "Rotate or remove exposed secrets.",
      "Move sensitive values out of browser storage.",
      "Apply CSP and cookie hardening where relevant."
    ]
  };
}

function buildLocalAppInsight(report) {
  const findings = report?.findings || [];
  const topFindings = findings.slice(0, 5).map((finding) => ({
    type: finding.whereFound.key,
    severity: finding.severity,
    where: `${finding.whereFound.host} | ${finding.whereFound.storageType} | ${finding.whereFound.key}`,
    why: (finding.riskBasis?.keywordMatches || []).length > 0
      ? `keywords: ${finding.riskBasis.keywordMatches.join(", ")}`
      : (finding.whyDetected?.reasons || ["pattern match"]).join(" | "),
    impact: finding.aiExplanation?.businessImpact || "Potential unauthorized access or data exposure.",
    fix: finding.howToFix || []
  }));

  return {
    overview: report?.executiveSummary?.summary || `${findings.length} findings across ${report?.summary?.scannedHosts || 0} host(s).`,
    vulnerabilities: topFindings,
    priorityOrder: topFindings.map((finding) => finding.type),
    complianceNotes: [
      report?.complianceSummary?.gdpr?.note,
      report?.complianceSummary?.ccpa?.note,
      report?.complianceSummary?.pciDss?.note
    ].filter(Boolean),
    executiveSummary: report?.executiveSummary?.grade
      ? `Security grade ${report.executiveSummary.grade} with score ${report.executiveSummary.score}/100.`
      : "Security posture summary unavailable."
  };
}

function buildAppInsightPrompt(report) {
  const sampleFindings = (report?.findings || []).slice(0, 8).map((finding) => ({
    severity: finding.severity,
    where: finding.whereFound,
    riskBasis: finding.riskBasis,
    whyDetected: finding.whyDetected,
    howToFix: finding.howToFix,
    aiExplanation: finding.aiExplanation
  }));

  return [
    "You are a security analyst for Browser Memory Inspector.",
    "Analyze the scan and return strict JSON with keys: overview, vulnerabilities, priorityOrder, complianceNotes, executiveSummary.",
    "Each vulnerability item must include: type, severity, where, why, impact, fix, confidence.",
    `Report summary: ${JSON.stringify(report?.summary || {})}`,
    `Executive summary: ${JSON.stringify(report?.executiveSummary || {})}`,
    `Compliance summary: ${JSON.stringify(report?.complianceSummary || {})}`,
    `Top findings: ${JSON.stringify(sampleFindings)}`
  ].join("\n");
}

function renderAppInsightHtml(insight, sourceLabel) {
  const vulnerabilities = insight?.vulnerabilities || [];
  const notes = insight?.complianceNotes || [];

  return `
    <div class="finding-item">
      <p class="title">${escapeHtml(sourceLabel || "AI App Summary")}</p>
      <p class="meta">Overview: ${escapeHtml(insight?.overview || "none")}</p>
      <p class="meta">Executive Summary: ${escapeHtml(insight?.executiveSummary || "none")}</p>
      <p class="meta">Priority Order: ${escapeHtml((insight?.priorityOrder || []).join(" | ") || "none")}</p>
      <p class="meta">Compliance Notes: ${escapeHtml(notes.join(" | ") || "none")}</p>
      <p class="meta">Vulnerability Count: ${escapeHtml(String(vulnerabilities.length))}</p>
    </div>
    ${vulnerabilities.map((vulnerability) => `
      <div class="finding-item">
        <p class="title">${escapeHtml(vulnerability.type || "unknown")}</p>
        <p class="meta">Severity: ${escapeHtml(vulnerability.severity || "unknown")}</p>
        <p class="meta">Where: ${escapeHtml(vulnerability.where || "unknown")}</p>
        <p class="meta">Why: ${escapeHtml(vulnerability.why || "none")}</p>
        <p class="meta">Impact: ${escapeHtml(vulnerability.impact || "none")}</p>
        <p class="meta">Fix: ${escapeHtml((vulnerability.fix || []).join(" | ") || "none")}</p>
      </div>
    `).join("")}
  `;
}

async function refreshGeminiAppSummary(report) {
  if (!aiStatus || !aiInsight) return;

  if (!savedGeminiKey) {
    const localInsight = buildLocalAppInsight(report);
    aiInsight.innerHTML = renderAppInsightHtml(localInsight, "Local AI App Summary");
    aiStatus.textContent = "Using local AI summary. Save a Gemini key to enable live AI output.";
    return;
  }

  try {
    aiStatus.textContent = "Generating live Gemini app summary...";
    const prompt = buildAppInsightPrompt(report);
    const text = await getGeminiCompletion(prompt);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (_parseError) {
      parsed = buildLocalAppInsight(report);
      parsed.overview = text || parsed.overview;
    }

    aiInsight.innerHTML = renderAppInsightHtml(parsed, "Gemini AI App Summary");
    aiStatus.textContent = "Gemini AI app summary loaded.";
  } catch (error) {
    const localInsight = buildLocalAppInsight(report);
    aiInsight.innerHTML = renderAppInsightHtml(localInsight, "Local AI App Summary");
    aiStatus.textContent = `Gemini unavailable: ${error instanceof Error ? error.message : "unknown error"}. Using local AI summary.`;
  }
}

function buildGeminiPrompt(alert, detailedFinding) {
  const riskBasis = detailedFinding?.riskBasis || buildRiskBasis(alert);
  const aiExplanation = detailedFinding?.aiExplanation || buildAIExplanation(alert);

  return [
    "You are a security assistant for Browser Memory Inspector.",
    "Return a concise JSON object with keys: riskDescription, businessImpact, remediation, complianceNotes, executiveSummary, confidence.",
    `Finding key: ${alert.location?.key || "unknown"}`,
    `Storage type: ${alert.location?.storageType || "unknown"}`,
    `Risk level: ${alert.riskLevel || "unknown"}`,
    `Keyword matches: ${(riskBasis.keywordMatches || []).join(", ") || "none"}`,
    `Context factors: ${(riskBasis.contextFactors || []).join(" | ") || "none"}`,
    `Validation checks: ${(riskBasis.validationChecks || []).join(" | ") || "none"}`,
    `Why detected: ${(alert.reasons || []).join(" | ") || "none"}`,
    `AI fallback insight: ${JSON.stringify(aiExplanation)}`,
    `How to fix: ${(detailedFinding?.howToFix || []).join(" | ") || "none"}`
  ].join("\n");
}

async function refreshGeminiInsightForSelectedFinding(alert) {
  if (!aiStatus || !aiInsight) return;

  try {
    aiStatus.textContent = "Generating live Gemini insight...";
    const detailedFinding = createDetailedFinding(alert);
    const prompt = buildGeminiPrompt(alert, detailedFinding);
    const text = await getGeminiCompletion(prompt);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (_parseError) {
      parsed = { riskDescription: text, businessImpact: "", remediation: [], complianceNotes: "", executiveSummary: "" };
    }

    const remediation = Array.isArray(parsed.remediation) ? parsed.remediation : [String(parsed.remediation || "")].filter(Boolean);
    aiInsight.innerHTML = `
      <div class="finding-item">
        <p class="title">${escapeHtml(parsed.executiveSummary || detailedFinding.aiExplanation?.title || "Gemini AI Insight")}</p>
        <p class="meta">Risk: ${escapeHtml(alert.riskLevel || "unknown")}</p>
        <p class="meta">Confidence: ${escapeHtml(String(parsed.confidence || "n/a"))}</p>
        <p class="meta">Description: ${escapeHtml(parsed.riskDescription || "none")}</p>
        <p class="meta">Impact: ${escapeHtml(parsed.businessImpact || "none")}</p>
        <p class="meta">Remediation: ${escapeHtml(remediation.join(" | ") || "none")}</p>
        <p class="meta">Compliance: ${escapeHtml(parsed.complianceNotes || "none")}</p>
      </div>
    `;
    aiStatus.textContent = "Gemini AI insight loaded.";
  } catch (error) {
    aiStatus.textContent = `Gemini unavailable: ${error instanceof Error ? error.message : "unknown error"}. Using local AI insight.`;
  }
}

function createDetailedFinding(alert) {
  const aiExplanation = buildAIExplanation(alert);
  return {
    id: alert.id,
    severity: alert.riskLevel,
    riskBasis: buildRiskBasis(alert),
    aiExplanation,
    whyDetected: {
      reasons: alert.reasons || [],
      matchedPatterns: alert.detectedPatterns || [],
      xssIndicators: alert.xssPatterns || []
    },
    whereFound: {
      host: alert.location?.host || "unknown",
      pageUrl: alert.location?.url || "unknown",
      storageType: alert.location?.storageType || "unknown",
      key: alert.location?.key || "unknown"
    },
    evidence: {
      entryType: alert.entry?.type || "unknown",
      valuePreview: String(alert.entry?.value || "").slice(0, 120)
    },
    howToFix: buildFixActions(alert)
  };
}

function toCsvValue(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function buildDetailedRows(report) {
  return (report?.findings || []).map((finding) => ({
    severity: finding.severity,
    host: finding.whereFound.host,
    pageUrl: finding.whereFound.pageUrl,
    storageType: finding.whereFound.storageType,
    key: finding.whereFound.key,
    keywords: (finding.riskBasis.keywordMatches || []).join(" | "),
    context: (finding.riskBasis.contextFactors || []).join(" | "),
    validation: (finding.riskBasis.validationChecks || []).join(" | "),
    aiRiskDescription: finding.aiExplanation?.riskDescription || "",
    aiBusinessImpact: finding.aiExplanation?.businessImpact || "",
    aiComplianceNotes: finding.aiExplanation?.complianceNotes || "",
    aiRemediation: (finding.aiExplanation?.remediation || []).join(" | "),
    reasons: (finding.whyDetected.reasons || []).join(" | "),
    howToFix: (finding.howToFix || []).join(" | "),
    evidence: finding.evidence.valuePreview
  }));
}

function generateDetailedJsonReport(state, selectedHostOnly = true) {
  const scansByHost = state?.scansByHost || {};
  const hosts = selectedHostOnly && selectedHost ? [selectedHost] : Object.keys(scansByHost);

  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      generatedBy: "Browser Memory Inspector",
      reportType: "detailed-vulnerability-summary",
      selectedHostOnly: selectedHostOnly && !!selectedHost
    },
    summary: {
      scannedHosts: hosts.length,
      totalFindings: 0,
      high: 0,
      medium: 0,
      low: 0,
      hunterTotal: 0
    },
    findings: [],
    hunterFindings: [],
    executiveSummary: null,
    complianceSummary: null,
    level3Findings: {
      domFindings: [],
      endpoints: []
    }
  };

  for (const host of hosts) {
    const scan = scansByHost[host];
    if (!scan) continue;

    const alerts = scan.alerts || [];
    const hunterFindings = scan.hunterFindings || [];
    for (const alert of alerts) {
      report.findings.push(createDetailedFinding(alert));
      report.summary.totalFindings += 1;
      if (alert.riskLevel === "high") report.summary.high += 1;
      else if (alert.riskLevel === "medium") report.summary.medium += 1;
      else report.summary.low += 1;
    }

    for (const finding of hunterFindings) {
      report.hunterFindings.push({
        host,
        category: finding.category,
        title: finding.title,
        severity: finding.severity,
        confidence: finding.confidence,
        verified: Boolean(finding.verified),
        path: finding.path,
        evidence: finding.evidence || [],
        remediation: finding.remediation || [],
        references: finding.references || []
      });
      report.summary.hunterTotal += 1;
    }

    const domFindings = scan?.level3Findings?.domFindings || [];
    const endpoints = scan?.level3Findings?.endpoints || [];

    report.level3Findings.domFindings.push(
      ...domFindings.map((f) => ({
        host,
        type: f.type,
        location: f.location,
        risk: f.risk,
        valuePreview: f.valuePreview || f.content || f.name || f.key || "n/a"
      }))
    );

    report.level3Findings.endpoints.push(
      ...endpoints.map((e) => ({
        host,
        endpoint: e.endpoint,
        type: e.type,
        location: e.location,
        risk: e.risk
      }))
    );
  }

  report.executiveSummary = buildExecutiveSummary(report);
  report.complianceSummary = buildComplianceSummary(report);

  return report;
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportDetailedCsv() {
  if (!lastState) {
    statusLine.textContent = "No scan data available to export.";
    return;
  }

  const report = generateDetailedJsonReport(lastState, true);
  const rows = buildDetailedRows(report);
  const headers = ["Severity", "Host", "Page URL", "Storage Type", "Key", "Keywords", "Context", "Validation", "AI Risk Description", "AI Business Impact", "AI Compliance Notes", "AI Remediation", "Why Detected", "How To Fix", "Evidence"];
  const csvLines = [
    headers.join(","),
    ...rows.map((row) => [
      row.severity,
      row.host,
      row.pageUrl,
      row.storageType,
      row.key,
      row.keywords,
      row.context,
      row.validation,
      row.aiRiskDescription,
      row.aiBusinessImpact,
      row.aiComplianceNotes,
      row.aiRemediation,
      row.reasons,
      row.howToFix,
      row.evidence
    ].map(toCsvValue).join(","))
  ];

  const hostPart = selectedHost || "all-sites";
  const filename = `bmi-detailed-vulnerability-summary-${hostPart}-${Date.now()}.csv`;
  downloadFile(filename, csvLines.join("\n"), "text/csv");
}

function exportDetailedHtml() {
  if (!lastState) {
    statusLine.textContent = "No scan data available to export.";
    return;
  }

  const report = generateDetailedJsonReport(lastState, true);
  const rows = buildDetailedRows(report);
  const cards = `
    <div class="report-summary">
      <div><strong>Hosts Scanned:</strong> ${report.summary.scannedHosts}</div>
      <div><strong>Total Findings:</strong> ${report.summary.totalFindings}</div>
      <div><strong>High:</strong> ${report.summary.high}</div>
      <div><strong>Medium:</strong> ${report.summary.medium}</div>
      <div><strong>Low:</strong> ${report.summary.low}</div>
    </div>
    <div class="report-summary">
      <div><strong>Executive Score:</strong> ${report.executiveSummary?.score ?? 0}/100</div>
      <div><strong>Grade:</strong> ${report.executiveSummary?.grade ?? "F"}</div>
      <div><strong>GDPR:</strong> ${report.complianceSummary?.gdpr?.applicable ? "Review" : "Clear"}</div>
      <div><strong>CCPA:</strong> ${report.complianceSummary?.ccpa?.applicable ? "Review" : "Clear"}</div>
      <div><strong>PCI:</strong> ${report.complianceSummary?.pciDss?.applicable ? "Review" : "Clear"}</div>
    </div>
  `;

  const findingsHtml = rows.map((row) => `
    <section class="finding-card">
      <h2>${escapeHtml(row.key)} <span class="badge ${escapeHtml(row.severity)}">${escapeHtml(row.severity.toUpperCase())}</span></h2>
      <p><strong>Where Found:</strong> ${escapeHtml(row.host)} | ${escapeHtml(row.pageUrl)} | ${escapeHtml(row.storageType)}</p>
      <p><strong>Keyword Logic:</strong> ${escapeHtml(row.keywords || "none")}</p>
      <p><strong>Context Logic:</strong> ${escapeHtml(row.context || "none")}</p>
      <p><strong>Validation Logic:</strong> ${escapeHtml(row.validation || "none")}</p>
      <p><strong>AI Risk Description:</strong> ${escapeHtml(row.aiRiskDescription || "none")}</p>
      <p><strong>AI Business Impact:</strong> ${escapeHtml(row.aiBusinessImpact || "none")}</p>
      <p><strong>AI Compliance Notes:</strong> ${escapeHtml(row.aiComplianceNotes || "none")}</p>
      <p><strong>AI Remediation:</strong> ${escapeHtml(row.aiRemediation || "none")}</p>
      <p><strong>Why Detected:</strong> ${escapeHtml(row.reasons || "none")}</p>
      <p><strong>How To Fix:</strong> ${escapeHtml(row.howToFix || "none")}</p>
      <p><strong>Evidence:</strong> ${escapeHtml(row.evidence || "n/a")}</p>
    </section>
  `).join("");

  const html = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Browser Memory Inspector - Detailed Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; background: #0f172a; color: #e2e8f0; }
    h1, h2, h3 { color: #f8fafc; }
    .report-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin: 20px 0; }
    .report-summary div { background: #111827; border: 1px solid #334155; border-radius: 12px; padding: 12px; }
    .finding-card { background: #111827; border: 1px solid #334155; border-radius: 14px; padding: 16px; margin: 16px 0; }
    .badge { display: inline-block; margin-left: 8px; padding: 2px 8px; border-radius: 999px; font-size: 12px; }
    .badge.high { background: #7f1d1d; color: #fecaca; }
    .badge.medium { background: #78350f; color: #fde68a; }
    .badge.low { background: #14532d; color: #bbf7d0; }
    p { line-height: 1.5; }
    code { background: #0b1220; padding: 2px 6px; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>Detailed Vulnerability Report</h1>
  <p>Generated at ${escapeHtml(report.metadata.generatedAt)}</p>
  <section class="finding-card">
    <h2>Executive Summary</h2>
    <p><strong>Score:</strong> ${escapeHtml(String(report.executiveSummary?.score ?? 0))}/100</p>
    <p><strong>Grade:</strong> ${escapeHtml(report.executiveSummary?.grade ?? "F")}</p>
    <p><strong>Summary:</strong> ${escapeHtml(report.executiveSummary?.summary || "")}</p>
    <p><strong>Top Threats:</strong> ${escapeHtml((report.executiveSummary?.topThreats || []).join(" | ") || "none")}</p>
    <p><strong>Recommended Actions:</strong> ${escapeHtml((report.executiveSummary?.recommendedActions || []).join(" | ") || "none")}</p>
  </section>
  <section class="finding-card">
    <h2>Compliance Summary</h2>
    <p><strong>GDPR:</strong> ${escapeHtml(report.complianceSummary?.gdpr?.note || "")}</p>
    <p><strong>CCPA:</strong> ${escapeHtml(report.complianceSummary?.ccpa?.note || "")}</p>
    <p><strong>PCI:</strong> ${escapeHtml(report.complianceSummary?.pciDss?.note || "")}</p>
  </section>
  ${cards}
  ${findingsHtml || "<p>No findings.</p>"}
</body>
</html>`;

  const hostPart = selectedHost || "all-sites";
  const filename = `bmi-detailed-vulnerability-summary-${hostPart}-${Date.now()}.html`;
  downloadFile(filename, html, "text/html");
}

function exportDetailedJson() {
  if (!lastState) {
    statusLine.textContent = "No scan data available to export.";
    return;
  }

  const report = generateDetailedJsonReport(lastState, true);
  const hostPart = selectedHost || "all-sites";
  const filename = `bmi-detailed-vulnerability-summary-${hostPart}-${Date.now()}.json`;
  downloadFile(filename, JSON.stringify(report, null, 2), "application/json");
}

function toSarifLevel(severity) {
  if (severity === "critical" || severity === "high") return "error";
  if (severity === "medium") return "warning";
  return "note";
}

function exportDetailedSarif() {
  if (!lastState) {
    statusLine.textContent = "No scan data available to export.";
    return;
  }

  const report = generateDetailedJsonReport(lastState, true);
  const results = [];

  for (const finding of report.findings || []) {
    results.push({
      ruleId: `BMI-${String(finding.severity || "low").toUpperCase()}`,
      level: toSarifLevel(finding.severity),
      message: {
        text: `${finding.whereFound?.key || "finding"}: ${(finding.whyDetected?.reasons || []).join(" | ") || "Detected by BMI"}`
      },
      locations: [{
        physicalLocation: {
          artifactLocation: {
            uri: `${finding.whereFound?.host || "unknown"}${finding.whereFound?.pageUrl || ""}`
          }
        }
      }]
    });
  }

  for (const finding of report.hunterFindings || []) {
    results.push({
      ruleId: `BMI-HUNTER-${String(finding.category || "general").toUpperCase()}`,
      level: toSarifLevel(finding.severity),
      message: {
        text: `${finding.title || "Hunter finding"} | ${finding.category || "general"}`
      },
      locations: [{
        physicalLocation: {
          artifactLocation: {
            uri: `${finding.host || "unknown"}${finding.path || ""}`
          }
        }
      }]
    });
  }

  const sarif = {
    version: "2.1.0",
    $schema: "https://schemastore.azurewebsites.net/schemas/json/sarif-2.1.0-rtm.5.json",
    runs: [{
      tool: {
        driver: {
          name: "Browser Memory Inspector",
          version: "1.0.0"
        }
      },
      results
    }]
  };

  const hostPart = selectedHost || "all-sites";
  const filename = `bmi-detailed-vulnerability-summary-${hostPart}-${Date.now()}.sarif`;
  downloadFile(filename, JSON.stringify(sarif, null, 2), "application/json");
}

async function copyDetailedJson() {
  if (!lastState) {
    statusLine.textContent = "No scan data available to copy.";
    return;
  }

  const report = generateDetailedJsonReport(lastState, true);
  try {
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    statusLine.textContent = "Detailed vulnerability JSON copied to clipboard.";
  } catch (_err) {
    statusLine.textContent = "Clipboard copy failed. Use JSON download instead.";
  }
}

refreshButton.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "BMI_REQUEST_ACTIVE_SCAN" }, () => {
    requestState();
  });
});

hostFilterInput.addEventListener("input", () => {
  if (lastState) {
    render(lastState);
  }
});

sortSelect.addEventListener("change", () => {
  if (lastState) {
    render(lastState);
  }
});

siteSelect.addEventListener("change", () => {
  selectedHost = siteSelect.value;
  if (lastState) {
    render(lastState);
  }
});

if (exportJsonBtn) {
  exportJsonBtn.addEventListener("click", () => {
    exportDetailedJson();
  });
}

if (exportCopyBtn) {
  exportCopyBtn.addEventListener("click", () => {
    copyDetailedJson();
  });
}

if (exportCsvBtn) {
  exportCsvBtn.addEventListener("click", () => {
    exportDetailedCsv();
  });
}

if (exportHtmlBtn) {
  exportHtmlBtn.addEventListener("click", () => {
    exportDetailedHtml();
  });
}

if (exportSarifBtn) {
  exportSarifBtn.addEventListener("click", () => {
    exportDetailedSarif();
  });
}

if (saveGeminiKeyBtn) {
  saveGeminiKeyBtn.addEventListener("click", () => {
    saveGeminiKey().catch((error) => {
      if (aiStatus) {
        aiStatus.textContent = `Failed to save key: ${error instanceof Error ? error.message : "unknown error"}`;
      }
    });
  });
}

if (saveHunterModeBtn) {
  saveHunterModeBtn.addEventListener("click", () => {
    saveHunterMode().catch((error) => {
      statusLine.textContent = `Failed to save hunter mode: ${error instanceof Error ? error.message : "unknown error"}`;
    });
  });
}

if (saveHunterPolicyBtn) {
  saveHunterPolicyBtn.addEventListener("click", () => {
    saveHunterPolicy().catch((error) => {
      statusLine.textContent = `Failed to save hunter policy: ${error instanceof Error ? error.message : "unknown error"}`;
    });
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "BMI_STATE_UPDATE") {
    render(message.payload);
  }
});

requestState();
loadGeminiKey();
loadHunterMode();
loadHunterPolicy();
