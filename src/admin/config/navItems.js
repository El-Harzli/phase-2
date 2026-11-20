import {
  IoGridOutline,
  IoBusinessOutline,
  IoPeopleOutline,
  IoPricetagsOutline,
  IoSparklesOutline,
  IoSettingsOutline,
  IoStarOutline,
  IoLocationOutline,
} from "react-icons/io5";

export const NAV_ITEMS = [
  { to: "/admin", label: "Overview", title: "Dashboard", icon: IoGridOutline, end: true },
  { to: "/admin/properties", label: "Properties", title: "Properties", icon: IoBusinessOutline },
  { to: "/admin/featured", label: "Featured", title: "Featured on Homepage", icon: IoStarOutline },
  { to: "/admin/neighborhoods", label: "Neighborhoods", title: "Neighborhoods", icon: IoLocationOutline },
  { to: "/admin/agents", label: "Agents", title: "Agents", icon: IoPeopleOutline },
  { to: "/admin/categories", label: "Categories", title: "Categories", icon: IoPricetagsOutline },
  { to: "/admin/conveniences", label: "Conveniences", title: "Conveniences", icon: IoSparklesOutline },
  { to: "/admin/settings", label: "Settings", title: "Settings", icon: IoSettingsOutline },
];

export function getPageTitle(pathname) {
  const exact = NAV_ITEMS.find((item) => item.to === pathname);
  if (exact) return exact.title;
  const match = NAV_ITEMS.find((item) => item.to !== "/admin" && pathname.startsWith(item.to));
  return match ? match.title : "Dashboard";
}
