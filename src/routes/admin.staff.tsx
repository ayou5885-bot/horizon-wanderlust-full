import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useStaffList, useUpdateStaff, useDeleteStaff } from "@/hooks/use-staff";
import { inviteStaff } from "@/lib/site.functions";
import { AdminOnly, inputCls, btnPrimary, btnGhost, btnDanger } from "@/components/admin/AdminOnly";
import { formatDate } from "@/lib/i18n";

export const Route = createFileRoute("/admin/staff")({ component: () => <AdminOnly><StaffPage /></AdminOnly> });

function StaffPage() {
  const { staff: me } = Route.useRouteContext() as unknown as { staff: { id: string } };
  const qc = useQueryClient();
  const { data = [], isLoading } = useStaffList();
  const update = useUpdateStaff();
  const remove = useDeleteStaff();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [busy, setBusy] = useState(false);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await inviteStaff({ data: { email: email.trim(), role, redirectTo: `${window.location.origin}/admin/reset-password` } });
      toast.success("Invitation envoyée");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["staff"] });
    } catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Équipe</h1>

      <form onSubmit={invite} className="flex flex-wrap items-end gap-3 rounded-xl bg-card p-6">
        <label className="text-sm">Email<input required type="email" className={`${inputCls} w-72`} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="text-sm">Rôle
          <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value as "admin" | "staff")}>
            <option value="staff">Staff</option><option value="admin">Administrateur</option>
          </select>
        </label>
        <button type="submit" className={btnPrimary} disabled={busy}>Inviter</button>
      </form>

      {isLoading ? <p>Chargement…</p> : (
        <div className="overflow-x-auto rounded-xl bg-card">
          <table className="w-full text-sm">
            <thead><tr><th className="p-3 text-start">Email</th><th className="p-3 text-start">Rôle</th><th className="p-3 text-start">Depuis</th><th /></tr></thead>
            <tbody>
              {data.map((s) => {
                const isMe = s.id === me.id;
                return (
                  <tr key={s.id} className="border-t">
                    <td className="p-3">{s.email} {isMe && <span className="ms-2 text-xs text-muted-foreground">(vous)</span>}</td>
                    <td className="p-3">
                      <select aria-label="Rôle" disabled={isMe} className="rounded border bg-background px-2 py-1" value={s.role}
                        onChange={async (e) => {
                          try { await update.mutateAsync({ id: s.id, patch: { role: e.target.value } }); toast.success("Rôle mis à jour"); }
                          catch (err) { toast.error((err as Error).message); }
                        }}>
                        <option value="staff">Staff</option><option value="admin">Administrateur</option>
                      </select>
                    </td>
                    <td className="p-3">{formatDate(s.created_at)}</td>
                    <td className="p-3 text-end">
                      {!isMe && <button className={btnDanger} onClick={async () => {
                        if (!confirm(`Retirer ${s.email} de l'équipe ?`)) return;
                        try { await remove.mutateAsync(s.id); toast.success("Membre retiré"); }
                        catch (err) { toast.error((err as Error).message); }
                      }}>Retirer</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Retirer un membre supprime son accès à l'administration ; son compte de connexion reste existant.</p>
    </div>
  );
}
