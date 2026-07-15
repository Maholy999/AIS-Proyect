import { getAdminClient } from "../lib/supabase";

const password = process.env.DEMO_USERS_PASSWORD;
if (!password || password.length < 8) throw new Error("Define DEMO_USERS_PASSWORD con al menos 8 caracteres en .env.local.");

const accounts = [
  { email: "doctor.demo@clinicamanta.test", name: "Dra. Lucía Rivera", role: "doctor" as const },
  { email: "paciente.ana@clinicamanta.test", name: "Ana Torres", code: "P-DEMO-001", priority: "alta", status: "Pendiente de revisión" },
  { email: "paciente.bruno@clinicamanta.test", name: "Bruno Mena", code: "P-DEMO-002", priority: "media", status: "En atención" },
  { email: "paciente.carla@clinicamanta.test", name: "Carla Vega", code: "P-DEMO-003", priority: "baja", status: "En seguimiento" }
];

async function ensureUser(email: string, name: string) {
  const supabase = getAdminClient();
  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  const existing = listed.users.find((user) => user.email === email);
  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true, user_metadata: { display_name: name } });
    if (error || !data.user) throw error ?? new Error("No se pudo actualizar la cuenta demo.");
    return data.user;
  }
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: name } });
  if (error || !data.user) throw error ?? new Error("No se pudo crear la cuenta demo.");
  return data.user;
}

async function main() {
  const supabase = getAdminClient();
  const { data: location, error: locationError } = await supabase.from("locations").select("id").order("name").limit(1).single();
  if (locationError || !location) throw locationError ?? new Error("Ejecuta primero las migraciones clínicas.");
  const { data: specialty, error: specialtyError } = await supabase.from("specialties").upsert({ name: "Medicina familiar" }, { onConflict: "name" }).select("id").single();
  if (specialtyError || !specialty) throw specialtyError;
  const { data: provider, error: providerError } = await supabase.from("providers").upsert({ display_name: "Dra. Lucía Rivera", specialty_id: specialty.id, location_id: location.id }, { onConflict: "display_name,location_id" }).select("id").single();
  if (providerError || !provider) throw providerError;

  const doctor = await ensureUser(accounts[0].email, accounts[0].name);
  const { error: doctorProfileError } = await supabase.from("profiles").upsert({ id: doctor.id, role: "doctor", display_name: accounts[0].name, provider_id: provider.id }, { onConflict: "id" });
  if (doctorProfileError) throw doctorProfileError;

  for (const account of accounts.slice(1)) {
    const { data: patient, error: patientError } = await supabase.from("patients").upsert({ demo_code: account.code, display_name: account.name, priority: account.priority, care_status: account.status }, { onConflict: "demo_code" }).select("id").single();
    if (patientError || !patient) throw patientError;
    const user = await ensureUser(account.email, account.name);
    const { error: profileError } = await supabase.from("profiles").upsert({ id: user.id, role: "patient", display_name: account.name, patient_id: patient.id }, { onConflict: "id" });
    if (profileError) throw profileError;
    const { error: assignmentError } = await supabase.from("patient_assignments").upsert({ patient_id: patient.id, provider_id: provider.id }, { onConflict: "patient_id,provider_id" });
    if (assignmentError) throw assignmentError;
  }
  console.log("Cuentas demo creadas o actualizadas.");
}

main().catch((error) => { console.error(error); process.exit(1); });
