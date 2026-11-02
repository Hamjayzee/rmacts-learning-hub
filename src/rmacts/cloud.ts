import { supabase } from "@/integrations/supabase/client";

export { supabase };

export type AppUser = { uid: string; email: string | null };

export type Material = {
  id: string;
  title?: string;
  description?: string;
  link?: string;
  fileUrl?: string; // storage path inside the "materials" bucket
  fileName?: string;
  isQuiz?: boolean;
};

type MaterialRow = {
  id: string;
  title: string;
  description: string;
  link: string;
  file_url: string;
  file_name: string;
  is_quiz: boolean;
};

export async function fetchMaterials(): Promise<Material[]> {
  const { data, error } = await supabase.from("materials").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data as MaterialRow[]).map(r => ({
    id: r.id,
    title: r.title,
    description: r.description,
    link: r.link,
    fileUrl: r.file_url,
    fileName: r.file_name,
    isQuiz: r.is_quiz,
  }));
}

export async function getRole(uid: string): Promise<string> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
  return data?.some(r => r.role === "admin") ? "admin" : "student";
}

/** Short-lived link for a private file. */
export async function signedUrl(bucket: "materials" | "profile-photos", path: string): Promise<string> {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? "";
}

export async function openMaterialFile(path: string) {
  const win = window.open("", "_blank");
  const url = await signedUrl("materials", path);
  if (win) win.location.href = url;
  else window.location.href = url;
}
