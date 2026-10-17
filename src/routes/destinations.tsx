import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useDestinations } from "@/hooks/use-destinations";
import { usePackages } from "@/hooks/use-packages";
import { useHotels } from "@/hooks/use-hotels";
import { PageHeader } from "@/components/site/Cards";

export const Route = createFileRoute("/destinations")({
  head: () => ({
    meta: [
      { title: "Destinations — Sahara Voyages" },
      { name: "description", content: "Découvrez nos destinations : Turquie, Émirats, Tunisie, Égypte et plus." },
      { property: "og:title", content: "Destinations — Sahara Voyages" },
      { property: "og:description", content: "Toutes nos destinations de voyage au départ de l'Algérie." },
    ],
  }),
  component: DestinationsPage,
});

function DestinationsPage() {
  const { t, lang } = useI18n();
  const { data: destinations = [], isLoading } = useDestinations();
  const { data: packages = [] } = usePackages();
  const { data: hotels = [] } = useHotels();
  const [country, setCountry] = useState("");
  const [q, setQ] = useState("");
  const countries = [...new Set(destinations.map((d) => d.country))];
  const list = destinations.filter((d) =>
    (!country || d.country === country) &&
    (!q || `${d.name_ar} ${d.name_fr} ${d.country}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <>
      <PageHeader title={t("navDestinations")} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-wrap gap-3">
          <label className="sr-only" htmlFor="dq">{t("search")}</label>
          <input id="dq" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")}
            className="rounded-xl border bg-card px-4 py-2.5" />
          <label className="sr-only" htmlFor="dc">{t("country")}</label>
          <select id="dc" value={country} onChange={(e) => setCountry(e.target.value)} className="rounded-xl border bg-card px-4 py-2.5">
            <option value="">{t("allCountries")}</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {isLoading ? <p>{t("loading")}</p> : list.length === 0 ? <p>{t("noResults")}</p> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((d) => (
              <Link key={d.id} to="/packages" search={{ destination: d.id }}
                className="group relative h-80 overflow-hidden rounded-2xl shadow-card">
                {d.image && <img src={d.image} alt={lang === "ar" ? d.name_ar : d.name_fr} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                <div className="hero-overlay absolute inset-0" />
                <div className="absolute bottom-5 start-5 text-ink-foreground">
                  <p className="text-sm opacity-80">{d.country}</p>
                  <h2 className="text-3xl font-bold">{lang === "ar" ? d.name_ar : d.name_fr}</h2>
                  <p className="mt-1 text-sm">
                    {packages.filter((p) => p.destination_id === d.id).length} {t("packagesCount")} · {hotels.filter((h) => h.destination_id === d.id).length} {t("hotelsCount")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
