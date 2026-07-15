"use client";

import { FormEvent, useEffect, useState } from "react";

type Source = { title: string; page: number | null; url: string; excerpt: string; similarity: number };
type Result = {
  status: "answered" | "escalated";
  category: string;
  urgency: "baja" | "media" | "alta";
  answer?: string;
  reason?: string;
  sources: Source[];
};
type ContextItem = { id: string; name?: string; display_name?: string; demo_code?: string };
type ContextData = { patients: ContextItem[]; clinics: ContextItem[]; locations: ContextItem[]; rooms: ContextItem[]; specialties: ContextItem[]; providers: ContextItem[] };

const examples = [
  "¿Cómo puedo aliviar una tos leve de tres días?",
  "Mi papá tiene dolor fuerte en el pecho y le falta el aire."
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contextData, setContextData] = useState<ContextData | null>(null);
  const [context, setContext] = useState({ patientId: "", clinicId: "", locationId: "", roomId: "", specialtyId: "", providerId: "" });

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
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ocurrió un error inesperado.");
    } finally { setLoading(false); }
  }

  return <main>
    <section className="masthead"><p className="eyebrow">CLÍNICA · MANTA, ECUADOR</p><h1>Primero, la señal.<br /><em>Después, la respuesta.</em></h1><p className="intro">Describe una consulta de salud. El sistema la prioriza y responde solo cuando encuentra una fuente clínica verificable.</p></section>
    <section className="console" aria-label="Consulta de salud">
      <div className="console-heading"><span>Consulta segura</span><span className="status-dot">RAG activo</span></div>
      <form onSubmit={submit}>
        <label htmlFor="query">¿Qué necesitas consultar?</label>
        <textarea id="query" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ej.: Tengo fiebre y dolor de garganta desde ayer…" maxLength={1200} required />
        {contextData ? <fieldset className="clinical-context"><legend>Contexto de atención · datos demo</legend><div className="select-grid">
          <label>Paciente<select value={context.patientId} onChange={(e) => setContext({ ...context, patientId: e.target.value })}>{contextData.patients.map((item) => <option key={item.id} value={item.id}>{item.demo_code} · {item.display_name}</option>)}</select></label>
          <label>Especialidad<select value={context.specialtyId} onChange={(e) => setContext({ ...context, specialtyId: e.target.value })}>{contextData.specialties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Profesional<select value={context.providerId} onChange={(e) => setContext({ ...context, providerId: e.target.value })}>{contextData.providers.map((item) => <option key={item.id} value={item.id}>{item.display_name}</option>)}</select></label>
          <label>Sala<select value={context.roomId} onChange={(e) => setContext({ ...context, roomId: e.target.value })}>{contextData.rooms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        </div></fieldset> : <p className="context-loading">Cargando contexto clínico…</p>}
        <div className="form-footer"><span>No incluyas nombres ni datos personales.</span><button disabled={loading}>{loading ? "Analizando…" : "Analizar consulta"}</button></div>
      </form>
      <div className="examples">{examples.map((example) => <button key={example} type="button" onClick={() => setQuery(example)}>{example}</button>)}</div>
    </section>
    {error ? <p className="error" role="alert">{error}</p> : null}
    {result ? <section className={`result ${result.status}`} aria-live="polite">
      <div className="result-meta"><span>{result.status === "answered" ? "ORIENTACIÓN BASADA EN FUENTE" : "CASO ESCALADO"}</span><span>{result.category} · urgencia {result.urgency}</span></div>
      {result.status === "answered" ? <><h2>Respuesta</h2><p>{result.answer}</p></> : <><h2>Un profesional debe revisarlo</h2><p>{result.reason}</p><p className="context">Se guardó el contexto de la consulta para que el equipo médico pueda continuar la atención.</p></>}
      {result.sources.length ? <div className="sources"><h3>Fuente consultada</h3>{result.sources.map((source) => <a key={`${source.url}-${source.page}`} href={source.url} target="_blank" rel="noreferrer"><strong>{source.title}</strong>{source.page ? ` · pág. ${source.page}` : ""}<small>{source.excerpt}</small></a>)}</div> : null}
      <p className="disclaimer">Esta herramienta no diagnostica ni sustituye la atención de un profesional de salud.</p>
    </section> : null}
  </main>;
}
