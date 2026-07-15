"use client";

import { FormEvent, useEffect, useState } from "react";

type Provider = { display_name: string; specialties?: { name: string } | null };
type Assignment = { providers: Provider | null };
type Patient = { id: string; demo_code: string; display_name: string; priority: "baja" | "media" | "alta"; care_status: string; patient_assignments?: Assignment[] };
type DoctorData = { role: "doctor"; profile: { display_name: string } };
type PatientData = { role: "patient"; profile: { display_name: string }; patient: Patient };
type Dashboard = DoctorData | PatientData;
type DemoPatient = { id: string; name: string; code: string; urgency: "baja" | "media" | "alta" };

const priorityLabels = { alta: "Alta", media: "Media", baja: "Baja" };
const simulatedPatients: DemoPatient[] = [
  { id: "demo-ana", name: "Ana Torres", code: "P-DEMO-001", urgency: "alta" },
  { id: "demo-bruno", name: "Bruno Mena", code: "P-DEMO-002", urgency: "media" },
  { id: "demo-carla", name: "Carla Vega", code: "P-DEMO-003", urgency: "baja" }
];

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
  const [doctorDemo, setDoctorDemo] = useState(false);

  async function loadDashboard() { setDashboard(await request<Dashboard>("/api/dashboard")); }
  useEffect(() => { request("/api/auth/me").then(loadDashboard).catch(() => undefined).finally(() => setChecking(false)); }, []);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try { await request("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); await loadDashboard(); setPassword(""); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "No fue posible iniciar sesión."); }
    finally { setBusy(false); }
  }
  async function logout() { await request("/api/auth/logout", { method: "POST" }); setDashboard(null); setEmail(""); setPassword(""); setDoctorDemo(false); }

  if (checking) return <main className="loading-page">Cargando acceso seguro…</main>;
  if (!dashboard) return <main className="login-shell"><section className="login-intro"><p className="eyebrow">CLÍNICA MANTA · ENTORNO DEMO</p><h1>Tu atención,<br /><em>en contexto.</em></h1><p>Accede con tu cuenta de Supabase para ver solo la información asignada a tu rol.</p></section><form className="login-card" onSubmit={login}><p className="section-kicker">INICIAR SESIÓN</p><div className="quick-login" aria-label="Seleccionar cuenta demo"><span>Acceso rápido</span><div><button type="button" className="quick-button" onClick={() => setEmail("doctor.demo@clinicamanta.test")}>Soy doctor</button><button type="button" className="quick-button" onClick={() => setEmail("paciente.ana@clinicamanta.test")}>Paciente Ana</button><button type="button" className="quick-button" onClick={() => setEmail("paciente.bruno@clinicamanta.test")}>Paciente Bruno</button><button type="button" className="quick-button" onClick={() => setEmail("paciente.carla@clinicamanta.test")}>Paciente Carla</button></div></div><label>Correo<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="nombre@clinicamanta.test" /></label><label>Contraseña<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <p className="error" role="alert">{error}</p>}<button disabled={busy}>{busy ? "Verificando…" : "Entrar al panel"}</button><p className="form-note">El acceso rápido completa el correo. La contraseña de Supabase sigue siendo necesaria.</p></form></main>;

  const showingDoctor = dashboard.role === "doctor" || doctorDemo;
  return <main className="app-shell"><header className="app-header"><div><p className="eyebrow">CLÍNICA MANTA · {showingDoctor ? "DEMO OPERATIVA" : "PANEL SEGURO"}</p><h1>{showingDoctor ? "Panel del doctor" : "Mi atención"}</h1></div><div className="user-menu">{doctorDemo ? <button className="quiet-button" onClick={() => setDoctorDemo(false)}>Volver a mi panel</button> : <><span>{dashboard.profile.display_name}</span><button className="quiet-button" onClick={logout}>Cerrar sesión</button></>}</div></header>{showingDoctor ? <DoctorDemo /> : <PatientPanel dashboard={dashboard} openDoctorDemo={() => setDoctorDemo(true)} />}</main>;
}

function PatientPanel({ dashboard, openDoctorDemo }: { dashboard: PatientData; openDoctorDemo: () => void }) {
  const { patient } = dashboard;
  const doctors = patient.patient_assignments?.map((item) => item.providers).filter(Boolean) as Provider[] | undefined;
  return <section className="patient-view"><p className="section-kicker">EXPEDIENTE DEMO · {patient.demo_code}</p><h2>Hola, {patient.display_name.split(" ")[0]}.</h2><p className="lead">El equipo revisa tu atención según la prioridad clínica actual.</p><div className="patient-status"><article><span>Prioridad</span><strong className={`priority ${patient.priority}`}>{priorityLabels[patient.priority]}</strong></article><article><span>Estado</span><strong>{patient.care_status}</strong></article><article><span>Equipo asignado</span><strong>{doctors?.length ? doctors.map((doctor) => `${doctor.display_name}${doctor.specialties?.name ? ` · ${doctor.specialties.name}` : ""}`).join(", ") : "Asignación pendiente"}</strong></article></div><section className="demo-switch"><p className="section-kicker">VISTA DE DEMOSTRACIÓN</p><h3>¿Quieres conocer el flujo médico?</h3><p>Abre una vista simulada donde el doctor prioriza a los pacientes. No modifica datos clínicos ni guarda cambios.</p><button onClick={openDoctorDemo}>Abrir demo del doctor</button></section><p className="privacy-note">Este panel es informativo. Para síntomas graves o de aparición súbita, busca atención de emergencia.</p></section>;
}

function DoctorDemo() {
  const [patients, setPatients] = useState(simulatedPatients);
  function changeUrgency(id: string, urgency: DemoPatient["urgency"]) { setPatients((current) => current.map((patient) => patient.id === id ? { ...patient, urgency } : patient)); }
  const orderedPatients = [...patients].sort((a, b) => ({ alta: 0, media: 1, baja: 2 }[a.urgency] - { alta: 0, media: 1, baja: 2 }[b.urgency]));
  return <><section className="doctor-summary"><p className="lead">Lista simulada para practicar la priorización. Los cambios existen solo mientras esta página permanezca abierta.</p><span>{patients.filter((patient) => patient.urgency === "alta").length} casos de prioridad alta</span></section><section className="patients-section"><div className="section-heading"><p className="section-kicker">PACIENTES SIMULADOS</p><h2>Lista de urgencia</h2></div><div className="patient-list">{orderedPatients.map((patient) => <article className="patient-row" key={patient.id}><div className="patient-ident"><span className={`priority-dot ${patient.urgency}`} /><div><strong>{patient.name}</strong><small>{patient.code} · Caso de demostración</small></div></div><strong className={`priority ${patient.urgency}`}>{priorityLabels[patient.urgency]}</strong><label>Nivel de urgencia<select value={patient.urgency} onChange={(event) => changeUrgency(patient.id, event.target.value as DemoPatient["urgency"])}>{Object.entries(priorityLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></article>)}</div></section><p className="privacy-note">Demo local: ninguna modificación se envía a Supabase ni se guarda en la base de datos.</p></>;
}
