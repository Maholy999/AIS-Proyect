import { NextResponse } from "next/server";
import { requireDoctor } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase";

export async function POST(request: Request) {
  if (!await requireDoctor()) return NextResponse.json({ error: "Acceso solo para personal médico." }, { status: 403 });
  const { displayName, specialtyId, patientId } = await request.json() as { displayName?: unknown; specialtyId?: unknown; patientId?: unknown };
  if (typeof displayName !== "string" || typeof specialtyId !== "string" || !displayName.trim() || !specialtyId) return NextResponse.json({ error: "Nombre y especialidad son obligatorios." }, { status: 400 });
  const supabase = getAdminClient();
  const { data: location, error: locationError } = await supabase.from("locations").select("id").order("name").limit(1).single();
  if (locationError || !location) return NextResponse.json({ error: "No hay una sede disponible." }, { status: 500 });
  const { data: provider, error } = await supabase.from("providers").insert({ display_name: displayName.trim().slice(0, 100), specialty_id: specialtyId, location_id: location.id }).select("id, display_name").single();
  if (error) return NextResponse.json({ error: "No se pudo crear el profesional." }, { status: 500 });
  if (typeof patientId === "string" && patientId) {
    const { error: assignmentError } = await supabase.from("patient_assignments").insert({ patient_id: patientId, provider_id: provider.id });
    if (assignmentError) return NextResponse.json({ error: "Profesional creado, pero no se pudo asignar al paciente." }, { status: 500 });
  }
  return NextResponse.json({ provider }, { status: 201 });
}
