import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type LandingPage = Tables<"landing_pages">;
export type ContentBlock =
  | { type: "text"; heading?: string; body?: string }
  | { type: "image"; src: string; alt?: string }
  | { type: "cta"; label: string; href: string };

export function useLandingPages() {
  return useQuery({
    queryKey: ["landing_pages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("landing_pages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useLandingPage(slug: string) {
  return useQuery({
    queryKey: ["landing_page", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("landing_pages").select("*").eq("slug", slug).eq("active", true).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateLandingPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TablesInsert<"landing_pages">) => {
      const { error } = await supabase.from("landing_pages").insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["landing_pages"] });
      qc.invalidateQueries({ queryKey: ["landing_page"] });
    },
  });
}

export function useUpdateLandingPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, patch }: { slug: string; patch: TablesUpdate<"landing_pages"> }) => {
      const { error } = await supabase.from("landing_pages").update(patch).eq("slug", slug);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["landing_pages"] });
      qc.invalidateQueries({ queryKey: ["landing_page"] });
    },
  });
}

export function useDeleteLandingPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) => {
      const { error } = await supabase.from("landing_pages").delete().eq("slug", slug);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["landing_pages"] });
      qc.invalidateQueries({ queryKey: ["landing_page"] });
    },
  });
}
