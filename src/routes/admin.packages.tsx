import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { usePackages, useCreatePackage, useUpdatePackage, useDeletePackage, type Package } from "@/hooks/use-packages";
import { usePackageDepartures, useCreateDeparture, useUpdateDeparture, useDeleteDeparture } from "@/hooks/use-package-departures";
import { useDestinations } from "@/hooks/use-destinations";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { AdminOnly, inputCls, btnPrimary, btnGhost, btnDanger, slugify } from "@/components/admin/AdminOnly";
import { formatDZD, formatDate } from "@/lib/i18n";

export const Route = createFileRoute("/admin/packages")({ component: () => <AdminOnly><PackagesPage /></AdminOnly> });

type Form = {
  title: string; slug: string; destination_id: string; image: string; short_description: string; description: string;
  duration_days: string; price_per_person: string; includes: string; excludes: string; featured: boolean; active: boolean;
};
const EMPTY: Form = {
  title: "", slug: "", destination_id: "", image: "", short_description: "", description: "",
  duration_days: "7", price_per_person: "", includes: "", excludes: "", featured: false, active: true,
};
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

function PackagesPage() {
  const { data = [], isLoading } = usePackages({ includeInactive: true });
  const { data: destinations = [] } = useDestinations();
  const create = useCreatePackage();
  const update = useUpdatePackage();
  const remove = useDeletePackage();
  const [editing, setEditing] = useState<Package | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [depFor, setDepFor] = useState<string | null>(null);

  function startAdd() { setEditing(null); setForm({ ...EMPTY, destination_id: destinations[0]?.id ?? "" }); setAdding(true); }
  function startEdit(p: Package) {
    setAdding(false); setEditing(p);
    setForm({
      title: p.title, slug: p.slug, destination_id: p.destination_id, image: p.image,
      short_description: p.short_description ?? "", description: p.description ?? "",
      duration_days: String(p.duration_days), price_per_person: String(p.price_per_person),
      includes: (p.includes ?? []).join("\n"), excludes: (p.excludes ?? []).join("\n"),
      featured: !!p.featured, active: p.active,
    });
  }
  function close() { setAdding(false); setEditing(null); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.image) { toast.error("Une image est obligatoire."); return; }
    if (!form.destination_id) { toast.error("Choisissez une destination."); return; }
    const payload = {
      title: form.title.trim(), slug: form.slug.trim() || slugify(form.title), destination_id: form.destination_id,
      image: form.image, short_description: form.short_description || null, description: form.description || null,
      duration_days: Number(form.duration_days), price_per_person: Number(form.price_per_person),
      includes: lines(form.includes), excludes: lines(form.excludes), featured: form.featured, active: form.active,
    };
    try {
      if (editing) await update.mutateAsync({ id: editing.id, patch: payload });
      else await create.mutateAsync({ id: crypto.randomUUID(), ...payload });
      toast.success("Circuit enregistré");
      close();
    } catch (err) { toast.error((err as Error).message); }
  }

  async function del(p: Package) {
    if (!confirm(`Supprimer le circuit « ${p.title} » ? Les départs seront aussi concernés.`)) return;
    try { await remove.mutateAsync(p.id); toast.success("Circuit supprimé"); }
    catch (err) { toast.error((err as Error).message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Circuits</h1>
        <button className={btnPrimary} onClick={startAdd}>Ajouter un circuit</button>
      </div>

      {(adding || editing) && (
        <form onSubmit={save} className="space-y-4 rounded-xl bg-card p-6">
          <h2 className="text-lg font-semibold">{editing ? "Modifier le circuit" : "Nouveau circuit"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">Titre<input required className={inputCls} value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })} /></label>
            <label className="text-sm">Slug (URL)<input required className={inputCls} value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} /></label>
            <label className="text-sm">Destination
              <select required className={inputCls} value={form.destination_id} onChange={(e) => setForm({ ...form, destination_id: e.target.value })}>
                <option value="">—</option>
                {destinations.map((d) => <option key={d.id} value={d.id}>{d.name_fr}</option>)}
              </select>
            </label>
            <label className="text-sm">Durée (jours)<input required type="number" min={1} className={inputCls} value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} /></label>
            <label className="text-sm">Prix par personne (DZD)<input required type="number" min={0} className={inputCls} value={form.price_per_person} onChange={(e) => setForm({ ...form, price_per_person: e.target.value })} /></label>
            <label className="text-sm">Description courte<input className={inputCls} value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} /></label>
          </div>
          <label className="block text-sm">Description<textarea rows={4} className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">Inclus (une ligne par élément)<textarea rows={5} className={inputCls} value={form.includes} onChange={(e) => setForm({ ...form, includes: e.target.value })} /></label>
            <label className="text-sm">Non inclus (une ligne par élément)<textarea rows={5} className={inputCls} value={form.excludes} onChange={(e) => setForm({ ...form, excludes: e.target.value })} /></label>
          </div>
          <ImageUpload label="Image" folder="packages" value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
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
          {data.map((p) => (
            <div key={p.id} className="rounded-xl bg-card p-4">
              <div className="flex flex-wrap items-center gap-4">
                <img src={p.image} alt="" className="h-16 w-24 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.title} {!p.active && <span className="ms-2 rounded bg-muted px-2 py-0.5 text-xs">Inactif</span>}</p>
                  <p className="text-sm text-muted-foreground">{p.duration_days} j · {formatDZD(Number(p.price_per_person))}</p>
                </div>
                <div className="flex gap-2">
                  <button className={btnGhost} onClick={() => setDepFor(depFor === p.id ? null : p.id)}>Départs</button>
                  <button className={btnGhost} onClick={() => startEdit(p)}>Modifier</button>
                  <button className={btnDanger} onClick={() => del(p)}>Supprimer</button>
                </div>
              </div>
              {depFor === p.id && <Departures packageId={p.id} />}
            </div>
          ))}
          {data.length === 0 && <p className="text-sm text-muted-foreground">Aucun circuit.</p>}
        </div>
      )}
    </div>
  );
}

