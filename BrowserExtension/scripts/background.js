const STORAGE_KEY = "BMI_PERSISTED_STATE_V1";

const state = {
  activeTabId: null,
  activeScan: null,
  lastError: null,
  scansByHost: {}
};

async function persistState() {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEY]: {
        scansByHost: state.scansByHost
      }
    });
  } catch (_error) {
    // Ignore persistence errors.
  }
}

async function hydrateState() {
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    const cached = stored?.[STORAGE_KEY];
    if (cached?.scansByHost && typeof cached.scansByHost === "object") {
      state.scansByHost = cached.scansByHost;
    }
  } catch (_error) {
    // Ignore hydration errors.
  }
}

function trimHostHistory(maxHosts = 50) {
  const hosts = Object.keys(state.scansByHost || {});
  if (hosts.length <= maxHosts) {
    return;
  }

  hosts
    .sort((a, b) => {
      const aTs = state.scansByHost[a]?.timestamp || 0;
      const bTs = state.scansByHost[b]?.timestamp || 0;
      return bTs - aTs;
    })
    .slice(maxHosts)
    .forEach((host) => {
      delete state.scansByHost[host];
    });
}

function notifyPopup() {
  chrome.runtime.sendMessage({
    type: "BMI_STATE_UPDATE",
    payload: state
  }).catch(() => {
    // Popup might be closed; ignore.
  });
}

function updateBadge() {
  if (!state.activeScan) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }

  const alerts = state.activeScan.alerts || [];
  const highCount = alerts.filter((a) => a.riskLevel === "high").length;

  if (highCount > 0) {
    chrome.action.setBadgeText({ text: String(highCount) });
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" }); // Red for high risk
  } else {
    const mediumCount = alerts.filter((a) => a.riskLevel === "medium").length;
    if (mediumCount > 0) {
      chrome.action.setBadgeText({ text: String(mediumCount) });
      chrome.action.setBadgeBackgroundColor({ color: "#f59e0b" }); // Orange for medium
    } else {
      chrome.action.setBadgeText({ text: "" });
    }
  }
}

function triggerScanOnTab(tabId) {
  if (!tabId || tabId < 0) {
    return;
  }

  chrome.tabs.sendMessage(tabId, { type: "BMI_TRIGGER_SCAN" }).catch(() => {
    // Tab may not have content script (chrome:// etc.).
  });
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
  state.activeTabId = tabId;
  triggerScanOnTab(tabId);
  updateBadge();
  notifyPopup();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    triggerScanOnTab(tabId);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "BMI_SCAN_RESULT") {
    const payload = message.payload;
    state.lastError = null;

    const host = payload.host || "unknown-host";
    state.scansByHost[host] = payload;
    trimHostHistory(50);
      // Level 3: Store DOM findings and API endpoints
      if (payload.level3Findings) {
        state.scansByHost[host].level3Findings = payload.level3Findings;
      }

    if (sender.tab && sender.tab.id === state.activeTabId) {
      state.activeScan = payload;
    } else if (state.activeTabId === null) {
      state.activeScan = payload;
      state.activeTabId = sender.tab?.id ?? null;
    }

    persistState();
    updateBadge();
    notifyPopup();
    sendResponse({ ok: true });
    return true;
  }

  if (message?.type === "BMI_SCAN_ERROR") {
    state.lastError = message.payload;
    notifyPopup();
    sendResponse({ ok: true });
    return true;
  }

  if (message?.type === "BMI_GET_STATE") {
    sendResponse({ ok: true, payload: state });
    return true;
  }

  if (message?.type === "BMI_REQUEST_ACTIVE_SCAN") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab?.id) {
        state.activeTabId = activeTab.id;
        triggerScanOnTab(activeTab.id);
      }
      sendResponse({ ok: true });
    });
    return true;
  }

  return false;
});

async function initialize() {
  await hydrateState();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab?.id) {
      state.activeTabId = activeTab.id;
      triggerScanOnTab(activeTab.id);
    }
    updateBadge();
    notifyPopup();
  });
}

chrome.runtime.onInstalled.addListener(() => {
  initialize();
});

chrome.runtime.onStartup.addListener(() => {
  initialize();
});

initialize();
