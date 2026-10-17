import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useHotels, useCreateHotel, useUpdateHotel, useDeleteHotel, type Hotel } from "@/hooks/use-hotels";
import { useHotelRooms, useCreateHotelRoom, useUpdateHotelRoom, useDeleteHotelRoom } from "@/hooks/use-hotel-rooms";
import { useDestinations } from "@/hooks/use-destinations";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { AdminOnly, inputCls, btnPrimary, btnGhost, btnDanger, slugify } from "@/components/admin/AdminOnly";
import { formatDZD } from "@/lib/i18n";

export const Route = createFileRoute("/admin/hotels")({ component: () => <AdminOnly><HotelsPage /></AdminOnly> });

type Form = {
  name: string; slug: string; destination_id: string; image: string; description: string;
  star_rating: string; amenities: string; address: string; featured: boolean; active: boolean;
};
const EMPTY: Form = { name: "", slug: "", destination_id: "", image: "", description: "", star_rating: "4", amenities: "", address: "", featured: false, active: true };
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

function HotelsPage() {
  const { data = [], isLoading } = useHotels({ includeInactive: true });
  const { data: destinations = [] } = useDestinations();
  const create = useCreateHotel();
  const update = useUpdateHotel();
  const remove = useDeleteHotel();
  const [editing, setEditing] = useState<Hotel | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [roomsFor, setRoomsFor] = useState<string | null>(null);

  function startAdd() { setEditing(null); setForm({ ...EMPTY, destination_id: destinations[0]?.id ?? "" }); setAdding(true); }
  function startEdit(h: Hotel) {
    setAdding(false); setEditing(h);
    setForm({
      name: h.name, slug: h.slug, destination_id: h.destination_id, image: h.image, description: h.description ?? "",
      star_rating: String(h.star_rating), amenities: (h.amenities ?? []).join("\n"), address: h.address ?? "",
      featured: !!h.featured, active: h.active,
    });
  }
  function close() { setAdding(false); setEditing(null); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.image) { toast.error("Une image est obligatoire."); return; }
    if (!form.destination_id) { toast.error("Choisissez une destination."); return; }
    const payload = {
      name: form.name.trim(), slug: form.slug.trim() || slugify(form.name), destination_id: form.destination_id,
      image: form.image, description: form.description || null, star_rating: Number(form.star_rating),
      amenities: lines(form.amenities), address: form.address || null, featured: form.featured, active: form.active,
    };
    try {
      if (editing) await update.mutateAsync({ id: editing.id, patch: payload });
      else await create.mutateAsync({ id: crypto.randomUUID(), ...payload });
      toast.success("Hôtel enregistré");
      close();
    } catch (err) { toast.error((err as Error).message); }
  }

  async function del(h: Hotel) {
    if (!confirm(`Supprimer l'hôtel « ${h.name} » ?`)) return;
    try { await remove.mutateAsync(h.id); toast.success("Hôtel supprimé"); }
    catch (err) { toast.error((err as Error).message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Hôtels</h1>
        <button className={btnPrimary} onClick={startAdd}>Ajouter un hôtel</button>
      </div>

      {(adding || editing) && (
        <form onSubmit={save} className="space-y-4 rounded-xl bg-card p-6">
          <h2 className="text-lg font-semibold">{editing ? "Modifier l'hôtel" : "Nouvel hôtel"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">Nom<input required className={inputCls} value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })} /></label>
            <label className="text-sm">Slug (URL)<input required className={inputCls} value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} /></label>
            <label className="text-sm">Destination
              <select required className={inputCls} value={form.destination_id} onChange={(e) => setForm({ ...form, destination_id: e.target.value })}>
                <option value="">—</option>
                {destinations.map((d) => <option key={d.id} value={d.id}>{d.name_fr}</option>)}
              </select>
            </label>
            <label className="text-sm">Étoiles
              <select className={inputCls} value={form.star_rating} onChange={(e) => setForm({ ...form, star_rating: e.target.value })}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="text-sm sm:col-span-2">Adresse<input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
          </div>
          <label className="block text-sm">Description<textarea rows={4} className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label className="block text-sm">Équipements (une ligne par élément)<textarea rows={4} className={inputCls} value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} /></label>
          <ImageUpload label="Image" folder="hotels" value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
          <div className="flex gap-6 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Mis en avant</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Actif</label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className={btnPrimary} disabled={create.isPending || update.isPending}>Enregistrer</button>
            <button type="button" className={btnGhost} onClick={close}>Annuler</button>
          </div>
        </form>
      )}

      {isLoading ? <p>Chargement…</p> : (
        <div className="space-y-3">
          {data.map((h) => (
            <div key={h.id} className="rounded-xl bg-card p-4">
              <div className="flex flex-wrap items-center gap-4">
                <img src={h.image} alt="" className="h-16 w-24 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{h.name} {!h.active && <span className="ms-2 rounded bg-muted px-2 py-0.5 text-xs">Inactif</span>}</p>
                  <p className="text-sm text-muted-foreground">{"★".repeat(h.star_rating)}</p>
                </div>
                <div className="flex gap-2">
                  <button className={btnGhost} onClick={() => setRoomsFor(roomsFor === h.id ? null : h.id)}>Chambres</button>
                  <button className={btnGhost} onClick={() => startEdit(h)}>Modifier</button>
                  <button className={btnDanger} onClick={() => del(h)}>Supprimer</button>
                </div>
              </div>
              {roomsFor === h.id && <Rooms hotelId={h.id} />}
            </div>
          ))}
          {data.length === 0 && <p className="text-sm text-muted-foreground">Aucun hôtel.</p>}
        </div>
      )}
    </div>
  );
}

