// Site + nav config — replaces old src/config/ folder.
// No secrets here. Read env via process.env in server code only.
export const site = {
  name: "TUW Admin",
  nav: [
    { href: "/", label: "Dashboard" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/customers", label: "Customers" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/settings/general", label: "Settings" },
  ],
} as const;
