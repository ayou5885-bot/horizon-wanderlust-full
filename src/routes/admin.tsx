import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, CalendarCheck, MapPin, Package, Hotel, Megaphone, Settings, Users, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyStaffRow } from "@/hooks/use-staff";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const staff = await fetchMyStaffRow();
    if (!staff) throw redirect({ to: "/admin/login" });
    return { staff };
  },
  head: () => ({ meta: [{ title: "Administration — Sahara Voyages" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { staff } = Route.useRouteContext();
  const navigate = useNavigate();
  const isAdmin = staff.role === "admin";
  const links = [
    ...(isAdmin ? [{ to: "/admin", label: "Tableau de bord", Icon: LayoutDashboard }] : []),
    { to: "/admin/bookings", label: "Réservations", Icon: CalendarCheck },
    ...(isAdmin ? [
      { to: "/admin/destinations", label: "Destinations", Icon: MapPin },
      { to: "/admin/packages", label: "Circuits", Icon: Package },
      { to: "/admin/hotels", label: "Hôtels", Icon: Hotel },
      { to: "/admin/landing", label: "Pages saisonnières", Icon: Megaphone },
      { to: "/admin/staff", label: "Équipe", Icon: Users },
      { to: "/admin/settings", label: "Paramètres", Icon: Settings },
    ] : []),
  ] as const;
  return (
    <div dir="ltr" lang="fr" className="flex min-h-screen bg-muted">
      <aside className="w-60 shrink-0 bg-sidebar p-4 text-sidebar-foreground">
        <Link to="/" className="mb-6 block font-display text-lg font-bold">Sahara Voyages</Link>
        <nav className="space-y-1" aria-label="Administration">
          {links.map(({ to, label, Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: to === "/admin" }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-primary" }}>
              <Icon className="h-4 w-4" aria-hidden /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 border-t border-sidebar-border pt-4 text-xs">
          <p className="truncate">{staff.email}</p>
          <p className="opacity-70">{isAdmin ? "Administrateur" : "Staff"}</p>
          <button className="mt-3 flex items-center gap-2 text-sm" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/admin/login" }); }}>
            <LogOut className="h-4 w-4" aria-hidden /> Déconnexion
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1 p-6 lg:p-10"><Outlet /></div>
    </div>
  );
}
