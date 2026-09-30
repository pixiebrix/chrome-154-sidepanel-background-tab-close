# Chrome 154: closing a background tab closes the side panel on the active tab

In Chrome 154, closing a background tab that has tab-specific side panel options closes the extension side panel on the **active** tab. Chrome 153 keeps the panel open.

This repository is a minimum extension that reproduces it. It is based on [pixiebrix/minimum-extension-repro](https://github.com/pixiebrix/minimum-extension-repro).

## Environment

| Build | Result |
| --- | --- |
| Chrome for Testing 153.0.8010.52 (macOS) | Panel stays open |
| Chrome for Testing 154.0.8037.92 (macOS) | **Panel on the active tab closes** |
| Chrome 154 stable (macOS and Windows) | **Panel on the active tab closes** |

## Setup

1. Clone this repository.
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and select the `dist` folder.
3. Pin the extension to the toolbar.
4. Optional: on `chrome://extensions`, click **Inspect views: service worker** for the extension to watch its console.

## Steps to reproduce

1. Open a web page in a new tab, for example `https://example.com`. This is **tab A**.
2. Click the extension's toolbar button. The side panel opens on tab A.
3. Open a new tab with Ctrl+T (Cmd+T on macOS). This is **tab B**.
4. Click back to tab A. Its side panel is still open.
5. While tab A is active, close tab B with the **×** on its tab strip entry.

**Expected (Chrome 153):** the side panel on tab A stays open.

**Actual (Chrome 154):** the side panel on tab A closes. The service worker console logs `sidePanel.onClosed` for tab A at the moment tab B is removed:

```
tabs.onActivated <tab B>
tabs.onActivated <tab A>
sidePanel.onClosed {path: '/sidepanel.html', tabId: <tab A>, windowId: …}
tabs.onRemoved <tab B>
```

## What the extension does

`dist/serviceWorker.js` uses only tab-specific side panels:

- The toolbar button calls `chrome.sidePanel.setOptions({tabId, path, enabled: true})` and `chrome.sidePanel.open({tabId})` for the clicked tab.
- `chrome.tabs.onCreated` gives every new tab its own options: `chrome.sidePanel.setOptions({tabId, path})`.

There is no global side panel (`side_panel.default_path` is not set) and no content script.

## What does and does not trigger it

| Variation | Chrome 154 |
| --- | --- |
| Close tab B from the tab strip while tab A is active (steps above) | Panel on A closes |
| Close tab B while tab B is active, then land back on A | Panel on A stays open |
| Set `SET_OPTIONS_ON_NEW_TABS = false` in `dist/serviceWorker.js`, so tab B has no tab-specific options, then repeat the steps | Panel on A stays open |

So the trigger is closing a background tab that has its own tab-specific side panel options while another tab's panel is open.

## Suspected cause (not bisected)

From reading the source, this likely came in with [CL 7894790](https://chromium-review.googlesource.com/c/chromium/src/+/7894790), "Reference-count extension side panel action item" (merged 2026-08-18, first in 154), the fix for [issue 522127453](https://issues.chromium.org/issues/522127453):

- `ExtensionSidePanelCoordinator` now deregisters a tab's contextual entry when that tab is about to be deleted, while the tab is still attached to its window.
- `SidePanelRegistry::Deregister` then closes the side panel if `IsSidePanelEntryShowing(key, for_tab)` is true.
- `SidePanelUIBase::IsSidePanelEntryShowing` compares the entry key and whether the showing entry is tab-scoped, but not which tab it belongs to. Every tab-scoped entry for one extension shares the same key, so deregistering tab B's entry closes tab A's panel.

## Impact

Extensions that open side panels per tab lose the user's open panel whenever they close another tab from the tab strip. Users have to reopen the panel manually each time.
