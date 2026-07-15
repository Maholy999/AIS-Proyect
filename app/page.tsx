"use client";

import { FormEvent, useEffect, useState } from "react";

type Source = { title: string; page: number | null; url: string; excerpt: string; similarity: number };
type Result = { status: "answered" | "escalated"; category: string; urgency: "baja" | "media" | "alta"; answer?: string; reason?: string; sources: Source[] };
type ContextItem = { id: string; name?: string; display_name?: string; demo_code?: string };
type ContextData = { patients: ContextItem[]; clinics: ContextItem[]; locations: ContextItem[]; rooms: ContextItem[]; specialties: ContextItem[]; providers: ContextItem[] };
type Urgency = "baja" | "media" | "alta";
type DemoPatient = { id: string; name: string; code: string; urgency: Urgency };

const examples = ["¿Cómo puedo aliviar una tos leve de tres días?", "Mi papá tiene dolor fuerte en el pecho y le falta el aire."];
const urgencyLabels = { alta: "Alta", media: "Media", baja: "Baja" };
const fallbackContext: ContextData = {
  patients: [{ id: "demo-patient", demo_code: "P-DEMO-001", display_name: "Paciente de demostración" }],
  clinics: [{ id: "demo-clinic", name: "Clínica Manta Demo" }],
  locations: [{ id: "demo-location", name: "Sede Centro" }],
  rooms: [{ id: "demo-room", name: "Sala de triaje 01" }],
  specialties: [{ id: "demo-specialty", name: "Medicina familiar" }],
  providers: [{ id: "demo-provider", display_name: "Dra. Rivera (demo)" }]
};
const simulatedPatients: DemoPatient[] = [
  { id: "demo-ana", name: "Ana Torres", code: "P-DEMO-001", urgency: "alta" },
  { id: "demo-bruno", name: "Bruno Mena", code: "P-DEMO-002", urgency: "media" },
  { id: "demo-carla", name: "Carla Vega", code: "P-DEMO-003", urgency: "baja" }
];

