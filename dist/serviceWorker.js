// Set to false for the control case: new tabs get no tab-specific side panel
// options, and closing a background tab no longer closes the active tab's panel.
const SET_OPTIONS_ON_NEW_TABS = true;

const panelPath = (tabId) => `sidepanel.html?tabId=${tabId}`;

// The toolbar button opens a tab-specific side panel on the clicked tab.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });

chrome.action.onClicked.addListener((tab) => {
  // Not awaited, so open() still runs inside the user gesture.
  chrome.sidePanel.setOptions({
    tabId: tab.id,
    path: panelPath(tab.id),
    enabled: true,
  });
  chrome.sidePanel.open({ tabId: tab.id });
});

// Give every new tab its own tab-specific side panel options.
chrome.tabs.onCreated.addListener((tab) => {
  if (SET_OPTIONS_ON_NEW_TABS && tab.id) {
    chrome.sidePanel.setOptions({ tabId: tab.id, path: panelPath(tab.id) });
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) =>
  console.log("tabs.onActivated", tabId),
);
chrome.tabs.onRemoved.addListener((tabId) =>
  console.log("tabs.onRemoved", tabId),
);
chrome.sidePanel.onOpened?.addListener((info) =>
  console.log("sidePanel.onOpened", info),
);
chrome.sidePanel.onClosed?.addListener((info) =>
  console.log("sidePanel.onClosed", info),
);
