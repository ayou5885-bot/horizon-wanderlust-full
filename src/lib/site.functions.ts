import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Public: favicon for every page load. */
export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const client = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data } = await client.from("site_settings").select("favicon_url").eq("id", 1).maybeSingle();
    return { favicon_url: data?.favicon_url ?? null };
  } catch {
    return { favicon_url: null };
  }
});

/** Admin: invite a staff member by email and create their staff row. */
export const inviteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ email: z.string().email(), role: z.enum(["admin", "staff"]), redirectTo: z.string().url() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let userId: string | undefined;
    const inv = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, { redirectTo: data.redirectTo });
    if (inv.error) {
      // Existing account: look it up instead
      const list = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      userId = list.data.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase())?.id;
      if (!userId) throw new Error(inv.error.message);
    } else {
      userId = inv.data.user?.id;
    }
    const { error } = await supabaseAdmin.from("staff").upsert({ id: userId!, email: data.email, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
