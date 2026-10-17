import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Hotel = Tables<"hotels">;

export function useHotels(opts: { includeInactive?: boolean } = {}) {
  return useQuery({
    queryKey: ["hotels", opts.includeInactive ?? false],
    queryFn: async () => {
      let q = supabase.from("hotels").select("*").order("created_at", { ascending: false });
      if (!opts.includeInactive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useHotelBySlug(slug: string) {
  return useQuery({
    queryKey: ["hotel", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("hotels").select("*").eq("slug", slug).eq("active", true).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateHotel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TablesInsert<"hotels">) => {
      const { error } = await supabase.from("hotels").insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hotels"] });
      qc.invalidateQueries({ queryKey: ["hotel"] });
    },
  });
}

export function useUpdateHotel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TablesUpdate<"hotels"> }) => {
      const { error } = await supabase.from("hotels").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hotels"] });
      qc.invalidateQueries({ queryKey: ["hotel"] });
    },
  });
}

export function useDeleteHotel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hotels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hotels"] });
      qc.invalidateQueries({ queryKey: ["hotel"] });
    },
  });
}
