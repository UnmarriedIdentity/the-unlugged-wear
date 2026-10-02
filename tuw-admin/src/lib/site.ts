// Site + nav config — replaces old src/config/ folder.
// No secrets here. Read env via process.env in server code only.
export const site = {
  name: "TUW Admin",
  nav: [
    { href: "/", label: "Overview" },
    { href: "/products", label: "Products" },
    { href: "/orders", label: "Orders" },
    { href: "/customers", label: "Customers" },
    { href: "/reports", label: "Reports" },
    { href: "/settings/general", label: "Settings" },
  ],
} as const;
