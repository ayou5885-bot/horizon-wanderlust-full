import { useState } from "react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/upload";

export function ImageUpload({ value, onChange, folder, label = "Image" }: {
  value?: string | null; onChange: (url: string) => void; folder: string; label?: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {value && <img src={value} alt="" className="h-28 w-44 rounded-lg object-cover" />}
      <input type="file" accept="image/*" aria-label={label} disabled={busy}
        className="block text-sm file:me-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          try { onChange(await uploadImage(f, folder)); toast.success("Image téléversée"); }
          catch (err) { toast.error((err as Error).message); }
          finally { setBusy(false); }
        }} />
      {busy && <p className="text-xs text-muted-foreground">Téléversement…</p>}
    </div>
  );
}
