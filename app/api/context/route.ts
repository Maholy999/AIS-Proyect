import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getAdminClient();
    const [patients, clinics, locations, rooms, specialties, providers] = await Promise.all([
      supabase.from("patients").select("id, demo_code, display_name").eq("is_demo", true).order("demo_code"),
      supabase.from("clinics").select("id, name").order("name"),
      supabase.from("locations").select("id, clinic_id, name").order("name"),
      supabase.from("rooms").select("id, location_id, name").order("name"),
      supabase.from("specialties").select("id, name").order("name"),
      supabase.from("providers").select("id, display_name, specialty_id, location_id").eq("is_active", true).order("display_name")
    ]);
    const error = [patients, clinics, locations, rooms, specialties, providers].find((item) => item.error)?.error;
    if (error) throw error;
    return NextResponse.json({ patients: patients.data, clinics: clinics.data, locations: locations.data, rooms: rooms.data, specialties: specialties.data, providers: providers.data });
  } catch {
    return NextResponse.json({ error: "No se pudo cargar el contexto clínico." }, { status: 500 });
  }
}
