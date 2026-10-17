import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useLandingPages, useCreateLandingPage, useUpdateLandingPage, useDeleteLandingPage, type LandingPage, type ContentBlock } from "@/hooks/use-landing-pages";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { AdminOnly, inputCls, btnPrimary, btnGhost, btnDanger, slugify } from "@/components/admin/AdminOnly";

export const Route = createFileRoute("/admin/landing")({ component: () => <AdminOnly><LandingPagesPage /></AdminOnly> });

type Form = { slug: string; title: string; hero_image: string; active: boolean; starts_at: string; ends_at: string; blocks: ContentBlock[] };
const EMPTY: Form = { slug: "", title: "", hero_image: "", active: true, starts_at: "", ends_at: "", blocks: [] };
const toLocal = (s: string | null) => (s ? new Date(s).toISOString().slice(0, 16) : "");
const toIso = (s: string) => (s ? new Date(s).toISOString() : null);

function LandingPagesPage() {
  const { data = [], isLoading } = useLandingPages();
  const create = useCreateLandingPage();
  const update = useUpdateLandingPage();
  const remove = useDeleteLandingPage();
  const [editing, setEditing] = useState<LandingPage | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);

  function startAdd() { setEditing(null); setForm(EMPTY); setAdding(true); }
  function startEdit(p: LandingPage) {
    setAdding(false); setEditing(p);
    setForm({
      slug: p.slug, title: p.title, hero_image: p.hero_image ?? "", active: p.active,
      starts_at: toLocal(p.starts_at), ends_at: toLocal(p.ends_at),
      blocks: Array.isArray(p.content_blocks) ? (p.content_blocks as unknown as ContentBlock[]) : [],
    });
  }
  function close() { setAdding(false); setEditing(null); }
  const setBlock = (i: number, b: ContentBlock) => setForm({ ...form, blocks: form.blocks.map((x, j) => (j === i ? b : x)) });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title: form.title.trim(), hero_image: form.hero_image || null, active: form.active,
      starts_at: toIso(form.starts_at), ends_at: toIso(form.ends_at),
      content_blocks: form.blocks as unknown as import("@/integrations/supabase/types").Json,
    };
    try {
      if (editing) await update.mutateAsync({ slug: editing.slug, patch: payload });
      else await create.mutateAsync({ slug: form.slug.trim() || slugify(form.title), ...payload });
      toast.success("Page enregistrée");
      close();
    } catch (err) { toast.error((err as Error).message); }
  }

  async function del(p: LandingPage) {
    if (!confirm(`Supprimer la page « ${p.title} » ?`)) return;
    try { await remove.mutateAsync(p.slug); toast.success("Page supprimée"); }
    catch (err) { toast.error((err as Error).message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Pages saisonnières</h1>
        <button className={btnPrimary} onClick={startAdd}>Ajouter une page</button>
      </div>

      {(adding || editing) && (
        <form onSubmit={save} className="space-y-4 rounded-xl bg-card p-6">
          <h2 className="text-lg font-semibold">{editing ? "Modifier la page" : "Nouvelle page"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">Titre<input required className={inputCls} value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })} /></label>
            <label className="text-sm">Slug (URL : /l/…)<input required disabled={!!editing} className={inputCls} value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} /></label>
            <label className="text-sm">Début (optionnel)<input type="datetime-local" className={inputCls} value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></label>
            <label className="text-sm">Fin (optionnel)<input type="datetime-local" className={inputCls} value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></label>
          </div>
          <ImageUpload label="Image principale" folder="landing" value={form.hero_image} onChange={(url) => setForm({ ...form, hero_image: url })} />

          <div className="space-y-3">
            <h3 className="font-medium">Blocs de contenu</h3>
            {form.blocks.map((b, i) => (
              <div key={i} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{b.type === "text" ? "Texte" : b.type === "image" ? "Image" : "Bouton"}</span>
                  <div className="flex gap-1">
                    <button type="button" className={btnGhost} disabled={i === 0} onClick={() => { const a = [...form.blocks]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; setForm({ ...form, blocks: a }); }}>↑</button>
                    <button type="button" className={btnGhost} disabled={i === form.blocks.length - 1} onClick={() => { const a = [...form.blocks]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; setForm({ ...form, blocks: a }); }}>↓</button>
                    <button type="button" className={btnDanger} onClick={() => setForm({ ...form, blocks: form.blocks.filter((_, j) => j !== i) })}>Supprimer</button>
                  </div>
                </div>
                {b.type === "text" && (<>
                  <input placeholder="Titre" className={inputCls} value={b.heading ?? ""} onChange={(e) => setBlock(i, { ...b, heading: e.target.value })} />
                  <textarea placeholder="Texte" rows={3} className={inputCls} value={b.body ?? ""} onChange={(e) => setBlock(i, { ...b, body: e.target.value })} />
                </>)}
                {b.type === "image" && (<>
                  <ImageUpload label="Image" folder="landing" value={b.src} onChange={(url) => setBlock(i, { ...b, src: url })} />
                  <input placeholder="Texte alternatif" className={inputCls} value={b.alt ?? ""} onChange={(e) => setBlock(i, { ...b, alt: e.target.value })} />
                </>)}
                {b.type === "cta" && (<>
                  <input placeholder="Texte du bouton" className={inputCls} value={b.label} onChange={(e) => setBlock(i, { ...b, label: e.target.value })} />
                  <input placeholder="Lien (ex. /packages)" className={inputCls} value={b.href} onChange={(e) => setBlock(i, { ...b, href: e.target.value })} />
                </>)}
              </div>
            ))}
            <div className="flex gap-2">
              <button type="button" className={btnGhost} onClick={() => setForm({ ...form, blocks: [...form.blocks, { type: "text", heading: "", body: "" }] })}>+ Texte</button>
              <button type="button" className={btnGhost} onClick={() => setForm({ ...form, blocks: [...form.blocks, { type: "image", src: "", alt: "" }] })}>+ Image</button>
              <button type="button" className={btnGhost} onClick={() => setForm({ ...form, blocks: [...form.blocks, { type: "cta", label: "", href: "/packages" }] })}>+ Bouton</button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
          <div className="flex gap-2">
            <button type="submit" className={btnPrimary} disabled={create.isPending || update.isPending}>Enregistrer</button>
            <button type="button" className={btnGhost} onClick={close}>Annuler</button>
          </div>
        </form>
      )}

      {isLoading ? <p>Chargement…</p> : (
        <div className="space-y-3">
          {data.map((p) => (
            <div key={p.slug} className="flex flex-wrap items-center gap-4 rounded-xl bg-card p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{p.title} {!p.active && <span className="ms-2 rounded bg-muted px-2 py-0.5 text-xs">Inactive</span>}</p>
                <p className="text-sm text-muted-foreground">/l/{p.slug}</p>
              </div>
              <div className="flex gap-2">
                <button className={btnGhost} onClick={() => startEdit(p)}>Modifier</button>
                <button className={btnDanger} onClick={() => del(p)}>Supprimer</button>
              </div>
            </div>
          ))}
          {data.length === 0 && <p className="text-sm text-muted-foreground">Aucune page.</p>}
        </div>
      )}
    </div>
  );
}
