import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useI18n, formatDZD } from "@/lib/i18n";
import { usePackages } from "@/hooks/use-packages";
import { useDestinations } from "@/hooks/use-destinations";
import { PackageCard, PageHeader } from "@/components/site/Cards";

const search = z.object({
  destination: z.string().optional(),
  maxPrice: z.coerce.number().optional(),
  duration: z.enum(["short", "medium", "long"]).optional(),
});

export const Route = createFileRoute("/packages/")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Circuits organisés — Sahara Voyages" },
      { name: "description", content: "Filtrez nos circuits par destination, budget et durée. Prix en DZD." },
      { property: "og:title", content: "Circuits organisés — Sahara Voyages" },
      { property: "og:description", content: "Tous nos circuits avec départs garantis." },
    ],
  }),
  component: PackagesPage,
});

function PackagesPage() {
  const { t, lang } = useI18n();
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/packages/" });
  const { data: packages = [], isLoading } = usePackages();
  const { data: destinations = [] } = useDestinations();
  const dmap = Object.fromEntries(destinations.map((d) => [d.id, d]));
  const maxAll = Math.max(100000, ...packages.map((p) => Number(p.price_per_person)));
  const list = packages.filter((p) =>
    (!s.destination || p.destination_id === s.destination) &&
    (!s.maxPrice || Number(p.price_per_person) <= s.maxPrice) &&
    (!s.duration || (s.duration === "short" ? p.duration_days <= 5 : s.duration === "medium" ? p.duration_days >= 6 && p.duration_days <= 8 : p.duration_days >= 9)));
  const set = (patch: Partial<z.infer<typeof search>>) => navigate({ search: (prev) => ({ ...prev, ...patch }) });

  return (
    <>
      <PageHeader title={t("navPackages")} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 grid gap-4 rounded-2xl bg-card p-5 shadow-card md:grid-cols-3">
          <label className="text-sm font-medium">{t("destination")}
            <select value={s.destination ?? ""} onChange={(e) => set({ destination: e.target.value || undefined })} className="mt-1 w-full rounded-lg border bg-background px-3 py-2">
              <option value="">{t("allDestinations")}</option>
              {destinations.map((d) => <option key={d.id} value={d.id}>{lang === "ar" ? d.name_ar : d.name_fr}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">{t("maxPrice")}: {formatDZD(s.maxPrice ?? maxAll, lang)}
            <input type="range" min={20000} max={maxAll} step={5000} value={s.maxPrice ?? maxAll}
              onChange={(e) => set({ maxPrice: Number(e.target.value) })} className="mt-3 w-full accent-primary" />
          </label>
          <label className="text-sm font-medium">{t("duration")}
            <select value={s.duration ?? ""} onChange={(e) => set({ duration: (e.target.value || undefined) as never })} className="mt-1 w-full rounded-lg border bg-background px-3 py-2">
              <option value="">{t("anyDuration")}</option>
              <option value="short">{t("shortTrip")}</option>
              <option value="medium">{t("mediumTrip")}</option>
              <option value="long">{t("longTrip")}</option>
            </select>
          </label>
        </div>
        {isLoading ? <p>{t("loading")}</p> : list.length === 0 ? <p>{t("noResults")}</p> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => <PackageCard key={p.id} p={p} dest={dmap[p.destination_id]} />)}
          </div>
        )}
      </div>
    </>
  );
}
