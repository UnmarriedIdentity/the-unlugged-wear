// Staff RBAC — used in (dashboard)/layout.tsx + api/ handlers.
// Replaces old src/permissions/ folder. Keep as one file until roles grow.
export type StaffRole = "admin" | "manager" | "support";

export function requireStaff(role: StaffRole | undefined): void {
  if (!role) throw new Error("Unauthorized: staff only");
  // TODO: enforce per-route role matrix with Supabase custom claims.
}
