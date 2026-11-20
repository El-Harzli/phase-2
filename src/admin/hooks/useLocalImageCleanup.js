import { useEffect, useRef } from "react";
import { isLocalUrl } from "@/admin/lib/localImageUrl";

// Revoke any still-held local object URLs when the field unmounts — covers
// cancelling the form or navigating away without saving. Skipped when the
// form has just saved (preserveOnUnmountRef.current is true): see the earlier
// bug where premature revocation broke uploaded images after save.
// `urls` is a list: one URL for a single-photo field (pass `[value]`), or every
// photo for a gallery.
export default function useLocalImageCleanup(urls, preserveOnUnmountRef) {
  const urlsRef = useRef(urls);

  useEffect(() => {
    urlsRef.current = urls;
  });

  useEffect(() => {
    return () => {
      // This is a flag the form sets just before submitting, not a DOM ref, so it
      // has to be read when the cleanup runs — copying it at effect time (what the
      // lint rule suggests) would always capture `false`.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (preserveOnUnmountRef?.current) return;
      urlsRef.current.forEach((url) => {
        if (isLocalUrl(url)) URL.revokeObjectURL(url);
      });
    };
  }, [preserveOnUnmountRef]);
}
