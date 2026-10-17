import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useHotels } from "@/hooks/use-hotels";
import { useDestinations } from "@/hooks/use-destinations";
import { HotelCard, PageHeader } from "@/components/site/Cards";

export const Route = createFileRoute("/hotels/")({
  head: () => ({
    meta: [
      { title: "Hôtels — Sahara Voyages" },
      { name: "description", content: "Hôtels sélectionnés par destination et catégorie, prix par nuit en DZD." },
      { property: "og:title", content: "Hôtels — Sahara Voyages" },
      { property: "og:description", content: "Réservez votre hôtel avec notre agence." },
    ],
  }),
  component: HotelsPage,
});

function HotelsPage() {
  const { t, lang } = useI18n();
  const { data: hotels = [], isLoading } = useHotels();
  const { data: destinations = [] } = useDestinations();
  const [dest, setDest] = useState("");
  const [stars, setStars] = useState(0);
  const dmap = Object.fromEntries(destinations.map((d) => [d.id, d]));
  const list = hotels.filter((h) => (!dest || h.destination_id === dest) && (!stars || h.star_rating >= stars));
  return (
    <>
      <PageHeader title={t("navHotels")} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 grid gap-4 rounded-2xl bg-card p-5 shadow-card sm:grid-cols-2">
          <label className="text-sm font-medium">{t("destination")}
            <select value={dest} onChange={(e) => setDest(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2">
              <option value="">{t("allDestinations")}</option>
              {destinations.map((d) => <option key={d.id} value={d.id}>{lang === "ar" ? d.name_ar : d.name_fr}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">{t("stars")}
            <select value={stars} onChange={(e) => setStars(Number(e.target.value))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2">
              <option value={0}>{t("anyStars")}</option>
              {[3, 4, 5].map((n) => <option key={n} value={n}>{n}★ +</option>)}
            </select>
          </label>
        </div>
        {isLoading ? <p>{t("loading")}</p> : list.length === 0 ? <p>{t("noResults")}</p> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((h) => <HotelCard key={h.id} h={h} dest={dmap[h.destination_id]} />)}
          </div>
        )}
      </div>
    </>
  );
}
