import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type HotelRoom = Tables<"hotel_rooms">;

export function useHotelRooms(hotelId: string | undefined, opts: { includeInactive?: boolean } = {}) {
  return useQuery({
    queryKey: ["rooms", hotelId, opts.includeInactive ?? false],
    enabled: !!hotelId,
    queryFn: async () => {
      let q = supabase.from("hotel_rooms").select("*").eq("hotel_id", hotelId!).order("price_per_night");
      if (!opts.includeInactive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateHotelRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TablesInsert<"hotel_rooms">) => {
      const { error } = await supabase.from("hotel_rooms").insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useUpdateHotelRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TablesUpdate<"hotel_rooms"> }) => {
      const { error } = await supabase.from("hotel_rooms").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useDeleteHotelRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hotel_rooms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}
