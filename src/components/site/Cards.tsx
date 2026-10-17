import { Link } from "@tanstack/react-router";
import { Star, Clock, MapPin } from "lucide-react";
import { formatDZD, useI18n } from "@/lib/i18n";
import type { Package } from "@/hooks/use-packages";
import type { Hotel } from "@/hooks/use-hotels";
import type { Destination } from "@/hooks/use-destinations";

export function PackageCard({ p, dest }: { p: Package; dest?: Destination | undefined }) {
  const { t, lang } = useI18n();
  return (
    <Link to="/packages/$slug" params={{ slug: p.slug }}
      className="group overflow-hidden rounded-2xl bg-card shadow-card transition hover:-translate-y-1">
      <div className="aspect-[4/3] overflow-hidden">
        <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="p-5">
        {dest && <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-accent"><MapPin className="h-3 w-3" aria-hidden />{lang === "ar" ? dest.name_ar : dest.name_fr}</p>}
        <h3 className="mt-1 text-lg font-semibold">{p.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.short_description}</p>
        <div className="mt-4 flex items-end justify-between">
          <span className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-4 w-4" aria-hidden />{p.duration_days} {t("days")}</span>
          <span className="text-end">
            <span className="block text-xs text-muted-foreground">{t("from")}</span>
            <span className="font-bold text-primary">{formatDZD(p.price_per_person, lang)}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex" aria-label={`${n} ★`}>
      {Array.from({ length: n }).map((_, i) => <Star key={i} className="h-4 w-4 fill-warning text-warning" aria-hidden />)}
    </span>
  );
}

export function HotelCard({ h, dest }: { h: Hotel; dest?: Destination | undefined }) {
  const { lang } = useI18n();
  return (
    <Link to="/hotels/$slug" params={{ slug: h.slug }}
      className="group overflow-hidden rounded-2xl bg-card shadow-card transition hover:-translate-y-1">
      <div className="aspect-[4/3] overflow-hidden">
        <img src={h.image} alt={h.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="p-5">
        <Stars n={h.star_rating} />
        <h3 className="mt-1 text-lg font-semibold">{h.name}</h3>
        {dest && <p className="text-sm text-muted-foreground">{lang === "ar" ? dest.name_ar : dest.name_fr}, {dest.country}</p>}
      </div>
    </Link>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bg-sand">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h1 className="text-4xl font-bold md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

export function BookingNotice() {
  const { t } = useI18n();
  return <p role="note" className="rounded-xl border border-warning/50 bg-warning/15 p-4 text-sm text-warning-foreground">{t("bookingNotice")}</p>;
}
