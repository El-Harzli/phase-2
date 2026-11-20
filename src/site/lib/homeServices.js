import { IoKeyOutline, IoHomeOutline } from "react-icons/io5";
import { TbAward } from "react-icons/tb";

/* ============================================================
   SHARED DATA — single source of truth for both layouts
   ============================================================ */
export const SERVICES = [
  {
    icon: IoHomeOutline,
    title: "Rent Real Estate",
    description:
      "Find your perfect rental home, or list your property with our thorough tenant screening and management services.",
    cta: "View Properties for Rent",
    number: "01",
    accent: "Perfect Match",
    to: "/properties/rent",
  },
  {
    icon: IoKeyOutline,
    title: "Buy Real Estate",
    description:
      "Expert guidance to secure your property at the best market value, backed by sharp negotiation and professional marketing.",
    cta: "View Properties for Sale",
    number: "02",
    accent: "Maximize Value",
    to: "/properties/sale",
  },
  {
    icon: TbAward,
    title: "Property Concierge",
    description:
      "Premium property management and personalized care for homeowners and investors who expect more in Tangier.",
    cta: "Discover Concierge Services",
    number: "03",
    accent: "White Glove Service",
    to: "/concierge",
  },
];
