# Acceso y paneles clínicos demo

Supabase Auth autentica cuatro cuentas demo mediante correo y una contraseña temporal compartida. Una tabla `profiles`, vinculada a `auth.users`, determina el rol de cada cuenta sin usar metadatos editables para autorizar.

El servidor valida el token de sesión con Supabase antes de cada operación. Los pacientes reciben únicamente sus datos, prioridad, estado y equipo asignado. El médico recibe la lista completa, puede modificar prioridad y estado, y puede crear especialidades, profesionales y asignaciones. Las tablas nuevas mantienen RLS activado y no se exponen directamente a usuarios anónimos o autenticados; las rutas del servidor aplican la comprobación de rol.

Las cuentas no se guardan en la migración. `scripts/seed-demo-users.ts` las crea usando la clave de servicio y `DEMO_USERS_PASSWORD`, ambas fuera de Git. Las cuentas son: `doctor.demo@clinicamanta.test`, `paciente.ana@clinicamanta.test`, `paciente.bruno@clinicamanta.test` y `paciente.carla@clinicamanta.test`.
