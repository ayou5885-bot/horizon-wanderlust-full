import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Package = Tables<"packages">;

export function usePackages(opts: { includeInactive?: boolean } = {}) {
  return useQuery({
    queryKey: ["packages", opts.includeInactive ?? false],
    queryFn: async () => {
      let q = supabase.from("packages").select("*").order("created_at", { ascending: false });
      if (!opts.includeInactive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function usePackageBySlug(slug: string) {
  return useQuery({
    queryKey: ["package", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("packages").select("*").eq("slug", slug).eq("active", true).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TablesInsert<"packages">) => {
      const { error } = await supabase.from("packages").insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["packages"] });
      qc.invalidateQueries({ queryKey: ["package"] });
    },
  });
}

export function useUpdatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TablesUpdate<"packages"> }) => {
      const { error } = await supabase.from("packages").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["packages"] });
      qc.invalidateQueries({ queryKey: ["package"] });
    },
  });
}

export function useDeletePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("packages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["packages"] });
      qc.invalidateQueries({ queryKey: ["package"] });
    },
  });
}
