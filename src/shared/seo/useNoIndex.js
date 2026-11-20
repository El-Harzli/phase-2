import { useEffect } from "react";

// Adds <meta name="robots" content="noindex, nofollow"> for as long as the
// component that calls it is mounted, and removes it again on unmount. Used in
// three places: once at the top of AdminApp (the whole dashboard), in
// NotFoundPage, and in the "property doesn't exist" state of PropertyDetailPage
// (mounted only while that state is on screen). The removal matters: Topbar has
// a "View Site" link back to "/", and since AdminApp/PublicSite share one
// BrowserRouter (see App.jsx), that's a client-side navigation, not a fresh
// page load — without cleanup, the tag this hook added while in /admin would
// still be sitting in <head> after navigating back to the public site, silently
// noindexing it too. The same goes for leaving a not-found state for a real
// page.
//
// robots.txt already disallows crawling /admin at all, so in practice
// this is defense-in-depth for the case where an /admin URL gets linked
// from somewhere external despite that — robots.txt stops crawling, this
// stops indexing the bare URL if it ever gets requested anyway.
export default function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "noindex, nofollow");
    document.head.appendChild(meta);

    return () => {
      document.head.removeChild(meta);
    };
  }, []);
}
