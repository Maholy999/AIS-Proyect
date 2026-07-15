import { cookies } from "next/headers";
import { getAdminClient } from "@/lib/supabase";

export const ACCESS_TOKEN_COOKIE = "clinic-access-token";

export type Profile = {
  id: string;
  role: "doctor" | "patient";
  display_name: string;
  patient_id: string | null;
  provider_id: string | null;
};

export async function getCurrentProfile(): Promise<Profile | null> {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;
  const supabase = getAdminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return null;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, display_name, patient_id, provider_id")
    .eq("id", userData.user.id)
    .single();
  if (profileError || !profile) return null;
  return profile as Profile;
}

export async function requireDoctor(): Promise<Profile | null> {
  const profile = await getCurrentProfile();
  return profile?.role === "doctor" ? profile : null;
}