function Rooms({ hotelId }: { hotelId: string }) {
  const { data = [] } = useHotelRooms(hotelId, { includeInactive: true });
  const create = useCreateHotelRoom();
  const update = useUpdateHotelRoom();
  const remove = useDeleteHotelRoom();
  const [f, setF] = useState({ name: "", price_per_night: "", capacity: "2", image: "" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync({
        hotel_id: hotelId, name: f.name.trim(), price_per_night: Number(f.price_per_night),
        capacity: Number(f.capacity), image: f.image || null,
      });
      setF({ name: "", price_per_night: "", capacity: "2", image: "" });
      toast.success("Chambre ajoutée");
    } catch (err) { toast.error((err as Error).message); }
  }

  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      <ul className="space-y-2">
        {data.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 text-sm">
            {r.image && <img src={r.image} alt="" className="h-10 w-14 rounded object-cover" />}
            <span className="min-w-0 flex-1">{r.name} · {r.capacity} pers. · {formatDZD(Number(r.price_per_night))} / nuit {!r.active && "(inactive)"}</span>
            <button className={btnGhost} onClick={async () => {
              try { await update.mutateAsync({ id: r.id, patch: { active: !r.active } }); }
              catch (err) { toast.error((err as Error).message); }
            }}>{r.active ? "Désactiver" : "Activer"}</button>
            <button className={btnDanger} onClick={async () => {
              if (!confirm("Supprimer cette chambre ?")) return;
              try { await remove.mutateAsync(r.id); } catch (err) { toast.error((err as Error).message); }
            }}>Supprimer</button>
          </li>
        ))}
        {data.length === 0 && <li className="text-sm text-muted-foreground">Aucune chambre.</li>}
      </ul>
      <form onSubmit={add} className="flex flex-wrap items-end gap-3">
        <label className="text-sm">Type de chambre<input required className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="text-sm">Prix / nuit (DZD)<input required type="number" min={0} className={`${inputCls} w-36`} value={f.price_per_night} onChange={(e) => setF({ ...f, price_per_night: e.target.value })} /></label>
        <label className="text-sm">Capacité<input required type="number" min={1} className={`${inputCls} w-24`} value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} /></label>
        <ImageUpload label="Image (optionnel)" folder="rooms" value={f.image} onChange={(url) => setF({ ...f, image: url })} />
        <button type="submit" className={btnPrimary} disabled={create.isPending}>Ajouter la chambre</button>
      </form>
    </div>
  );
}
