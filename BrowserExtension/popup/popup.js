const highCount = document.getElementById("highCount");
const mediumCount = document.getElementById("mediumCount");
const totalCount = document.getElementById("totalCount");
const siteCount = document.getElementById("siteCount");
const statusLine = document.getElementById("statusLine");
const highList = document.getElementById("highList");
const mediumList = document.getElementById("mediumList");
const indexedDbList = document.getElementById("indexedDbList");
const errorPanel = document.getElementById("errorPanel");
const errorText = document.getElementById("errorText");
const refreshButton = document.getElementById("refreshButton");
const hostFilterInput = document.getElementById("hostFilter");
const sortSelect = document.getElementById("sortSelect");
const siteSelect = document.getElementById("siteSelect");
const comparisonBody = document.getElementById("comparisonBody");
const siteTitle = document.getElementById("siteTitle");
const siteMeta = document.getElementById("siteMeta");

let lastState = null;
let selectedHost = "";

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
    renderList(highList, [], "No High vulnerabilities found.");
    renderList(mediumList, [], "No Medium vulnerabilities found.");
    renderIndexedDb(null);
    return;
  }

  const alerts = selectedScan.alerts || [];
  const highAlerts = alerts.filter((a) => a.riskLevel === "high");
  const mediumAlerts = alerts.filter((a) => a.riskLevel === "medium");

  siteTitle.textContent = `Selected Site: ${selectedHost}`;
  siteMeta.textContent = `Last Scan: ${formatTime(selectedScan.timestamp)} | URL: ${selectedScan.url || "n/a"}`;

  renderList(highList, highAlerts, "No High vulnerabilities found.");
  renderList(mediumList, mediumAlerts, "No Medium vulnerabilities found.");
  renderIndexedDb(selectedScan);
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
    statusLine.textContent = `Active site: ${activeScan.host} | Last scan: ${formatTime(activeScan.timestamp)}`;
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

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "BMI_STATE_UPDATE") {
    render(message.payload);
  }
});

requestState();