function Departures({ packageId }: { packageId: string }) {
  const { data = [] } = usePackageDepartures(packageId);
  const create = useCreateDeparture();
  const update = useUpdateDeparture();
  const remove = useDeleteDeparture();
  const [f, setF] = useState({ departure_date: "", return_date: "", seats_total: "30", price_override: "" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (f.return_date < f.departure_date) { toast.error("La date de retour doit suivre la date de départ."); return; }
    try {
      await create.mutateAsync({
        package_id: packageId, departure_date: f.departure_date, return_date: f.return_date,
        seats_total: Number(f.seats_total), price_override: f.price_override ? Number(f.price_override) : null,
      });
      setF({ departure_date: "", return_date: "", seats_total: "30", price_override: "" });
      toast.success("Départ ajouté");
    } catch (err) { toast.error((err as Error).message); }
  }

  return (
    <div className="mt-4 space-y-3 border-t pt-4">
      <table className="w-full text-sm">
        <thead><tr className="text-start text-muted-foreground"><th className="text-start">Départ</th><th className="text-start">Retour</th><th className="text-start">Places</th><th className="text-start">Prix spécial</th><th /></tr></thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.id} className="border-t">
              <td className="py-2">{formatDate(d.departure_date)}</td>
              <td>{formatDate(d.return_date)}</td>
              <td>
                {d.seats_booked} /{" "}
                <input type="number" min={Math.max(d.seats_booked, 1)} defaultValue={d.seats_total} aria-label="Places totales"
                  className="w-16 rounded border bg-background px-1"
                  onBlur={async (e) => {
                    const v = Number(e.target.value);
                    if (v === d.seats_total) return;
                    if (v < d.seats_booked) { toast.error("Moins que les places déjà réservées."); e.target.value = String(d.seats_total); return; }
                    try { await update.mutateAsync({ id: d.id, patch: { seats_total: v } }); toast.success("Places mises à jour"); }
                    catch (err) { toast.error((err as Error).message); }
                  }} />
              </td>
              <td>{d.price_override ? formatDZD(Number(d.price_override)) : "—"}</td>
              <td className="text-end">
                <button className={btnDanger} onClick={async () => {
                  if (!confirm("Supprimer ce départ ?")) return;
                  try { await remove.mutateAsync(d.id); } catch (err) { toast.error((err as Error).message); }
                }}>Supprimer</button>
              </td>
            </tr>
          ))}
          {data.length === 0 && <tr><td colSpan={5} className="py-2 text-muted-foreground">Aucun départ.</td></tr>}
        </tbody>
      </table>
      <form onSubmit={add} className="flex flex-wrap items-end gap-3">
        <label className="text-sm">Départ<input required type="date" className={inputCls} value={f.departure_date} onChange={(e) => setF({ ...f, departure_date: e.target.value })} /></label>
        <label className="text-sm">Retour<input required type="date" className={inputCls} value={f.return_date} onChange={(e) => setF({ ...f, return_date: e.target.value })} /></label>
        <label className="text-sm">Places<input required type="number" min={1} className={`${inputCls} w-24`} value={f.seats_total} onChange={(e) => setF({ ...f, seats_total: e.target.value })} /></label>
        <label className="text-sm">Prix spécial (optionnel)<input type="number" min={0} className={`${inputCls} w-40`} value={f.price_override} onChange={(e) => setF({ ...f, price_override: e.target.value })} /></label>
        <button type="submit" className={btnPrimary} disabled={create.isPending}>Ajouter un départ</button>
      </form>
    </div>
  );
}
