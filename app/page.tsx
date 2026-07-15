"use client";

import { FormEvent, useEffect, useState } from "react";

type Provider = { id: string; display_name: string; specialties?: { name: string } | null };
type Assignment = { providers: Provider | null };
type Patient = { id: string; demo_code: string; display_name: string; priority: "baja" | "media" | "alta"; care_status: string; patient_assignments?: Assignment[] };
type Specialty = { id: string; name: string };
type DoctorData = { role: "doctor"; profile: { display_name: string }; patients: Patient[]; specialties: Specialty[]; providers: Provider[] };
type PatientData = { role: "patient"; profile: { display_name: string }; patient: Patient };
type Dashboard = DoctorData | PatientData;

const priorityLabels = { alta: "Alta", media: "Media", baja: "Baja" };
const statuses = ["Pendiente de revisión", "En atención", "En seguimiento"];

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const data = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "No fue posible completar la acción.");
  return data;
}

export default function Home() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadDashboard() {
    const data = await request<Dashboard>("/api/dashboard");
    setDashboard(data);
  }

  useEffect(() => {
    request("/api/auth/me").then(loadDashboard).catch(() => undefined).finally(() => setChecking(false));
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      await request("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      await loadDashboard();
      setPassword("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No fue posible iniciar sesión."); }
    finally { setBusy(false); }
  }

  async function logout() {
    await request("/api/auth/logout", { method: "POST" });
    setDashboard(null); setEmail(""); setPassword("");
  }

  if (checking) return <main className="loading-page">Cargando acceso seguro…</main>;
  if (!dashboard) return <main className="login-shell"><section className="login-intro"><p className="eyebrow">CLÍNICA MANTA · ENTORNO DEMO</p><h1>Tu atención,<br /><em>en contexto.</em></h1><p>Accede con tu cuenta de Supabase para ver solo la información asignada a tu rol.</p></section><form className="login-card" onSubmit={login}><p className="section-kicker">INICIAR SESIÓN</p><label>Correo<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="nombre@clinicamanta.test" /></label><label>Contraseña<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <p className="error" role="alert">{error}</p>}<button disabled={busy}>{busy ? "Verificando…" : "Entrar al panel"}</button><p className="form-note">Las cuentas demo se crean con <code>npm run seed:demo-users</code>.</p></form></main>;
  return <main className="app-shell"><header className="app-header"><div><p className="eyebrow">CLÍNICA MANTA · PANEL SEGURO</p><h1>{dashboard.role === "doctor" ? "Triaje clínico" : "Mi atención"}</h1></div><div className="user-menu"><span>{dashboard.profile.display_name}</span><button className="quiet-button" onClick={logout}>Cerrar sesión</button></div></header>{dashboard.role === "doctor" ? <DoctorPanel dashboard={dashboard} reload={loadDashboard} /> : <PatientPanel dashboard={dashboard} />}</main>;
}

function PatientPanel({ dashboard }: { dashboard: PatientData }) {
  const { patient } = dashboard;
  const doctors = patient.patient_assignments?.map((item) => item.providers).filter(Boolean) as Provider[] | undefined;
  return <section className="patient-view"><p className="section-kicker">EXPEDIENTE DEMO · {patient.demo_code}</p><h2>Hola, {patient.display_name.split(" ")[0]}.</h2><p className="lead">El equipo revisa tu atención según la prioridad clínica actual.</p><div className="patient-status"><article><span>Prioridad</span><strong className={`priority ${patient.priority}`}>{priorityLabels[patient.priority]}</strong></article><article><span>Estado</span><strong>{patient.care_status}</strong></article><article><span>Equipo asignado</span><strong>{doctors?.length ? doctors.map((doctor) => `${doctor.display_name}${doctor.specialties?.name ? ` · ${doctor.specialties.name}` : ""}`).join(", ") : "Asignación pendiente"}</strong></article></div><p className="privacy-note">Este panel es informativo. Para síntomas graves o de aparición súbita, busca atención de emergencia.</p></section>;
}

function DoctorPanel({ dashboard, reload }: { dashboard: DoctorData; reload: () => Promise<void> }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [specialtyName, setSpecialtyName] = useState("");
  const [providerName, setProviderName] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [patientId, setPatientId] = useState("");

  async function updatePatient(patient: Patient, priority: Patient["priority"], careStatus: string) {
    setSaving(patient.id); setError("");
    try { await request(`/api/doctor/patients/${patient.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priority, careStatus }) }); await reload(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo actualizar."); }
    finally { setSaving(null); }
  }
  async function addSpecialty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    try { await request("/api/doctor/specialties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: specialtyName }) }); setSpecialtyName(""); await reload(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo crear."); }
  }
  async function addProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    try { await request("/api/doctor/providers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName: providerName, specialtyId, patientId }) }); setProviderName(""); setSpecialtyId(""); setPatientId(""); await reload(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "No se pudo crear."); }
  }
  return <><section className="doctor-summary"><p className="lead">Prioriza, asigna y actualiza los casos de demostración desde un solo lugar.</p><span>{dashboard.patients.filter((patient) => patient.priority === "alta").length} casos de prioridad alta</span></section>{error && <p className="error" role="alert">{error}</p>}<section className="patients-section"><div className="section-heading"><p className="section-kicker">PACIENTES</p><h2>Lista de prioridad</h2></div><div className="patient-list">{dashboard.patients.map((patient) => <article className="patient-row" key={patient.id}><div className="patient-ident"><span className={`priority-dot ${patient.priority}`} /><div><strong>{patient.display_name}</strong><small>{patient.demo_code} · {patient.patient_assignments?.map((assignment) => assignment.providers?.display_name).filter(Boolean).join(", ") || "Sin profesional asignado"}</small></div></div><label>Prioridad<select value={patient.priority} disabled={saving === patient.id} onChange={(event) => updatePatient(patient, event.target.value as Patient["priority"], patient.care_status)}>{Object.entries(priorityLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Estado<select value={patient.care_status} disabled={saving === patient.id} onChange={(event) => updatePatient(patient, patient.priority, event.target.value)}>{statuses.map((status) => <option value={status} key={status}>{status}</option>)}</select></label></article>)}</div></section><section className="quick-actions"><div className="section-heading"><p className="section-kicker">INGRESO RÁPIDO</p><h2>Equipo clínico</h2></div><div className="action-grid"><form onSubmit={addSpecialty}><label>Nueva especialidad<input value={specialtyName} onChange={(event) => setSpecialtyName(event.target.value)} placeholder="Ej. Pediatría" required /></label><button>Crear especialidad</button></form><form onSubmit={addProvider}><label>Nuevo profesional<input value={providerName} onChange={(event) => setProviderName(event.target.value)} placeholder="Ej. Dr. Andrés Paz" required /></label><label>Especialidad<select value={specialtyId} onChange={(event) => setSpecialtyId(event.target.value)} required><option value="">Selecciona una</option>{dashboard.specialties.map((specialty) => <option value={specialty.id} key={specialty.id}>{specialty.name}</option>)}</select></label><label>Asignar a paciente (opcional)<select value={patientId} onChange={(event) => setPatientId(event.target.value)}><option value="">Sin asignar</option>{dashboard.patients.map((patient) => <option value={patient.id} key={patient.id}>{patient.display_name}</option>)}</select></label><button>Crear profesional</button></form></div></section></>;
}
