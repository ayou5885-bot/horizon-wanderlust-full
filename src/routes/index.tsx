import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Award, Headphones, BadgeDollarSign, ShieldCheck, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { usePackages } from "@/hooks/use-packages";
import { useHotels } from "@/hooks/use-hotels";
import { useDestinations } from "@/hooks/use-destinations";
import { PackageCard, HotelCard } from "@/components/site/Cards";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sahara Voyages — Circuits et hôtels au meilleur prix en DZD" },
      { name: "description", content: "Istanbul, Dubaï, Tunisie, Égypte : circuits organisés et hôtels sélectionnés depuis l'Algérie." },
      { property: "og:title", content: "Sahara Voyages — Votre agence de voyage" },
      { property: "og:description", content: "Circuits organisés et hôtels sélectionnés, prix en dinars algériens." },
    ],
  }),
  component: Home,
});

function Home() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [dest, setDest] = useState("");
  const { data: packages = [] } = usePackages();
  const { data: hotels = [] } = useHotels();
  const { data: destinations = [] } = useDestinations();
  const dmap = Object.fromEntries(destinations.map((d) => [d.id, d]));
  const trust = [
    { Icon: Award, title: t("trustYears"), desc: t("trustYearsDesc") },
    { Icon: Headphones, title: t("trustSupport"), desc: t("trustSupportDesc") },
    { Icon: BadgeDollarSign, title: t("trustPrice"), desc: t("trustPriceDesc") },
    { Icon: ShieldCheck, title: t("trustLocal"), desc: t("trustLocalDesc") },
  ];

  return (
    <>
      <section className="relative isolate flex min-h-[78vh] items-end overflow-hidden">
        <img src="/images/istanbul.jpg" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" width={1600} height={1008} />
        <div className="hero-overlay absolute inset-0 -z-10" />
        <div className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
          <h1 className="max-w-3xl text-5xl font-bold leading-tight text-ink-foreground md:text-7xl">{t("heroTitle")}</h1>
          <p className="mt-4 max-w-xl text-lg text-ink-foreground/90">{t("heroSubtitle")}</p>
          <form className="mt-8 flex max-w-xl flex-col gap-2 rounded-2xl bg-card p-2 shadow-card sm:flex-row"
            onSubmit={(e) => { e.preventDefault(); navigate({ to: "/packages", search: dest ? { destination: dest } : {} }); }}>
            <label className="sr-only" htmlFor="hero-dest">{t("destination")}</label>
            <select id="hero-dest" value={dest} onChange={(e) => setDest(e.target.value)}
              className="flex-1 rounded-xl bg-transparent px-4 py-3 outline-none">
              <option value="">{t("searchPlaceholder")}</option>
              {destinations.map((d) => <option key={d.id} value={d.id}>{lang === "ar" ? d.name_ar : d.name_fr}</option>)}
            </select>
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-accent-foreground">
              <Search className="h-4 w-4" aria-hidden /> {t("search")}
            </button>
          </form>
          <div className="mt-4 flex gap-4 text-sm">
            <Link to="/destinations" className="font-semibold text-ink-foreground underline underline-offset-4">{t("heroCta2")}</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {trust.map(({ Icon, title, desc }) => (
          <div key={title} className="flex gap-4">
            <Icon className="h-8 w-8 shrink-0 text-accent" aria-hidden />
            <div><p className="font-semibold">{title}</p><p className="text-sm text-muted-foreground">{desc}</p></div>
          </div>
        ))}
      </section>

      <section className="overflow-hidden bg-sand py-14">
        <div className="mx-auto mb-8 flex max-w-7xl items-end justify-between px-4 sm:px-6">
          <h2 className="text-3xl font-bold md:text-4xl">{t("ourDestinations")}</h2>
          <Link to="/destinations" className="text-sm font-semibold text-primary">{t("viewAll")}</Link>
        </div>
        {destinations.length > 0 && (
          <div className="marquee flex w-max gap-5 px-4">
            {[...destinations, ...destinations].map((d, i) => (
              <Link key={`${d.id}-${i}`} to="/packages" search={{ destination: d.id }}
                className="relative h-64 w-72 shrink-0 overflow-hidden rounded-2xl">
                {d.image && <img src={d.image} alt={lang === "ar" ? d.name_ar : d.name_fr} loading="lazy" className="h-full w-full object-cover" />}
                <div className="hero-overlay absolute inset-0" />
                <span className="absolute bottom-4 start-4 text-2xl font-bold text-ink-foreground">{lang === "ar" ? d.name_ar : d.name_fr}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-3xl font-bold md:text-4xl">{t("featuredPackages")}</h2>
          <Link to="/packages" className="text-sm font-semibold text-primary">{t("viewAll")}</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.filter((p) => p.featured).slice(0, 6).map((p) => <PackageCard key={p.id} p={p} dest={dmap[p.destination_id]} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-3xl font-bold md:text-4xl">{t("featuredHotels")}</h2>
          <Link to="/hotels" className="text-sm font-semibold text-primary">{t("viewAll")}</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.filter((h) => h.featured).slice(0, 6).map((h) => <HotelCard key={h.id} h={h} dest={dmap[h.destination_id]} />)}
        </div>
      </section>
    </>
  );
}
