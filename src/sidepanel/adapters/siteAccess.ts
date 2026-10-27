// Whether the extension may run its content script on web pages. Without it, sign-in forms are
// not found and the tools cannot reach the page. Firefox lets users skip or revoke this access
// (Manifest V3 host permissions), and Chrome lets them limit it to "On click". The access is the
// content script's own, so asking for it again needs no new permission.
import { useEffect, useState } from 'react';

const ALL_SITES = { origins: ['<all_urls>'] };

export const hasSiteAccess = async (): Promise<boolean> => {
  try {
    return await chrome.permissions.contains(ALL_SITES);
  } catch (error) {
    // No permissions API: nothing to check, assume the manifest's access.
    return true;
  }
};

// Must be called from a click: browsers only ask the user in response to one.
export const requestSiteAccess = async (): Promise<boolean> => {
  try {
    return await chrome.permissions.request(ALL_SITES);
  } catch (error) {
    return false;
  }
};

// null while checking.
export const useSiteAccess = () => {
  const [granted, setGranted] = useState<boolean | null>(null);
  useEffect(() => {
    const check = () => hasSiteAccess().then(setGranted);
    check();
    const events = chrome.permissions && [chrome.permissions.onAdded, chrome.permissions.onRemoved];
    events?.forEach(event => event?.addListener(check));
    return () => events?.forEach(event => event?.removeListener(check));
  }, []);
  const request = async () => setGranted(await requestSiteAccess());
  return { granted, request };
};
