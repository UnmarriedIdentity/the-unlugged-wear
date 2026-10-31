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
  // Brand social profiles. Leave a URL empty to hide that icon; generic
  // network homepages are never linked.
  social: {
    pinterest: "",
    x: "",
    facebook: "",
    instagram: "",
  },
} as const;
