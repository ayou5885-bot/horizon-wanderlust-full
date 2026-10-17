import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyStaffRow } from "@/hooks/use-staff";
import { inputCls, btnPrimary } from "@/components/admin/AdminOnly";

export const Route = createFileRoute("/admin_/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Connexion équipe — Sahara Voyages" }, { name: "robots", content: "noindex" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "forgot" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function afterSignIn() {
    let staff = await fetchMyStaffRow();
    if (!staff) {
      // Bootstrap: the very first account becomes admin when no staff exists yet.
      const { data } = await supabase.rpc("claim_first_admin");
      if (data) staff = await fetchMyStaffRow();
    }
    if (!staff) { setMsg("Ce compte n'a pas accès à l'administration."); await supabase.auth.signOut(); return; }
    navigate({ to: staff.role === "admin" ? "/admin" : "/admin/bookings" });
  }

  return (
    <div dir="ltr" className="flex min-h-screen items-center justify-center bg-sand px-4">
      <form className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-8 shadow-card" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setMsg("");
        try {
          if (mode === "login") {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            await afterSignIn();
          } else if (mode === "signup") {
            const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin/login` } });
            if (error) throw error;
            setMsg("Vérifiez votre e-mail pour confirmer le compte, puis connectez-vous.");
          } else {
            const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/admin/reset-password` });
            if (error) throw error;
            setMsg("Un lien de réinitialisation a été envoyé si ce compte existe.");
          }
        } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
      }}>
        <h1 className="text-2xl font-bold">{mode === "forgot" ? "Mot de passe oublié" : mode === "signup" ? "Créer le premier compte" : "Espace équipe"}</h1>
        <label className="block text-sm font-medium">E-mail<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></label>
        {mode !== "forgot" && <label className="block text-sm font-medium">Mot de passe<input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} /></label>}
        <button disabled={busy} className={`${btnPrimary} w-full`}>{mode === "login" ? "Se connecter" : mode === "signup" ? "Créer le compte" : "Envoyer le lien"}</button>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        <div className="flex justify-between text-sm">
          <button type="button" className="text-primary" onClick={() => setMode(mode === "forgot" ? "login" : "forgot")}>{mode === "forgot" ? "Retour" : "Mot de passe oublié ?"}</button>
          {mode === "login" && <button type="button" className="text-muted-foreground" onClick={() => setMode("signup")}>Premier accès</button>}
        </div>
      </form>
    </div>
  );
}
