import { NextResponse } from "next/server";
import { requireDoctor } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase";

const priorities = new Set(["baja", "media", "alta"]);
const statuses = new Set(["En seguimiento", "En atención", "Pendiente de revisión"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireDoctor()) return NextResponse.json({ error: "Acceso solo para personal médico." }, { status: 403 });
  const body = await request.json() as { priority?: unknown; careStatus?: unknown };
  const updates: Record<string, string> = {};
  if (typeof body.priority === "string" && priorities.has(body.priority)) updates.priority = body.priority;
  if (typeof body.careStatus === "string" && statuses.has(body.careStatus)) updates.care_status = body.careStatus;
  if (!Object.keys(updates).length) return NextResponse.json({ error: "Actualización inválida." }, { status: 400 });
  updates.updated_at = new Date().toISOString();
  const { id } = await params;
  const { error } = await getAdminClient().from("patients").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: "No se pudo actualizar el paciente." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
