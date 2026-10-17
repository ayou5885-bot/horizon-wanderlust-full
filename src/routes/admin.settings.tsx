import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSiteSettings, useUpdateFavicon } from "@/hooks/use-site-settings";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { AdminOnly, btnPrimary, btnGhost } from "@/components/admin/AdminOnly";

export const Route = createFileRoute("/admin/settings")({ component: () => <AdminOnly><SettingsPage /></AdminOnly> });

function SettingsPage() {
  const { data, isLoading } = useSiteSettings();
  const save = useUpdateFavicon();
  const [favicon, setFavicon] = useState<string | null>(null);
  useEffect(() => { setFavicon(data?.favicon_url ?? null); }, [data?.favicon_url]);

  async function submit(value: string | null) {
    try { await save.mutateAsync(value); toast.success("Paramètres enregistrés. Rechargez le site pour voir la nouvelle icône."); }
    catch (err) { toast.error((err as Error).message); }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">Paramètres</h1>
      {isLoading ? <p>Chargement…</p> : (
        <div className="space-y-4 rounded-xl bg-card p-6">
          <h2 className="text-lg font-semibold">Icône du site (favicon)</h2>
          <p className="text-sm text-muted-foreground">Image carrée recommandée (PNG, 64×64 ou plus). Elle est enregistrée dans la base de données et appliquée à toutes les pages.</p>
          <ImageUpload label="Favicon" folder="favicon" value={favicon} onChange={setFavicon} />
          <div className="flex gap-2">
            <button className={btnPrimary} disabled={save.isPending || favicon === (data?.favicon_url ?? null)} onClick={() => submit(favicon)}>Enregistrer</button>
            {data?.favicon_url && <button className={btnGhost} onClick={() => { setFavicon(null); submit(null); }}>Retirer</button>}
          </div>
        </div>
      )}
    </div>
  );
}
