import { supabase } from "@/integrations/supabase/client";

const BUCKET = "travel-images";
// Workspace policy blocks public buckets, so images get a long-lived signed URL (~10 years).
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export async function uploadImage(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from(BUCKET).createSignedUrl(path, TEN_YEARS);
  if (e2 || !data) throw e2 ?? new Error("signed url failed");
  return data.signedUrl;
}
