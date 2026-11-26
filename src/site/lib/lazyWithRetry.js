import { lazy } from "react";

// React.lazy for a page's code, plus one automatic recovery for the case that
// breaks lazy pages in real life: the site is redeployed while a visitor still
// has an old tab open. Every build renames its files, so the old tab asks for a
// page file that no longer exists, the import fails, and React.lazy remembers
// that failure — so even "Try Again" can't fix it until the page is reloaded.
// Here the page is reloaded for them, once. After the reload the browser has the
// new files and the page they asked for simply opens.
//
// The "already retried" flag is kept per page (`name`) in sessionStorage, so
// a failure on one page never uses up the retry of another, and it is cleared
// as soon as that page loads successfully, so a later redeploy can recover
// again in the same session. If the page still can't load after the reload, the
// error is thrown as usual and the site's error screen takes over.

const FLAG_PREFIX = "chunk-retry:";

// Returns true only if this page had not been retried yet AND the flag was
// saved. If sessionStorage is unavailable (some private modes) nothing can
// remember a retry, so reloading could loop forever — in that case do not reload.
function tryMarkRetried(name) {
  try {
    const key = FLAG_PREFIX + name;
    if (sessionStorage.getItem(key) === "1") return false;
    sessionStorage.setItem(key, "1");
    return true;
  } catch {
    return false;
  }
}

function clearRetried(name) {
  try {
    sessionStorage.removeItem(FLAG_PREFIX + name);
  } catch {
    // storage unavailable — nothing was saved, so nothing to clear
  }
}

export default function lazyWithRetry(importer, name) {
  return lazy(async () => {
    try {
      const pageModule = await importer();
      clearRetried(name);
      return pageModule;
    } catch (error) {
      // A visitor who is simply offline would only land on the browser's own
      // offline page after a reload, so leave them on the site's error screen.
      if (navigator.onLine !== false && tryMarkRetried(name)) {
        window.location.reload();
        // Keep React waiting while the page reloads, so no error screen flashes.
        return new Promise(() => {});
      }
      throw error;
    }
  });
}