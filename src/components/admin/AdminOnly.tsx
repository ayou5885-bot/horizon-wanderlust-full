import type { ReactNode } from "react";
import { getRouteApi } from "@tanstack/react-router";

const adminRoute = getRouteApi("/admin");

export function AdminOnly({ children }: { children: ReactNode }) {
  const { staff } = adminRoute.useRouteContext();
  if (staff.role !== "admin") return <p className="rounded-xl bg-card p-6">Accès réservé aux administrateurs.</p>;
  return <>{children}</>;
}

export const inputCls = "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm";
export const btnPrimary = "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50";
export const btnGhost = "rounded-lg border bg-card px-3 py-1.5 text-sm hover:bg-muted";
export const btnDanger = "rounded-lg bg-destructive px-3 py-1.5 text-sm text-destructive-foreground";

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
