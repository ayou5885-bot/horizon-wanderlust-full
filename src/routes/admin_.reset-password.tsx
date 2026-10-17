import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { inputCls, btnPrimary } from "@/components/admin/AdminOnly";

export const Route = createFileRoute("/admin_/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Nouveau mot de passe — Sahara Voyages" }, { name: "robots", content: "noindex" }] }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div dir="ltr" className="flex min-h-screen items-center justify-center bg-sand px-4">
      <form className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-8 shadow-card" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true);
        const { error } = await supabase.auth.updateUser({ password });
        setBusy(false);
        if (error) { toast.error(error.message); return; }
        toast.success("Mot de passe mis à jour");
        navigate({ to: "/admin" });
      }}>
        <h1 className="text-2xl font-bold">Définir un nouveau mot de passe</h1>
        <label className="block text-sm font-medium">Nouveau mot de passe
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} /></label>
        <button disabled={busy} className={`${btnPrimary} w-full`}>Enregistrer</button>
      </form>
    </div>
  );
}
