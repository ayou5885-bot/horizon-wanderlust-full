import { createFileRoute, redirect } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useBookings } from "@/hooks/use-bookings";
import { useUpcomingDeparturesCount } from "@/hooks/use-package-departures";
import { useHotels } from "@/hooks/use-hotels";
import { usePackages } from "@/hooks/use-packages";

export const Route = createFileRoute("/admin/")({
  beforeLoad: ({ context }) => {
    if (context.staff.role !== "admin") throw redirect({ to: "/admin/bookings" });
  },
  component: Dashboard,
});

function Dashboard() {
  const { data: bookings = [] } = useBookings();
  const { data: upcoming = 0 } = useUpcomingDeparturesCount(30);
  const { data: hotels = [] } = useHotels({ includeInactive: true });
  const { data: packages = [] } = usePackages({ includeInactive: true });
  const weekAgo = Date.now() - 7 * 86400000;
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { day: d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }), count: bookings.filter((b) => b.created_at?.slice(0, 10) === key).length };
  });
  const stats = [
    { label: "Demandes en attente", value: bookings.filter((b) => b.status === "pending").length },
    { label: "Demandes cette semaine", value: bookings.filter((b) => b.created_at && new Date(b.created_at).getTime() >= weekAgo).length },
    { label: "Départs (30 prochains jours)", value: upcoming },
    { label: "Hôtels / Circuits", value: `${hotels.length} / ${packages.length}` },
  ];
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Tableau de bord</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-5 shadow-card">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h2 className="mb-4 font-semibold">Demandes — 7 derniers jours</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={days}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" name="Demandes" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
