// The toolbar icon opens the side panel, where all features are. The manifest's popup stays
// for browsers without a side panel, so it is only switched off where a side panel exists.
const openPanelOnActionClick = () => {
  if (!chrome.sidePanel || !chrome.sidePanel.setPanelBehavior) {
    return;
  }
  chrome.action.setPopup({ popup: '' });
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);
};

chrome.runtime.onInstalled.addListener(openPanelOnActionClick);
chrome.runtime.onStartup.addListener(openPanelOnActionClick);
openPanelOnActionClick();
