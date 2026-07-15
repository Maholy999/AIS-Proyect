# Triaje Manta

MVP de orientación clínica: clasifica una consulta, detecta banderas rojas, busca PDFs públicos indexados con pgvector y responde solo con una fuente verificable. No usa ni almacena datos de pacientes reales.

## Inicio rápido

1. Crea un proyecto de Supabase y ejecuta, en orden, las dos migraciones de `supabase/migrations/` en su SQL Editor. La segunda crea contexto de clínica y un paciente ficticio de demostración.
2. Copia `.env.example` como `.env.local` y completa las cuatro variables. `DEEPSEEK_API_KEY` genera las respuestas clínicas. `OPENAI_API_KEY` solo genera embeddings de pgvector, porque DeepSeek no ofrece un endpoint de embeddings. Nunca expongas las claves de servidor al navegador.
3. Indexa un PDF público: `npm run ingest -- "https://…/documento.pdf" "Nombre oficial del documento"`.
4. Ejecuta `npm run dev`.

## Reglas de escalamiento

- Urgencia alta: dolor torácico intenso, dificultad respiratoria, desmayo, convulsión, signos de ACV, sangrado que no cede, posible sobredosis o riesgo suicida.
- Confianza insuficiente: ningún fragmento supera 0,78 de similitud coseno.
- Contexto insuficiente: el modelo no puede responder solo con los fragmentos recuperados.

## Datos que se registran

Cada consulta puede relacionarse con paciente de demostración, clínica, sede, sala, especialidad, profesional y cita. El resultado se conserva en `consultations`; cada caso escalado además crea una fila en `escalations` con motivo y estado. Las tablas tienen RLS activado y solo el servidor (clave `service_role`) puede acceder a ellas. No se permite almacenar pacientes reales en esta demo.

## Demo segura

- Respuesta RAG: usa una consulta cubierta explícitamente por el PDF que indexaste.
- Escalamiento: `Mi papá tiene dolor fuerte en el pecho y le falta el aire.`
