import { useLocation, useNavigate } from "react-router";
import { buildPropertyUrl } from "@/shared/lib/propertyUrl";

// Returns a function that opens a property as an overlay on top of the page the
// visitor is on now: the current location is passed along as `backgroundLocation`,
// which SiteApp uses to keep that page rendered underneath.
export default function useOpenProperty() {
  const navigate = useNavigate();
  const location = useLocation();

  // Same overlay-on-top-of-the-current-page navigation BrowsePage uses —
  // keeps the homepage underneath instead of losing scroll position.
  return (property) => {
    navigate(buildPropertyUrl(property), { state: { backgroundLocation: location } });
  };
}
