import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { useI18n, formatDZD, formatDate } from "@/lib/i18n";
import { usePackageBySlug } from "@/hooks/use-packages";
import { usePackageDepartures } from "@/hooks/use-package-departures";
import { useCreateBooking } from "@/hooks/use-bookings";
import { isFullyBooked, seatsRemaining } from "@/lib/pricing";
import { BookingNotice } from "@/components/site/Cards";
import { BookingConfirmation } from "@/components/site/BookingConfirmation";
import { ContactFields, type ContactState } from "@/components/site/ContactFields";

export const Route = createFileRoute("/packages/$slug")({
  head: () => ({
    meta: [
      { title: "Détails du circuit — Sahara Voyages" },
      { name: "description", content: "Programme, inclusions et départs disponibles pour ce circuit." },
      { property: "og:title", content: "Détails du circuit — Sahara Voyages" },
      { property: "og:description", content: "Choisissez votre date de départ et envoyez votre demande." },
    ],
  }),
  component: PackageDetail,
});

function PackageDetail() {
  const { slug } = Route.useParams();
  const { t, lang } = useI18n();
  const { data: p, isLoading } = usePackageBySlug(slug);
  const { data: departures = [] } = usePackageDepartures(p?.id, { upcomingOnly: true });
  const create = useCreateBooking();
  const [depId, setDepId] = useState<string>("");
  const [travelers, setTravelers] = useState(1);
  const [contact, setContact] = useState<ContactState>({ name: "", phone: "", email: "", notes: "" });
  const [done, setDone] = useState<{ token: string; phone: string } | null>(null);

  if (isLoading) return <p className="p-10">{t("loading")}</p>;
  if (!p) return <p className="p-10">{t("notFound")}</p>;
  const dep = departures.find((d) => d.id === depId);
  const unit = dep ? Number(dep.price_override ?? p.price_per_person) : Number(p.price_per_person);
  const maxTravelers = dep ? seatsRemaining(dep) : 20;

  return (
    <>
      <div className="relative h-[50vh] min-h-80">
        <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
        <div className="hero-overlay absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-10 sm:px-6">
          <h1 className="text-4xl font-bold text-ink-foreground md:text-6xl">{p.title}</h1>
          <p className="mt-2 flex items-center gap-2 text-ink-foreground"><Clock className="h-4 w-4" aria-hidden /> {p.duration_days} {t("days")} · {t("from")} {formatDZD(p.price_per_person, lang)} {t("perPerson")}</p>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-10">
          <p className="whitespace-pre-line text-lg leading-relaxed">{p.description}</p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div><h2 className="mb-3 text-xl font-bold">{t("includes")}</h2>
              <ul className="space-y-2">{(p.includes ?? []).map((i) => <li key={i} className="flex gap-2"><Check className="h-5 w-5 text-success" aria-hidden />{i}</li>)}</ul></div>
            <div><h2 className="mb-3 text-xl font-bold">{t("excludes")}</h2>
              <ul className="space-y-2">{(p.excludes ?? []).map((i) => <li key={i} className="flex gap-2"><X className="h-5 w-5 text-destructive" aria-hidden />{i}</li>)}</ul></div>
          </div>
          <div>
            <h2 className="mb-4 text-2xl font-bold">{t("departures")}</h2>
            {departures.length === 0 ? <p className="text-muted-foreground">{t("noDepartures")}</p> : (
              <div className="space-y-3" role="radiogroup" aria-label={t("departures")}>
                {departures.map((d) => {
                  const full = isFullyBooked(d);
                  return (
                    <label key={d.id} className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${full ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-primary"} ${depId === d.id ? "border-primary bg-primary/5" : "bg-card"}`}>
                      <span className="flex items-center gap-3">
                        <input type="radio" name="departure" value={d.id} disabled={full} checked={depId === d.id}
                          onChange={() => { setDepId(d.id); setTravelers(1); }} className="accent-primary" />
                        <span><span className="block font-semibold">{formatDate(d.departure_date, lang)} → {formatDate(d.return_date, lang)}</span>
                          <span className="text-sm text-muted-foreground">{full ? t("fullyBooked") : `${seatsRemaining(d)} ${t("seatsLeft")}`}</span></span>
                      </span>
                      <span className="font-bold text-primary">{formatDZD(d.price_override ?? p.price_per_person, lang)}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          {done ? <BookingConfirmation token={done.token} phone={done.phone} /> : (
            <form className="space-y-4 rounded-2xl bg-card p-6 shadow-card"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!dep) { toast.error(t("chooseDeparture")); return; }
                try {
                  const r = await create.mutateAsync({
                    booking_type: "package", package_id: p.id, departure_id: dep.id, travelers_count: travelers,
                    customer_name: contact.name, customer_phone: contact.phone.trim(), customer_email: contact.email,
                    notes: contact.notes || null, estimated_total: unit * travelers,
                  });
                  setDone({ token: r.tracking_token, phone: r.phone });
                } catch { toast.error(t("errorGeneric")); }
              }}>
              <h2 className="text-2xl font-bold">{t("bookingRequest")}</h2>
              <BookingNotice />
              <p className="text-sm">{dep ? `${formatDate(dep.departure_date, lang)} → ${formatDate(dep.return_date, lang)}` : t("chooseDeparture")}</p>
              <label className="block text-sm font-medium">{t("travelers")}
                <input type="number" min={1} max={maxTravelers} required value={travelers}
                  onChange={(e) => setTravelers(Math.max(1, Math.min(maxTravelers, Number(e.target.value))))}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2" />
              </label>
              <ContactFields value={contact} onChange={setContact} />
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">{t("estimatedTotal")}</p>
                <p className="text-2xl font-bold text-primary">{formatDZD(unit * travelers, lang)}</p>
                <p className="text-xs text-muted-foreground">{t("estimateNote")}</p>
              </div>
              <button disabled={!dep || create.isPending} className="w-full rounded-full bg-accent py-3 font-semibold text-accent-foreground disabled:opacity-50">
                {create.isPending ? t("submitting") : t("submit")}
              </button>
            </form>
          )}
        </aside>
      </div>
    </>
  );
}
