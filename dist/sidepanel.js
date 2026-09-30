const tabId = new URLSearchParams(location.search).get("tabId");
document.querySelector("#tab").textContent = `Opened for tab ${tabId}`;
