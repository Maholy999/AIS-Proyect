export type Category = "síntomas" | "medicamentos" | "citas" | "resultados";
export type Urgency = "baja" | "media" | "alta";

const urgentPattern = /dolor (fuerte|intenso).{0,35}(pecho|torax)|falta de aire|dificultad para respirar|no (puede|puedo) respirar|desmayo|inconsciente|convulsi|debilidad.{0,25}(cara|brazo)|habla.{0,25}(dificultad|arrastrada)|sangrado.{0,30}(no para|abundante)|pensamientos? (suicidas?|de suicidio)|sobredosis/i;
const medicationPattern = /medicamento|pastilla|dosis|antibi[oó]tico|ibuprofeno|paracetamol|receta|efecto secundario/i;
const appointmentPattern = /cita|agendar|turno|consulta.{0,20}(doctor|m[eé]dico)|horario/i;
const resultsPattern = /resultado|examen|an[aá]lisis|laboratorio|radiograf[ií]a|ecograf[ií]a/i;

export function classify(query: string): { category: Category; urgency: Urgency; escalationReason?: string } {
  if (urgentPattern.test(query)) return { category: "síntomas", urgency: "alta", escalationReason: "La consulta contiene una señal de alarma que requiere valoración clínica inmediata." };
  if (medicationPattern.test(query)) return { category: "medicamentos", urgency: "media" };
  if (appointmentPattern.test(query)) return { category: "citas", urgency: "baja" };
  if (resultsPattern.test(query)) return { category: "resultados", urgency: "media" };
  return { category: "síntomas", urgency: "media" };
}
