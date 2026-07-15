import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import pdf from "pdf-parse";

const [pdfUrl, title] = process.argv.slice(2);
if (!pdfUrl || !title) throw new Error("Uso: npm run ingest -- <url-del-pdf> <titulo-de-la-fuente>");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
if (!url || !key || !openaiKey) throw new Error("Configura NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y OPENAI_API_KEY.");

const response = await fetch(pdfUrl);
if (!response.ok) throw new Error(`No se pudo descargar el PDF: ${response.status}`);
const parsed = await pdf(Buffer.from(await response.arrayBuffer()));
const chunks: string[] = parsed.text.replace(/\s+/g, " ").match(/.{80,1100}(?:\s|$)/g) ?? [];
if (!chunks.length) throw new Error("El PDF no produjo texto indexable.");
const openai = new OpenAI({ apiKey: openaiKey });
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
for (const batch of Array.from({ length: Math.ceil(chunks.length / 40) }, (_, index) => chunks.slice(index * 40, index * 40 + 40))) {
  const embeddings = await openai.embeddings.create({ model: "text-embedding-3-small", input: batch, dimensions: 1536 });
  const rows = batch.map((content, index) => ({ source_title: title, source_url: pdfUrl, page_number: null, content, embedding: embeddings.data[index].embedding }));
  const { error } = await supabase.from("medical_chunks").insert(rows);
  if (error) throw error;
  console.log(`Indexados ${Math.min(chunks.length, (batch.length + Math.floor(chunks.indexOf(batch[0]) / 40) * 40))}/${chunks.length} fragmentos`);
}
console.log(`Listo: ${chunks.length} fragmentos indexados desde ${title}.`);
