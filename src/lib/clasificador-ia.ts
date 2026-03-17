import type { GravedadKey } from "./candidatos";

interface ClasificacionIA {
  gravedad: GravedadKey;
  tipo: string;
  razon: string;
  confianza: number; // 0-1
}

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `Eres un clasificador de noticias políticas peruanas para el proyecto Versus Electoral Perú 2026.

Tu trabajo es analizar noticias sobre candidatos presidenciales y determinar:
1. Si el candidato es AFECTADO (le denuncian/investigan/sentencian) o si es ACTOR (él propone/opina/critica/denuncia a terceros)
2. La gravedad legal de la noticia

REGLAS CRÍTICAS:
- Si el candidato PROPONE algo, CRITICA a otros, OPINA sobre un tema, o DENUNCIA a terceros -> es LIMPIO (él actúa, no es afectado)
- Si el candidato ES denunciado, ES investigado, ES acusado, ES sentenciado -> clasificar por gravedad
- "López Aliaga denuncia corrupción" = LIMPIO (él denuncia)
- "López Aliaga es denunciado por corrupción" = MODERADO/DENUNCIA (a él lo denuncian)
- Planes de gobierno, promesas de campaña, propuestas = LIMPIO
- Debates, entrevistas donde da su opinión = LIMPIO

NIVELES DE GRAVEDAD (cuando el candidato ES el afectado):
- MUY_PELIGROSO: Sentencias firmes, condenas judiciales, pena privativa, inhabilitación judicial
- PELIGROSO: Acusación fiscal formal, juicio oral, prisión preventiva, orden de captura
- MODERADO: Denuncias penales en investigación, carpeta fiscal abierta, lavado de activos
- LEVE: Investigaciones preliminares, cuestionamientos éticos, controversias menores, observaciones de Contraloría
- LIMPIO: Sin denuncias en su contra, propuestas, opiniones, o el candidato es quien actúa

TIPOS:
- SENTENCIA: Condenas y sentencias judiciales
- ACUSACION: Acusaciones fiscales formales
- DENUNCIA: Denuncias penales en proceso
- INVESTIGACION: Investigaciones preliminares y administrativas
- LIMPIO: Sin hallazgos negativos contra el candidato

Responde SOLO en formato JSON válido, sin markdown:
{"gravedad":"NIVEL","tipo":"TIPO","razon":"explicación breve de máximo 50 palabras","confianza":0.95}`;

const VALID_GRAVEDAD: GravedadKey[] = ["MUY_PELIGROSO", "PELIGROSO", "MODERADO", "LEVE", "LIMPIO"];
const VALID_TIPO = ["SENTENCIA", "ACUSACION", "DENUNCIA", "INVESTIGACION", "LIMPIO"];

let iaDeshabilitadaPorAuth = false;
let logAuthEmitido = false;

function getOpenAIKey(): string | null {
  if (iaDeshabilitadaPorAuth) return null;
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  return apiKey ? apiKey : null;
}

function parseClasificacion(text: string): ClasificacionIA | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  const parsed = JSON.parse(jsonMatch[0]);
  if (!VALID_GRAVEDAD.includes(parsed.gravedad)) return null;
  if (!VALID_TIPO.includes(parsed.tipo)) return null;

  return {
    gravedad: parsed.gravedad,
    tipo: parsed.tipo,
    razon: parsed.razon || "",
    confianza: typeof parsed.confianza === "number" ? parsed.confianza : 0.5,
  };
}

async function clasificarConOpenAI(prompt: string, apiKey: string): Promise<string | null> {
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0,
      max_tokens: 220,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    if (response.status === 401 || response.status === 403) {
      iaDeshabilitadaPorAuth = true;
      if (!logAuthEmitido) {
        console.error(`[IA] OpenAI auth inválida (${response.status}). Se desactiva IA para esta ejecución y se usa fallback por patrones.`);
        logAuthEmitido = true;
      }
      return null;
    }
    throw new Error(`OpenAI HTTP ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : null;
}

export async function clasificarConIA(
  titulo: string,
  descripcion: string,
  nombreCandidato: string
): Promise<ClasificacionIA | null> {
  const apiKey = getOpenAIKey();
  if (!apiKey) return null;

  const prompt = `Clasifica esta noticia sobre el candidato "${nombreCandidato}":

TÍTULO: ${titulo}
DESCRIPCIÓN: ${descripcion || "(sin descripción)"}

El candidato es AFECTADO por la noticia o es él quien ACTÚA/OPINA? Clasifica la gravedad.`;

  try {
    const text = await clasificarConOpenAI(prompt, apiKey);
    if (!text) return null;
    return parseClasificacion(text);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[IA] Error clasificando con OpenAI: ${msg}`);
    return null;
  }
}

/**
 * Clasifica un lote de noticias con IA, con rate limiting.
 * Procesa en paralelo con un máximo de concurrencia.
 */
export async function clasificarLoteConIA(
  noticias: Array<{ titulo: string; descripcion: string; candidatoNombre: string }>,
  concurrencia = 5
): Promise<Map<number, ClasificacionIA>> {
  const resultados = new Map<number, ClasificacionIA>();

  if (!process.env.OPENAI_API_KEY) {
    console.log("[IA] No hay OPENAI_API_KEY configurada, saltando clasificación IA");
    return resultados;
  }

  console.log(`[IA] Clasificando ${noticias.length} noticias con IA (OpenAI, concurrencia: ${concurrencia})...`);

  for (let i = 0; i < noticias.length; i += concurrencia) {
    const batch = noticias.slice(i, i + concurrencia);
    const promises = batch.map(async (n, j) => {
      const idx = i + j;
      const result = await clasificarConIA(n.titulo, n.descripcion, n.candidatoNombre);
      if (result) resultados.set(idx, result);
    });

    await Promise.allSettled(promises);

    // Small delay between batches to respect rate limits
    if (i + concurrencia < noticias.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log(`[IA] Clasificación completada: ${resultados.size}/${noticias.length} exitosas`);
  return resultados;
}
