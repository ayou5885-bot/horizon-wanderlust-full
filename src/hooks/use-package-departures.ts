import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Departure = Tables<"package_departures">;

export function usePackageDepartures(packageId: string | undefined, opts: { upcomingOnly?: boolean } = {}) {
  return useQuery({
    queryKey: ["departures", packageId, opts.upcomingOnly ?? false],
    enabled: !!packageId,
    queryFn: async () => {
      let q = supabase.from("package_departures").select("*").eq("package_id", packageId!).order("departure_date");
      if (opts.upcomingOnly) q = q.gte("departure_date", new Date().toISOString().slice(0, 10));
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useUpcomingDeparturesCount(days: number) {
  return useQuery({
    queryKey: ["departures-upcoming", days],
    queryFn: async () => {
      const today = new Date();
      const end = new Date(Date.now() + days * 86400000);
      const { count, error } = await supabase
        .from("package_departures")
        .select("id", { count: "exact", head: true })
        .gte("departure_date", today.toISOString().slice(0, 10))
        .lte("departure_date", end.toISOString().slice(0, 10));
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useCreateDeparture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TablesInsert<"package_departures">) => {
      const { error } = await supabase.from("package_departures").insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departures"] });
      qc.invalidateQueries({ queryKey: ["departures-upcoming"] });
    },
  });
}

export function useUpdateDeparture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TablesUpdate<"package_departures"> }) => {
      const { error } = await supabase.from("package_departures").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departures"] });
      qc.invalidateQueries({ queryKey: ["departures-upcoming"] });
    },
  });
}

export function useDeleteDeparture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("package_departures").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departures"] });
      qc.invalidateQueries({ queryKey: ["departures-upcoming"] });
    },
  });
}
