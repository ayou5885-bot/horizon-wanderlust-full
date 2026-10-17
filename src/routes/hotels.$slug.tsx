import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n, formatDZD } from "@/lib/i18n";
import { useHotelBySlug } from "@/hooks/use-hotels";
import { useHotelRooms } from "@/hooks/use-hotel-rooms";
import { useCreateBooking } from "@/hooks/use-bookings";
import { hotelEstimate, nightsBetween } from "@/lib/pricing";
import { BookingNotice, Stars } from "@/components/site/Cards";
import { BookingConfirmation } from "@/components/site/BookingConfirmation";
import { ContactFields, type ContactState } from "@/components/site/ContactFields";

export const Route = createFileRoute("/hotels/$slug")({
  head: () => ({
    meta: [
      { title: "Détails de l'hôtel — Sahara Voyages" },
      { name: "description", content: "Chambres, tarifs par nuit et demande de réservation." },
      { property: "og:title", content: "Détails de l'hôtel — Sahara Voyages" },
      { property: "og:description", content: "Estimez votre séjour et envoyez votre demande." },
    ],
  }),
  component: HotelDetail,
});

function HotelDetail() {
  const { slug } = Route.useParams();
  const { t, lang } = useI18n();
  const { data: h, isLoading } = useHotelBySlug(slug);
  const { data: rooms = [] } = useHotelRooms(h?.id);
  const create = useCreateBooking();
  const today = new Date().toISOString().slice(0, 10);
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomsCount, setRoomsCount] = useState(1);
  const [guests, setGuests] = useState(2);
  const [contact, setContact] = useState<ContactState>({ name: "", phone: "", email: "", notes: "" });
  const [done, setDone] = useState<{ token: string; phone: string } | null>(null);

  if (isLoading) return <p className="p-10">{t("loading")}</p>;
  if (!h) return <p className="p-10">{t("notFound")}</p>;
  const room = rooms.find((r) => r.id === roomId) ?? rooms[0];
  const nights = nightsBetween(checkIn, checkOut);
  const total = room ? hotelEstimate(checkIn, checkOut, Number(room.price_per_night), roomsCount) : 0;
  const field = "mt-1 w-full rounded-lg border bg-background px-3 py-2";

  return (
    <>
      <div className="relative h-[50vh] min-h-80">
        <img src={h.image} alt={h.name} className="h-full w-full object-cover" />
        <div className="hero-overlay absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-10 sm:px-6">
          <Stars n={h.star_rating} />
          <h1 className="text-4xl font-bold text-ink-foreground md:text-6xl">{h.name}</h1>
          <p className="text-ink-foreground/90">{h.address}</p>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-10">
          <p className="text-lg leading-relaxed">{h.description}</p>
          {(h.amenities ?? []).length > 0 && (
            <div><h2 className="mb-3 text-xl font-bold">{t("amenities")}</h2>
              <ul className="flex flex-wrap gap-2">{h.amenities!.map((a) => <li key={a} className="rounded-full bg-secondary px-3 py-1 text-sm">{a}</li>)}</ul></div>
          )}
          <div>
            <h2 className="mb-4 text-2xl font-bold">{t("rooms")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {rooms.map((r) => (
                <button type="button" key={r.id} onClick={() => setRoomId(r.id)}
                  className={`rounded-xl border p-4 text-start ${room?.id === r.id ? "border-primary bg-primary/5" : "bg-card"}`}>
                  {r.image && <img src={r.image} alt={r.name} loading="lazy" className="mb-3 h-32 w-full rounded-lg object-cover" />}
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-sm text-muted-foreground">{r.capacity} {t("capacity")}</p>
                  <p className="mt-2 font-bold text-primary">{formatDZD(r.price_per_night, lang)} {t("perNight")}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          {done ? <BookingConfirmation token={done.token} phone={done.phone} /> : (
            <form className="space-y-4 rounded-2xl bg-card p-6 shadow-card" onSubmit={async (e) => {
              e.preventDefault();
              if (!room) return;
              if (nights <= 0) { toast.error(t("invalidDates")); return; }
              try {
                const r = await create.mutateAsync({
                  booking_type: "hotel", hotel_id: h.id, room_id: room.id, check_in: checkIn, check_out: checkOut,
                  rooms_count: roomsCount, guests_count: guests,
                  customer_name: contact.name, customer_phone: contact.phone.trim(), customer_email: contact.email,
                  notes: contact.notes || null, estimated_total: total,
                });
                setDone({ token: r.tracking_token, phone: r.phone });
              } catch { toast.error(t("errorGeneric")); }
            }}>
              <h2 className="text-2xl font-bold">{t("bookingRequest")}</h2>
              <BookingNotice />
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium">{t("checkIn")}
                  <input type="date" required min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={field} /></label>
                <label className="text-sm font-medium">{t("checkOut")}
                  <input type="date" required min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={field} /></label>
              </div>
              <label className="block text-sm font-medium">{t("roomType")}
                <select value={room?.id ?? ""} onChange={(e) => setRoomId(e.target.value)} className={field}>
                  {rooms.map((r) => <option key={r.id} value={r.id}>{r.name} — {formatDZD(r.price_per_night, lang)}</option>)}
                </select></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium">{t("roomsCount")}
                  <input type="number" min={1} max={20} required value={roomsCount} onChange={(e) => setRoomsCount(Math.max(1, Number(e.target.value)))} className={field} /></label>
                <label className="text-sm font-medium">{t("guests")}
                  <input type="number" min={1} max={60} required value={guests} onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))} className={field} /></label>
              </div>
              <ContactFields value={contact} onChange={setContact} />
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">{t("estimatedTotal")} ({nights} {t("nights")} × {roomsCount})</p>
                <p className="text-2xl font-bold text-primary">{formatDZD(total, lang)}</p>
                <p className="text-xs text-muted-foreground">{t("estimateNote")}</p>
              </div>
              <button disabled={create.isPending || !room} className="w-full rounded-full bg-accent py-3 font-semibold text-accent-foreground disabled:opacity-50">
                {create.isPending ? t("submitting") : t("submit")}
              </button>
            </form>
          )}
        </aside>
      </div>
    </>
  );
}
