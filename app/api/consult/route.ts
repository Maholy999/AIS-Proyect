import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { classify } from "@/lib/triage";

export const runtime = "nodejs";
const MIN_SIMILARITY = 0.78;
type Match = { source_title: string; source_url: string; page_number: number | null; content: string; similarity: number };
type Context = { patientId?: string; clinicId?: string; locationId?: string; roomId?: string; specialtyId?: string; providerId?: string; appointmentId?: string };

function source(match: Match) { return { title: match.source_title, url: match.source_url, page: match.page_number, excerpt: match.content.slice(0, 220), similarity: match.similarity }; }

export async function POST(request: Request) {
  try {
    const body = await request.json() as { query?: unknown; context?: Context };
    const query = typeof body.query === "string" ? body.query.trim().slice(0, 1200) : "";
    const context = body.context ?? {};
    if (query.length < 5) return NextResponse.json({ error: "Escribe una consulta de al menos cinco caracteres." }, { status: 400 });
    const triage = classify(query);
    const supabase = getAdminClient();
    if (triage.urgency === "alta") {
      const { data: consultation, error } = await supabase.from("consultations").insert({ query, category: triage.category, urgency: triage.urgency, status: "escalated", escalation_reason: triage.escalationReason, patient_id: context.patientId, clinic_id: context.clinicId, location_id: context.locationId, room_id: context.roomId, specialty_id: context.specialtyId, provider_id: context.providerId, appointment_id: context.appointmentId, context_snapshot: context }).select("id").single();
      if (error) throw error;
      const { error: escalationError } = await supabase.from("escalations").insert({ consultation_id: consultation.id, reason: triage.escalationReason });
      if (escalationError) throw escalationError;
      return NextResponse.json({ status: "escalated", ...triage, reason: triage.escalationReason, sources: [] });
    }
    if (!process.env.OPENAI_API_KEY || !process.env.DEEPSEEK_API_KEY) throw new Error("Faltan las credenciales de embeddings o DeepSeek en el servidor.");
    const embeddingClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const deepseek = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: "https://api.deepseek.com" });
    const embedding = await embeddingClient.embeddings.create({ model: "text-embedding-3-small", input: query, dimensions: 1536 });
    const { data, error } = await supabase.rpc("match_medical_chunks", { query_embedding: embedding.data[0].embedding, match_threshold: MIN_SIMILARITY, match_count: 3 });
    if (error) throw error;
    const matches = (data ?? []) as Match[];
    if (!matches.length) {
      const reason = "No se encontró una fuente indexada con confianza suficiente para responder de forma segura.";
      const { data: consultation, error: insertError } = await supabase.from("consultations").insert({ query, category: triage.category, urgency: triage.urgency, status: "escalated", escalation_reason: reason, patient_id: context.patientId, clinic_id: context.clinicId, location_id: context.locationId, room_id: context.roomId, specialty_id: context.specialtyId, provider_id: context.providerId, appointment_id: context.appointmentId, context_snapshot: context }).select("id").single();
      if (insertError) throw insertError;
      const { error: escalationError } = await supabase.from("escalations").insert({ consultation_id: consultation.id, reason });
      if (escalationError) throw escalationError;
      return NextResponse.json({ status: "escalated", ...triage, reason, sources: [] });
    }
    const retrievalContext = matches.map((item, index) => `[${index + 1}] ${item.source_title}, pág. ${item.page_number ?? "s/n"}: ${item.content}`).join("\n\n");
    const completion = await deepseek.chat.completions.create({ model: "deepseek-v4-flash", temperature: 0.1, messages: [{ role: "system", content: "Eres un asistente de orientación para una clínica. Responde en español usando ÚNICAMENTE el contexto. No diagnostiques, no inventes información, no indiques dosis. Si el contexto no basta, responde exactamente: ESCALAR." }, { role: "user", content: `Consulta: ${query}\n\nContexto indexado:\n${retrievalContext}` }] });
    const answer = completion.choices[0]?.message.content?.trim();
    if (!answer || answer === "ESCALAR") {
      const reason = "La fuente encontrada no contiene información suficiente para una orientación segura.";
      const { data: consultation, error: insertError } = await supabase.from("consultations").insert({ query, category: triage.category, urgency: triage.urgency, status: "escalated", escalation_reason: reason, patient_id: context.patientId, clinic_id: context.clinicId, location_id: context.locationId, room_id: context.roomId, specialty_id: context.specialtyId, provider_id: context.providerId, appointment_id: context.appointmentId, context_snapshot: context }).select("id").single();
      if (insertError) throw insertError;
      const { error: escalationError } = await supabase.from("escalations").insert({ consultation_id: consultation.id, reason });
      if (escalationError) throw escalationError;
      return NextResponse.json({ status: "escalated", ...triage, reason, sources: matches.map(source) });
    }
    const { error: insertError } = await supabase.from("consultations").insert({ query, category: triage.category, urgency: triage.urgency, status: "answered", patient_id: context.patientId, clinic_id: context.clinicId, location_id: context.locationId, room_id: context.roomId, specialty_id: context.specialtyId, provider_id: context.providerId, appointment_id: context.appointmentId, context_snapshot: context });
    if (insertError) throw insertError;
    return NextResponse.json({ status: "answered", ...triage, answer, sources: matches.map(source) });
  } catch (error) {
    console.error("consultation_failed", error);
    return NextResponse.json({ error: "No fue posible procesar la consulta. Inténtalo de nuevo o contacta a la clínica." }, { status: 500 });
  }
}
