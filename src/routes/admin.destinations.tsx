import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useDestinations, useCreateDestination, useUpdateDestination, useDeleteDestination, type Destination } from "@/hooks/use-destinations";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { AdminOnly, inputCls, btnPrimary, btnGhost, btnDanger } from "@/components/admin/AdminOnly";

export const Route = createFileRoute("/admin/destinations")({ component: () => <AdminOnly><DestinationsPage /></AdminOnly> });

type Form = { name_fr: string; name_ar: string; country: string; image: string };
const EMPTY: Form = { name_fr: "", name_ar: "", country: "", image: "" };

function DestinationsPage() {
  const { data = [], isLoading } = useDestinations();
  const create = useCreateDestination();
  const update = useUpdateDestination();
  const remove = useDeleteDestination();
  const [editing, setEditing] = useState<Destination | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);

  function startAdd() { setEditing(null); setForm(EMPTY); setAdding(true); }
  function startEdit(d: Destination) {
    setAdding(false); setEditing(d);
    setForm({ name_fr: d.name_fr, name_ar: d.name_ar, country: d.country, image: d.image ?? "" });
  }
  function close() { setAdding(false); setEditing(null); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = { name_fr: form.name_fr.trim(), name_ar: form.name_ar.trim(), country: form.country.trim(), image: form.image || null };
    try {
      if (editing) await update.mutateAsync({ id: editing.id, patch: payload });
      else await create.mutateAsync({ id: crypto.randomUUID(), ...payload });
      toast.success("Destination enregistrée");
      close();
    } catch (err) { toast.error((err as Error).message); }
  }

  async function del(d: Destination) {
    if (!confirm(`Supprimer « ${d.name_fr} » ? Les circuits et hôtels liés peuvent empêcher la suppression.`)) return;
    try { await remove.mutateAsync(d.id); toast.success("Destination supprimée"); }
    catch (err) { toast.error((err as Error).message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Destinations</h1>
        <button className={btnPrimary} onClick={startAdd}>Ajouter une destination</button>
      </div>

      {(adding || editing) && (
        <form onSubmit={save} className="space-y-4 rounded-xl bg-card p-6">
          <h2 className="text-lg font-semibold">{editing ? "Modifier la destination" : "Nouvelle destination"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">Nom (français)<input required className={inputCls} value={form.name_fr} onChange={(e) => setForm({ ...form, name_fr: e.target.value })} /></label>
            <label className="text-sm">Nom (arabe)<input required dir="rtl" className={inputCls} value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></label>
            <label className="text-sm">Pays<input required className={inputCls} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></label>
          </div>
          <ImageUpload label="Image" folder="destinations" value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
          <div className="flex gap-2">
            <button type="submit" className={btnPrimary} disabled={create.isPending || update.isPending}>Enregistrer</button>
            <button type="button" className={btnGhost} onClick={close}>Annuler</button>
          </div>
        </form>
      )}

      {isLoading ? <p>Chargement…</p> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((d) => (
            <div key={d.id} className="overflow-hidden rounded-xl bg-card">
              {d.image && <img src={d.image} alt="" className="h-36 w-full object-cover" />}
              <div className="space-y-2 p-4">
                <p className="font-semibold">{d.name_fr} <span dir="rtl" className="text-muted-foreground">· {d.name_ar}</span></p>
                <p className="text-sm text-muted-foreground">{d.country}</p>
                <div className="flex gap-2">
                  <button className={btnGhost} onClick={() => startEdit(d)}>Modifier</button>
                  <button className={btnDanger} onClick={() => del(d)}>Supprimer</button>
                </div>
              </div>
            </div>
          ))}
          {data.length === 0 && <p className="text-sm text-muted-foreground">Aucune destination.</p>}
        </div>
      )}
    </div>
  );
}
