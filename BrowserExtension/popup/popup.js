const highCount = document.getElementById("highCount");
const mediumCount = document.getElementById("mediumCount");
const totalCount = document.getElementById("totalCount");
const statusLine = document.getElementById("statusLine");
const highList = document.getElementById("highList");
const mediumList = document.getElementById("mediumList");
const errorPanel = document.getElementById("errorPanel");
const errorText = document.getElementById("errorText");
const refreshButton = document.getElementById("refreshButton");

function formatTime(timestamp) {
  if (!timestamp) return "n/a";
  return new Date(timestamp).toLocaleTimeString();
}

function findingItemMarkup(alert) {
  const firstReason = alert.reasons?.[0] || "Potential sensitive data exposure";
  return `
    <li class="finding-item">
      <p class="title">${alert.location?.key || alert.entry?.key || "unknown"}</p>
      <p class="meta">Site: ${alert.location?.host || "unknown"}</p>
      <p class="meta">Storage: ${alert.location?.storageType || alert.entry?.type || "unknown"}</p>
      <p class="meta">Reason: ${firstReason}</p>
    </li>
  `;
}

function renderList(element, alerts, emptyText) {
  if (!alerts || alerts.length === 0) {
    element.innerHTML = `<li class="empty">${emptyText}</li>`;
    return;
  }

  element.innerHTML = alerts.slice(0, 8).map(findingItemMarkup).join("");
}

function render(state) {
  const scan = state?.activeScan;
  const alerts = scan?.alerts || [];
  const highAlerts = alerts.filter((a) => a.riskLevel === "high");
  const mediumAlerts = alerts.filter((a) => a.riskLevel === "medium");

  highCount.textContent = String(highAlerts.length);
  mediumCount.textContent = String(mediumAlerts.length);
  totalCount.textContent = String(scan?.entries?.length || 0);

  if (scan?.host) {
    statusLine.textContent = `Active site: ${scan.host} | Last scan: ${formatTime(scan.timestamp)}`;
  } else {
    statusLine.textContent = "Open a website tab and click Refresh Scan.";
  }

  renderList(highList, highAlerts, "No High vulnerabilities found.");
  renderList(mediumList, mediumAlerts, "No Medium vulnerabilities found.");

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

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "BMI_STATE_UPDATE") {
    render(message.payload);
  }
});

requestState();
