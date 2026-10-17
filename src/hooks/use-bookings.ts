import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { generateTrackingToken } from "@/lib/pricing";

export type Booking = Tables<"bookings">;
export type BookingWithRefs = Booking & {
  packages: { title: string } | null;
  hotels: { name: string } | null;
  package_departures: { departure_date: string; return_date: string } | null;
  hotel_rooms: { name: string } | null;
};

/** Staff/admin list (RLS: staff only). */
export function useBookings() {
  return useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, packages(title), hotels(name), package_departures(departure_date, return_date), hotel_rooms(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as BookingWithRefs[];
    },
  });
}

/** Public booking request. Anonymous visitors cannot read bookings back, so the token is generated here. */
export function useCreateBooking() {
  return useMutation({
    mutationFn: async (input: Omit<TablesInsert<"bookings">, "tracking_token">) => {
      const tracking_token = generateTrackingToken();
      const { error } = await supabase.from("bookings").insert({ ...input, tracking_token });
      if (error) throw error;
      return { tracking_token, phone: input.customer_phone };
    },
  });
}

export function useTrackBooking(phone: string, token: string) {
  return useQuery({
    queryKey: ["track", phone, token],
    enabled: !!phone && !!token,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("track_booking", { p_phone: phone, p_token: token });
      if (error) throw error;
      return data;
    },
  });
}

export function useSetBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.rpc("set_booking_status", { p_booking_id: id, p_status: status });
      if (error) throw error;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["departures"] });
    },
  });
}
