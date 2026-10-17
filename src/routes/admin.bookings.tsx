import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { MessageCircle, ChevronDown, Download } from "lucide-react";
import { useBookings, useSetBookingStatus, type BookingWithRefs } from "@/hooks/use-bookings";
import { formatDZD, formatDate } from "@/lib/i18n";
import { btnGhost, inputCls } from "@/components/admin/AdminOnly";

export const Route = createFileRoute("/admin/bookings")({ component: BookingsPage });

const STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;
const LABEL: Record<string, string> = { pending: "En attente", confirmed: "Confirmée", cancelled: "Annulée", completed: "Terminée" };

/** Customer language is not stored in bookings; infer Arabic when the name contains Arabic script. */
function whatsappLink(b: BookingWithRefs) {
  const ar = /[\u0600-\u06FF]/.test(b.customer_name);
  const item = b.packages?.title ?? b.hotels?.name ?? "";
  const statusAr: Record<string, string> = { pending: "قيد المعالجة", confirmed: "مؤكد", cancelled: "ملغى", completed: "مكتمل" };
  const text = ar
    ? `مرحباً ${b.customer_name}، حالة طلب حجزك (${item}) هي: ${statusAr[b.status]}. رمز التتبع: ${b.tracking_token}`
    : `Bonjour ${b.customer_name}, le statut de votre demande (${item}) est : ${LABEL[b.status]}. Code de suivi : ${b.tracking_token}`;
  const phone = b.customer_phone.replace(/[^0-9]/g, "").replace(/^0/, "213");
  // Manual one-click send: opens WhatsApp with the message pre-filled; staff presses Send themselves.
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function BookingsPage() {
  const { data = [], isLoading } = useBookings();
  const setStatus = useSetBookingStatus();
  const [open, setOpen] = useState<string | null>(null);
  const [type, setType] = useState("");
  const [status, setStatusFilter] = useState("");
  const [q, setQ] = useState("");
  const list = data.filter((b) => (!type || b.booking_type === type) && (!status || b.status === status) &&
    (!q || `${b.customer_name} ${b.customer_phone} ${b.customer_email} ${b.tracking_token}`.toLowerCase().includes(q.toLowerCase())));

  function exportXlsx() {
    const rows = list.map((b) => ({
      Date: b.created_at, Type: b.booking_type, Statut: LABEL[b.status], Client: b.customer_name, Téléphone: b.customer_phone,
      Email: b.customer_email, Circuit: b.packages?.title ?? "", Départ: b.package_departures?.departure_date ?? "", Voyageurs: b.travelers_count ?? "",
      Hôtel: b.hotels?.name ?? "", Chambre: b.hotel_rooms?.name ?? "", Arrivée: b.check_in ?? "", "Départ hôtel": b.check_out ?? "",
      Chambres: b.rooms_count ?? "", Personnes: b.guests_count ?? "", "Total estimé (DZD)": Number(b.estimated_total), Suivi: b.tracking_token, Notes: b.notes ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Réservations");
    XLSX.writeFile(wb, `reservations-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Réservations</h1>
        <button onClick={exportXlsx} className={`${btnGhost} inline-flex items-center gap-2`}><Download className="h-4 w-4" aria-hidden /> Exporter vers Excel</button>
      </div>
      <div className="flex flex-wrap gap-3">
        <input aria-label="Recherche" placeholder="Nom, téléphone, code…" value={q} onChange={(e) => setQ(e.target.value)} className={`${inputCls} max-w-xs`} />
        <select aria-label="Type" value={type} onChange={(e) => setType(e.target.value)} className={`${inputCls} max-w-[160px]`}>
          <option value="">Tous types</option><option value="package">Circuit</option><option value="hotel">Hôtel</option>
        </select>
        <select aria-label="Statut" value={status} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputCls} max-w-[160px]`}>
          <option value="">Tous statuts</option>{STATUSES.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b text-start text-muted-foreground">
            <tr><th className="p-3 text-start">Date</th><th className="p-3 text-start">Type</th><th className="p-3 text-start">Client</th><th className="p-3 text-start">Objet</th><th className="p-3 text-start">Total</th><th className="p-3 text-start">Statut</th><th className="p-3" /></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="p-4" colSpan={7}>Chargement…</td></tr>}
            {list.map((b) => (
              <Fragment key={b.id}>
                <tr className="border-b">
                  <td className="p-3 whitespace-nowrap">{b.created_at && new Date(b.created_at).toLocaleString("fr-FR")}</td>
                  <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${b.booking_type === "package" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>{b.booking_type === "package" ? "Circuit" : "Hôtel"}</span></td>
                  <td className="p-3">{b.customer_name}<br /><span className="text-xs text-muted-foreground">{b.customer_phone}</span></td>
                  <td className="p-3">{b.packages?.title ?? b.hotels?.name}</td>
                  <td className="p-3 whitespace-nowrap">{formatDZD(b.estimated_total)}</td>
                  <td className="p-3">
                    <select aria-label="Changer le statut" value={b.status} disabled={setStatus.isPending} className="rounded-md border bg-background px-2 py-1"
                      onChange={async (e) => {
                        try { await setStatus.mutateAsync({ id: b.id, status: e.target.value }); toast.success("Statut mis à jour"); }
                        catch (err) {
                          const m = (err as Error).message;
                          toast.error(m.includes("seats_exceeded") ? "Places insuffisantes : la confirmation dépasserait le nombre total de places." : m);
                        }
                      }}>
                      {STATUSES.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}
                    </select>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <a href={whatsappLink(b)} target="_blank" rel="noopener noreferrer" className={`${btnGhost} me-2 inline-flex items-center gap-1`}>
                      <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
                    </a>
                    <button className={btnGhost} onClick={() => setOpen(open === b.id ? null : b.id)} aria-expanded={open === b.id}>
                      <ChevronDown className="inline h-4 w-4" aria-hidden /> Détails
                    </button>
                  </td>
                </tr>
                {open === b.id && (
                  <tr className="border-b bg-muted/50"><td colSpan={7} className="p-4">
                    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-3">
                      <Item k="E-mail" v={b.customer_email} />
                      <Item k="Code de suivi" v={b.tracking_token} />
                      {b.booking_type === "package" ? (<>
                        <Item k="Circuit" v={b.packages?.title} />
                        <Item k="Départ" v={`${formatDate(b.package_departures?.departure_date)} → ${formatDate(b.package_departures?.return_date)}`} />
                        <Item k="Voyageurs" v={b.travelers_count} />
                      </>) : (<>
                        <Item k="Hôtel" v={b.hotels?.name} />
                        <Item k="Chambre" v={b.hotel_rooms?.name} />
                        <Item k="Séjour" v={`${formatDate(b.check_in)} → ${formatDate(b.check_out)}`} />
                        <Item k="Chambres" v={b.rooms_count} />
                        <Item k="Personnes" v={b.guests_count} />
                      </>)}
                      <Item k="Total estimé" v={formatDZD(b.estimated_total)} />
                      <Item k="Notes" v={b.notes} />
                    </dl>
                  </td></tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Item({ k, v }: { k: string; v: unknown }) {
  return <div><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v == null || v === "" ? "—" : String(v)}</dd></div>;
}
