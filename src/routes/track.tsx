import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useI18n, formatDZD, formatDate, type TKey } from "@/lib/i18n";
import { useTrackBooking } from "@/hooks/use-bookings";
import { BookingNotice, PageHeader } from "@/components/site/Cards";

export const Route = createFileRoute("/track")({
  validateSearch: z.object({ phone: z.string().optional(), token: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Suivre ma réservation — Sahara Voyages" },
      { name: "description", content: "Consultez le statut de votre demande avec votre téléphone et code de suivi." },
      { property: "og:title", content: "Suivre ma réservation — Sahara Voyages" },
      { property: "og:description", content: "Suivi des demandes de réservation." },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { t, lang } = useI18n();
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/track" });
  const [phone, setPhone] = useState(s.phone ?? "");
  const [token, setToken] = useState(s.token ?? "");
  const { data, isFetching, isFetched } = useTrackBooking(s.phone ?? "", s.token ?? "");
  const field = "mt-1 w-full rounded-lg border bg-background px-3 py-2";
  return (
    <>
      <PageHeader title={t("trackTitle")} subtitle={t("trackSubtitle")} />
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <form className="grid gap-4 rounded-2xl bg-card p-6 shadow-card sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(e) => { e.preventDefault(); navigate({ search: { phone: phone.trim(), token: token.trim() } }); }}>
          <label className="text-sm font-medium">{t("phone")}<input required dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} /></label>
          <label className="text-sm font-medium">{t("trackingCode")}<input required dir="ltr" value={token} onChange={(e) => setToken(e.target.value)} className={field} /></label>
          <button className="rounded-full bg-primary px-6 py-2.5 font-semibold text-primary-foreground">{t("trackButton")}</button>
        </form>
        {isFetching && <p>{t("loading")}</p>}
        {isFetched && !isFetching && (data?.length ?? 0) === 0 && <p>{t("trackNone")}</p>}
        {data?.map((b) => (
          <div key={b.id} className="space-y-2 rounded-2xl bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-secondary px-3 py-1 text-sm">{t(`type_${b.booking_type}` as TKey)}</span>
              <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">{t(`status_${b.status}` as TKey)}</span>
            </div>
            <p><strong>{t("fullName")}:</strong> {b.customer_name}</p>
            <p><strong>{t("createdAt")}:</strong> {formatDate(b.created_at, lang)}</p>
            {b.booking_type === "package" ? <p><strong>{t("travelers")}:</strong> {b.travelers_count}</p> : (
              <p><strong>{t("checkIn")}:</strong> {formatDate(b.check_in, lang)} — <strong>{t("checkOut")}:</strong> {formatDate(b.check_out, lang)} · {b.rooms_count} × {b.guests_count}</p>
            )}
            <p><strong>{t("estimatedTotal")}:</strong> {formatDZD(b.estimated_total, lang)}</p>
            <BookingNotice />
          </div>
        ))}
      </div>
    </>
  );
}
