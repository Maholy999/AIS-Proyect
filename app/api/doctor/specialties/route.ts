import { NextResponse } from "next/server";
import { requireDoctor } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase";

export async function POST(request: Request) {
  if (!await requireDoctor()) return NextResponse.json({ error: "Acceso solo para personal médico." }, { status: 403 });
  const { name } = await request.json() as { name?: unknown };
  if (typeof name !== "string" || !name.trim()) return NextResponse.json({ error: "Escribe el nombre de la especialidad." }, { status: 400 });
  const { data, error } = await getAdminClient().from("specialties").insert({ name: name.trim().slice(0, 80) }).select("id, name").single();
  if (error?.code === "23505") return NextResponse.json({ error: "Esa especialidad ya existe." }, { status: 409 });
  if (error) return NextResponse.json({ error: "No se pudo crear la especialidad." }, { status: 500 });
  return NextResponse.json({ specialty: data }, { status: 201 });
}
