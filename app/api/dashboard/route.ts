import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });
  const supabase = getAdminClient();
  if (profile.role === "patient") {
    const { data: patient, error } = await supabase
      .from("patients")
      .select("id, demo_code, display_name, priority, care_status, patient_assignments(providers(display_name, specialties(name)))")
      .eq("id", profile.patient_id!)
      .single();
    if (error) return NextResponse.json({ error: "No se pudo cargar tu panel." }, { status: 500 });
    return NextResponse.json({ role: "patient", profile, patient });
  }
  const [patients, specialties, providers] = await Promise.all([
    supabase.from("patients").select("id, demo_code, display_name, priority, care_status, updated_at, patient_assignments(providers(id, display_name, specialties(name)))").order("priority", { ascending: false }).order("updated_at", { ascending: false }),
    supabase.from("specialties").select("id, name").order("name"),
    supabase.from("providers").select("id, display_name, specialty_id, specialties(name)").eq("is_active", true).order("display_name")
  ]);
  const error = [patients, specialties, providers].find((result) => result.error)?.error;
  if (error) return NextResponse.json({ error: "No se pudo cargar el panel clínico." }, { status: 500 });
  return NextResponse.json({ role: "doctor", profile, patients: patients.data, specialties: specialties.data, providers: providers.data });
}
