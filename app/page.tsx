"use client";

import { useState } from "react";

type Urgency = "baja" | "media" | "alta";
type DemoPatient = { id: string; name: string; code: string; urgency: Urgency };

const urgencyLabels = { alta: "Alta", media: "Media", baja: "Baja" };
const simulatedPatients: DemoPatient[] = [
  { id: "demo-ana", name: "Ana Torres", code: "P-DEMO-001", urgency: "alta" },
  { id: "demo-bruno", name: "Bruno Mena", code: "P-DEMO-002", urgency: "media" },
  { id: "demo-carla", name: "Carla Vega", code: "P-DEMO-003", urgency: "baja" }
];

export default function Home() {
  const [doctorDemo, setDoctorDemo] = useState(false);
  return <main className="app-shell"><header className="app-header"><div><p className="eyebrow">CLÍNICA MANTA · DEMO OPERATIVA</p><h1>{doctorDemo ? "Panel del doctor" : "Mi atención"}</h1></div>{doctorDemo ? <button className="quiet-button" onClick={() => setDoctorDemo(false)}>Volver al panel inicial</button> : null}</header>{doctorDemo ? <DoctorDemo /> : <PatientPanel openDoctorDemo={() => setDoctorDemo(true)} />}</main>;
}

function PatientPanel({ openDoctorDemo }: { openDoctorDemo: () => void }) {
  return <section className="patient-view"><p className="section-kicker">EXPEDIENTE DEMO · P-DEMO-001</p><h2>Hola, Ana.</h2><p className="lead">Esta es una vista inicial de demostración. No solicita credenciales ni consulta datos personales.</p><div className="patient-status"><article><span>Prioridad</span><strong className="priority alta">Alta</strong></article><article><span>Estado</span><strong>Pendiente de revisión</strong></article><article><span>Equipo asignado</span><strong>Dra. Lucía Rivera · Medicina familiar</strong></article></div><section className="demo-switch"><p className="section-kicker">VISTA DE DEMOSTRACIÓN</p><h3>Conoce el flujo médico</h3><p>Abre la lista de pacientes ficticios para cambiar niveles de urgencia. Los cambios no se guardan.</p><button onClick={openDoctorDemo}>Abrir demo del doctor</button></section><p className="privacy-note">Demo local: no se envían datos a Supabase ni se almacena información clínica real.</p></section>;
}

function DoctorDemo() {
  const [patients, setPatients] = useState(simulatedPatients);
  function changeUrgency(id: string, urgency: Urgency) { setPatients((current) => current.map((patient) => patient.id === id ? { ...patient, urgency } : patient)); }
  const orderedPatients = [...patients].sort((a, b) => ({ alta: 0, media: 1, baja: 2 }[a.urgency] - { alta: 0, media: 1, baja: 2 }[b.urgency]));
  return <><section className="doctor-summary"><p className="lead">Lista simulada para practicar la priorización. Los cambios existen solo mientras esta página permanezca abierta.</p><span>{patients.filter((patient) => patient.urgency === "alta").length} casos de prioridad alta</span></section><section className="patients-section"><div className="section-heading"><p className="section-kicker">PACIENTES SIMULADOS</p><h2>Lista de urgencia</h2></div><div className="patient-list">{orderedPatients.map((patient) => <article className="patient-row" key={patient.id}><div className="patient-ident"><span className={`priority-dot ${patient.urgency}`} /><div><strong>{patient.name}</strong><small>{patient.code} · Caso de demostración</small></div></div><strong className={`priority ${patient.urgency}`}>{urgencyLabels[patient.urgency]}</strong><label>Nivel de urgencia<select value={patient.urgency} onChange={(event) => changeUrgency(patient.id, event.target.value as Urgency)}>{Object.entries(urgencyLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></article>)}</div></section><p className="privacy-note">Demo local: ninguna modificación se envía a Supabase ni se guarda en la base de datos.</p></>;
}