export default function Home() {
  const [view, setView] = useState<"patient" | "doctor">("patient");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contextData, setContextData] = useState<ContextData>(fallbackContext);
  const [context, setContext] = useState({ patientId: "demo-patient", clinicId: "demo-clinic", locationId: "demo-location", roomId: "demo-room", specialtyId: "demo-specialty", providerId: "demo-provider" });

  useEffect(() => {
    fetch("/api/context").then(async (response) => {
      if (!response.ok) return;
      const data = await response.json() as ContextData;
      setContextData(data);
      setContext({ patientId: data.patients[0]?.id ?? "", clinicId: data.clinics[0]?.id ?? "", locationId: data.locations[0]?.id ?? "", roomId: data.rooms[0]?.id ?? "", specialtyId: data.specialties[0]?.id ?? "", providerId: data.providers[0]?.id ?? "" });
    }).catch(() => undefined);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/consult", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, context }) });
      const data = await response.json() as Result & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No fue posible procesar la consulta.");
      setResult(data);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Ocurrió un error inesperado."); }
    finally { setLoading(false); }
  }

  if (view === "doctor") return <main><section className="masthead doctor-masthead"><p className="eyebrow">CLÍNICA · MANTA, ECUADOR</p><div className="demo-header"><div><h1>Panel del<br /><em>doctor.</em></h1><p className="intro">Demo local de priorización. Los cambios no se guardan ni se envían a una base de datos.</p></div><button className="doctor-entry" onClick={() => setView("patient")}>Volver a consulta</button></div></section><DoctorDemo /></main>;

  return <main><section className="masthead"><div className="patient-heading"><div><p className="eyebrow">CLÍNICA · MANTA, ECUADOR</p><h1>Primero, la señal.<br /><em>Después, la respuesta.</em></h1><p className="intro">Describe una consulta de salud. El sistema la prioriza y responde solo cuando encuentra una fuente clínica verificable.</p></div><button className="doctor-entry" onClick={() => setView("doctor")}>Panel del doctor</button></div></section><section className="console" aria-label="Consulta de salud"><div className="console-heading"><span>Consulta segura</span><span className="status-dot">RAG activo</span></div><form onSubmit={submit}><label htmlFor="query">¿Qué necesitas consultar?</label><textarea id="query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej.: Tengo fiebre y dolor de garganta desde ayer…" maxLength={1200} required /><fieldset className="clinical-context"><legend>Contexto de atención · datos demo</legend><div className="select-grid"><label>Paciente<select value={context.patientId} onChange={(event) => setContext({ ...context, patientId: event.target.value })}>{contextData.patients.map((item) => <option key={item.id} value={item.id}>{item.demo_code} · {item.display_name}</option>)}</select></label><label>Especialidad<select value={context.specialtyId} onChange={(event) => setContext({ ...context, specialtyId: event.target.value })}>{contextData.specialties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Profesional<select value={context.providerId} onChange={(event) => setContext({ ...context, providerId: event.target.value })}>{contextData.providers.map((item) => <option key={item.id} value={item.id}>{item.display_name}</option>)}</select></label><label>Sala<select value={context.roomId} onChange={(event) => setContext({ ...context, roomId: event.target.value })}>{contextData.rooms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div></fieldset><div className="form-footer"><span>No incluyas nombres ni datos personales.</span><button disabled={loading}>{loading ? "Analizando…" : "Analizar consulta"}</button></div></form><div className="examples">{examples.map((example) => <button key={example} type="button" onClick={() => setQuery(example)}>{example}</button>)}</div></section>{error ? <p className="error" role="alert">{error}</p> : null}{result ? <section className={`result ${result.status}`} aria-live="polite"><div className="result-meta"><span>{result.status === "answered" ? "ORIENTACIÓN BASADA EN FUENTE" : "CASO ESCALADO"}</span><span>{result.category} · urgencia {result.urgency}</span></div>{result.status === "answered" ? <><h2>Respuesta</h2><p>{result.answer}</p></> : <><h2>Un profesional debe revisarlo</h2><p>{result.reason}</p></>}{result.sources.length ? <div className="sources"><h3>Fuente consultada</h3>{result.sources.map((source) => <a key={`${source.url}-${source.page}`} href={source.url} target="_blank" rel="noreferrer"><strong>{source.title}</strong>{source.page ? ` · pág. ${source.page}` : ""}<small>{source.excerpt}</small></a>)}</div> : null}<p className="disclaimer">Esta herramienta no diagnostica ni sustituye la atención de un profesional de salud.</p></section> : null}</main>;
}

function DoctorDemo() {
  const [patients, setPatients] = useState(simulatedPatients);
  function changeUrgency(id: string, urgency: Urgency) { setPatients((current) => current.map((patient) => patient.id === id ? { ...patient, urgency } : patient)); }
  const orderedPatients = [...patients].sort((a, b) => ({ alta: 0, media: 1, baja: 2 }[a.urgency] - { alta: 0, media: 1, baja: 2 }[b.urgency]));
  return <section className="doctor-demo"><div className="doctor-summary"><p className="lead">Lista simulada para practicar la priorización. Los cambios existen solo mientras esta página permanezca abierta.</p><span>{patients.filter((patient) => patient.urgency === "alta").length} casos de prioridad alta</span></div><section className="patients-section"><div className="section-heading"><p className="section-kicker">PACIENTES SIMULADOS</p><h2>Lista de urgencia</h2></div><div className="patient-list">{orderedPatients.map((patient) => <article className="patient-row" key={patient.id}><div className="patient-ident"><span className={`priority-dot ${patient.urgency}`} /><div><strong>{patient.name}</strong><small>{patient.code} · Caso de demostración</small></div></div><strong className={`priority ${patient.urgency}`}>{urgencyLabels[patient.urgency]}</strong><label>Nivel de urgencia<select value={patient.urgency} onChange={(event) => changeUrgency(patient.id, event.target.value as Urgency)}>{Object.entries(urgencyLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></article>)}</div></section><p className="privacy-note">Demo local: ninguna modificación se envía a Supabase ni se guarda en la base de datos.</p></section>;
}
