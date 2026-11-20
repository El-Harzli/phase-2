import { useEffect } from "react";

const SITE_NAME = "BSI Properties";

// Sets the browser tab title. Every route calls this with its own
// page-specific title (or, for the admin, it's wired once in Dashboard.jsx
// using the same PAGE_TITLES map already driving the topbar heading —
// rather than adding this call to every individual admin page).
//
// When whatever called it goes away (an overlay closing over a page, say), the
// title it replaced comes back — but only if the tab still shows the title this
// call set, so a title another page set in the meantime is never overwritten.
export default function usePageTitle(title) {
  useEffect(() => {
    const previousTitle = document.title;
    const nextTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = nextTitle;

    return () => {
      if (document.title === nextTitle) document.title = previousTitle;
    };
  }, [title]);
}
