const state = {
  activeTabId: null,
  activeScan: null,
  lastError: null,
  scansByHost: {}
};

function notifyPopup() {
  chrome.runtime.sendMessage({
    type: "BMI_STATE_UPDATE",
    payload: state
  }).catch(() => {
    // Popup might be closed; ignore.
  });
}

function triggerScanOnTab(tabId) {
  if (!tabId || tabId < 0) {
    return;
  }

  chrome.tabs.sendMessage(tabId, { type: "BMI_TRIGGER_SCAN" }).catch(() => {
    // Tab may not have content script (chrome:// etc.).
  });
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  state.activeTabId = tabId;
  triggerScanOnTab(tabId);
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

    if (sender.tab && sender.tab.id === state.activeTabId) {
      state.activeScan = payload;
    } else if (state.activeTabId === null) {
      state.activeScan = payload;
      state.activeTabId = sender.tab?.id ?? null;
    }

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

chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab?.id) {
      state.activeTabId = activeTab.id;
      triggerScanOnTab(activeTab.id);
    }
  });
});
