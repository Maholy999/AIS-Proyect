# Diseño MVP — Triaje Manta

Usuario: paciente o familiar que necesita una primera orientación, o ser priorizado sin esperar una respuesta manual. Problema: consultas repetitivas sin trazabilidad ni priorización. El MVP elimina la gestión de citas real y la autenticación para la demo; conserva la categoría `citas` únicamente como clasificación.

Flujo (menos de tres clics): (1) escribir o seleccionar una consulta, (2) analizar, (3) ver una respuesta fundamentada con cita o un escalamiento con motivo. Categorías: síntomas, medicamentos, citas y resultados. La decisión crítica es siempre conservadora: señales de alarma o evidencia insuficiente nunca producen una respuesta clínica.

Orden de construcción: migración pgvector y tablas restringidas, indexador de PDF oficial, endpoint que clasifica/recupera/redacta, interfaz de una pantalla, verificaciones y despliegue. El momento de valor es el resultado visible: fuente consultada o caso priorizado.

Se escala cuando el clasificador detecta dolor torácico intenso, falta de aire, desmayo, convulsiones, signos neurológicos agudos, sangrado persistente, sobredosis o riesgo suicida; también cuando ningún fragmento supera similitud coseno de 0,78, o cuando el modelo no puede sostener su respuesta solo con el contexto recuperado.
