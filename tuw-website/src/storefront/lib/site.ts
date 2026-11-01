// Site + nav config — replaces old src/config/ folder.
// No secrets here.
export const site = {
  name: "The Unplugged Wear",
  nav: [
    { href: "/shop", label: "Shop" },
    { href: "/collections", label: "Collections" },
    { href: "/journal", label: "Journal" },
    { href: "/about", label: "About" },
  ],
  footer: [
    { href: "/policies/shipping", label: "Shipping" },
    { href: "/policies/returns", label: "Returns" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ],
  // Brand social profiles shown in the top bar. Handles are placeholders
  // until the owner confirms the real accounts.
  social: {
    instagram: "https://www.instagram.com/theunpluggedwear",
    facebook: "https://www.facebook.com/theunpluggedwear",
    pinterest: "https://www.pinterest.com/theunpluggedwear",
    x: "https://x.com/theunpluggedwear",
  },
} as const;
