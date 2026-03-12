import type { GravedadKey } from "./candidatos";

interface ClasificacionResult {
  gravedad: GravedadKey;
  tipo: string;
}

// =====================================================
// VERBOS DONDE EL CANDIDATO ES QUIEN ACTÚA (propone, opina, critica)
// Solo se activan si el candidato aparece ANTES del verbo en el título
// =====================================================

const VERBOS_CANDIDATO_ACTUA = [
  // Propone/pide
  "propone", "propuso", "plantea", "planteó",
  "pide", "pidió", "exige", "exigió",
  "promete", "prometió", "ofrece", "ofreció",
  "anuncia", "anunció", "impulsa", "impulsó",
  "presenta proyecto", "presentó proyecto",
  // Opina/critica
  "critica", "criticó", "rechaza", "rechazó",
  "advierte", "advirtió", "señala", "señaló",
  "alerta", "alertó", "defiende", "defendió",
  "respalda", "respaldó",
  "se compromete", "se comprometió",
];

// Frases donde "condena/denuncia" es ACCIÓN del candidato (él denuncia a terceros)
// Requieren complemento: "condena EL/LA/LOS", "denuncia QUE/EL/LA"
const DENUNCIA_ACTIVA = [
  "condena el", "condenó el", "condena la", "condenó la",
  "condena los", "condenó los", "condena las", "condenó las",
  "denuncia que", "denunció que", "denuncia la", "denunció la",
  "denuncia el", "denunció el", "denuncia los", "denunció los",
  "denuncia a", "denunció a",
];

// Contexto de propuesta/plan (no importa dirección)
const CONTEXTO_PROPUESTA = [
  "plan de gobierno", "propuesta de gobierno", "propuesta electoral",
  "debate presidencial", "promesa de campaña", "promesa electoral",
  "durante el debate", "en el debate", "en su plan", "según su plan",
  "proyecto de ley",
  // Habla sobre terceros genéricos
  "contra el crimen", "contra la delincuencia", "contra la corrupción",
  "contra la inseguridad", "lucha contra", "combatir",
  "mano dura", "tolerancia cero", "pena de muerte",
  "para violadores", "para sicarios", "para corruptos",
  "para delincuentes", "para criminales", "para narcotraficantes",
  "para funcionarios corruptos", "para terroristas",
];

// =====================================================
// VERBOS/FRASES DONDE EL CANDIDATO ES EL AFECTADO
// Cuestionan A él, lo investigan, lo denuncian, etc.
// =====================================================

const VERBOS_CANDIDATO_AFECTADO = [
  // Pasiva directa
  "fue sentenciado", "fue condenado", "fue acusado", "fue denunciado",
  "fue detenido", "fue capturado", "fue inhabilitado", "fue investigado",
  "fue procesado", "fue arrestado", "fue requisitoriado",
  "fue hallado culpable", "fue encontrado culpable",
  "fue sancionado", "fue suspendido", "fue vacado",
  "fue sentenciada", "fue condenada", "fue acusada", "fue denunciada",
  "fue detenida", "fue capturada", "fue inhabilitada", "fue investigada",
  // Tercera persona
  "lo sentenciaron", "lo condenaron", "lo acusaron", "lo denunciaron",
  "lo detuvieron", "lo capturaron", "lo investigan", "lo procesaron",
  "la sentenciaron", "la condenaron", "la acusaron", "la denunciaron",
  "la detuvieron", "la capturaron", "la investigan", "la procesaron",
  // Sujeto directo con preposiciones
  "acusado de", "acusada de", "investigado por", "investigada por",
  "denunciado por", "denunciada por", "procesado por", "procesada por",
  "sentenciado a", "sentenciada a", "condenado a", "condenada a",
  "imputado", "imputada", "se le imputa", "se le acusa", "se le investiga",
  // Algo le pasa
  "enfrenta juicio", "enfrenta proceso", "enfrenta cargos",
  "enfrenta acusación", "enfrenta denuncia", "enfrenta investigación",
  "afronta juicio", "afronta proceso", "afronta cargos",
  "tiene orden de captura", "tiene proceso abierto",
  "tiene sentencia", "tiene condena", "tiene denuncia",
  "recibió sentencia", "recibió condena",
  "en su contra",
  // Fiscalía/PJ actúan sobre él
  "fiscalía lo acusa", "fiscalía la acusa",
  "fiscalía pide prisión para", "fiscalía solicita",
  "juez dictó prisión", "juez ordenó detención",
  "PJ dictó sentencia", "poder judicial sentenció",
];

// Terceros cuestionan/investigan AL candidato (dirección inversa)
// "cuestionan a X", "investigan a X", "denuncian a X"
const CUESTIONAN_AL_CANDIDATO = [
  "cuestionan a", "cuestionaron a", "cuestionado por", "cuestionada por",
  "investigan a", "investigaron a", "investigan al", "investigan la gestión",
  "denuncian a", "denunciaron a",
  "acusan a", "acusaron a",
  "señalan a", "señalaron a",
  "critican a", "criticaron a",
  "observan a", "observaron a", "observan irregularidades",
  "hallan irregularidades", "encuentran irregularidades",
  "piden investigar a", "piden investigación contra",
  "contraloría advierte", "contraloría observa", "contraloría detecta",
  "fiscalía investiga", "fiscalía abre",
  "comisión investiga", "congreso investiga",
];

// =====================================================
// PATRONES LEGALES POR GRAVEDAD
// =====================================================

const PATRONES_SENTENCIA = [
  "sentencia", "condenado", "condena", "culpable", "pena privativa",
  "sentenciado", "prisión efectiva", "inhabilitado", "inhabilitación",
  "reos", "penal firme", "prision efectiva", "pena de cárcel",
  "pena de carcel", "encontrado culpable", "declarado culpable",
  "sentencia condenatoria", "reparación civil", "reparacion civil",
  "cadena perpetua", "embargo judicial", "incautación", "decomiso",
  "sentencia judicial", "fallo condenatorio",
];

const PATRONES_ACUSACION = [
  "acusación fiscal", "acusacion fiscal", "acusado", "fiscal acusa",
  "pliego acusatorio", "juicio oral", "proceso penal",
  "apertura de instrucción", "apertura de instruccion",
  "orden de captura", "requisitoriado", "prófugo", "profugo",
  "pedido de prisión", "pedido de prision", "prisión preventiva",
  "prision preventiva", "detención preliminar", "detencion preliminar",
  "arraigo", "impedimento de salida", "comparecencia restringida",
  "acusación constitucional", "acusacion constitucional",
  "desafuero", "antejuicio", "juicio político", "juicio politico",
  "extradición", "extradicion", "capturado", "detenido",
];

const PATRONES_DENUNCIA = [
  "denuncia", "denunciado", "investigación fiscal", "investigacion fiscal",
  "investigación preliminar", "investigacion preliminar",
  "fiscalía investiga", "fiscalia investiga", "carpeta fiscal",
  "diligencias", "lavado de activos", "organización criminal",
  "organizacion criminal", "corrupción", "corrupcion",
  "colusión", "colusion", "peculado", "malversación", "malversacion",
  "enriquecimiento ilícito", "enriquecimiento ilicito",
  "tráfico de influencias", "trafico de influencias",
  "soborno", "cohecho", "concusión", "concusion",
  "nepotismo", "conflicto de intereses", "conflicto de interés",
  "fraude", "estafa", "apropiación ilícita", "apropiacion ilicita",
  "financiamiento ilegal", "dinero ilícito", "dinero ilicito",
  "narcotrá", "narcotráfico", "narcotrafico", "testaferro",
  "empresa fantasma", "licitación irregular", "licitacion irregular",
  "obra fantasma", "sobrecosto", "sobrevaluación", "sobrevaluacion",
  "denuncia penal", "denuncia constitucional",
  "plagio", "plagió", "plagiar", "tesis plagiada",
];

const PATRONES_INVESTIGACION = [
  "investigación", "investigacion", "investigan", "indagan",
  "cuestionan", "cuestionado", "cuestionada",
  "vinculado", "vinculada", "presunto", "presunta",
  "sospechoso", "sospechosa", "irregular", "irregularidades",
  "contraloría", "contraloria", "auditoría", "auditoria",
  "observado", "observaciones", "informe de control",
  "hallazgos", "responsabilidad", "procedimiento administrativo",
  "sanción administrativa", "sancion administrativa",
  "amonestación", "amonestacion", "suspensión", "suspension",
  "vacancia", "revocatoria", "proceso disciplinario",
  "comisión de ética", "comision de etica",
  "procuraduría", "procuraduria", "fiscalización", "fiscalizacion",
  "superintendencia",
  "controversia", "escándalo", "escandalo", "polémica", "polemica",
  "no puede justificar", "no justifica", "sin sustento",
  "sobrecosto", "sobrevaluación", "sobrevaluacion",
];

const PATRONES_POLITICA = [
  "candidato", "candidata", "candidatura", "postulante",
  "elecciones", "electoral", "campaña", "campana",
  "partido", "congresista", "congreso", "parlamento",
  "ministro", "ministra", "funcionario", "funcionaria",
  "alcalde", "alcaldesa", "gobernador", "gobernadora",
  "plancha presidencial", "vicepresidente", "fórmula presidencial",
  "formula presidencial", "militante", "dirigente",
  "secretario general", "vocero", "vocera",
  "hoja de vida", "declaración jurada", "declaracion jurada",
  "JNE", "ONPE", "jurado nacional",
  "tacha", "impugnación", "impugnacion", "exclusión", "exclusion",
  "inscripción", "inscripcion",
];

// =====================================================
// FUNCIONES
// =====================================================

function contarCoincidencias(texto: string, patrones: string[]): number {
  const textoLower = texto.toLowerCase();
  return patrones.reduce((count, patron) => {
    return count + (textoLower.includes(patron.toLowerCase()) ? 1 : 0);
  }, 0);
}

/**
 * Analiza la DIRECCIÓN de la acción:
 * - retorna "propuesta" si el candidato es quien actúa/opina/propone
 * - retorna "afectado" si el candidato es el sujeto de la acción legal
 * - retorna "ambiguo" si no se puede determinar
 */
function analizarDireccion(titulo: string, descripcion: string): "propuesta" | "afectado" | "ambiguo" {
  const texto = `${titulo} ${descripcion}`.toLowerCase();
  const tituloLower = titulo.toLowerCase();

  // Prioridad 1: ¿Hay confirmación directa de que el candidato es afectado?
  const scoreAfectado = contarCoincidencias(texto, VERBOS_CANDIDATO_AFECTADO);
  const scoreCuestionanA = contarCoincidencias(texto, CUESTIONAN_AL_CANDIDATO);

  if (scoreAfectado >= 1 || scoreCuestionanA >= 1) {
    return "afectado";
  }

  // Prioridad 2: ¿Es contexto de propuesta/plan de gobierno?
  const scoreContextoPropuesta = contarCoincidencias(texto, CONTEXTO_PROPUESTA);
  if (scoreContextoPropuesta >= 1) {
    return "propuesta";
  }

  // Prioridad 3: ¿El candidato es quien actúa? (verbos de acción en título)
  // Solo verificar en el TÍTULO porque es donde está la estructura sujeto-verbo
  const scoreCandidatoActua = contarCoincidencias(tituloLower, VERBOS_CANDIDATO_ACTUA);
  const scoreDenunciaActiva = contarCoincidencias(tituloLower, DENUNCIA_ACTIVA);

  if (scoreCandidatoActua >= 1 || scoreDenunciaActiva >= 1) {
    return "propuesta";
  }

  return "ambiguo";
}

export function clasificarNoticia(titulo: string, descripcion: string): ClasificacionResult {
  const texto = `${titulo} ${descripcion}`;

  const direccion = analizarDireccion(titulo, descripcion);

  // Si es claramente una propuesta/declaración del candidato, es LIMPIO
  if (direccion === "propuesta") {
    return { gravedad: "LIMPIO", tipo: "LIMPIO" };
  }

  // Calcular scores legales
  const scoreSentencia = contarCoincidencias(texto, PATRONES_SENTENCIA);
  const scoreAcusacion = contarCoincidencias(texto, PATRONES_ACUSACION);
  const scoreDenuncia = contarCoincidencias(texto, PATRONES_DENUNCIA);
  const scoreInvestigacion = contarCoincidencias(texto, PATRONES_INVESTIGACION);

  const esAfectadoConfirmado = direccion === "afectado";

  // Si es AFECTADO confirmado: clasificar con máxima gravedad
  if (esAfectadoConfirmado) {
    if (scoreSentencia >= 1) return { gravedad: "MUY_PELIGROSO", tipo: "SENTENCIA" };
    if (scoreAcusacion >= 1) return { gravedad: "PELIGROSO", tipo: "ACUSACION" };
    if (scoreDenuncia >= 1) return { gravedad: "MODERADO", tipo: "DENUNCIA" };
    if (scoreInvestigacion >= 1) return { gravedad: "LEVE", tipo: "INVESTIGACION" };
  }

  // Si es AMBIGUO: clasificar pero bajando un nivel de gravedad como precaución
  // (no sabemos con certeza si el candidato es el afectado)
  if (scoreSentencia >= 2) return { gravedad: "MUY_PELIGROSO", tipo: "SENTENCIA" };
  if (scoreSentencia >= 1) return { gravedad: "PELIGROSO", tipo: "ACUSACION" };
  if (scoreAcusacion >= 2) return { gravedad: "PELIGROSO", tipo: "ACUSACION" };
  if (scoreAcusacion >= 1) return { gravedad: "MODERADO", tipo: "DENUNCIA" };
  if (scoreDenuncia >= 1) return { gravedad: "MODERADO", tipo: "DENUNCIA" };
  if (scoreInvestigacion >= 1) return { gravedad: "LEVE", tipo: "INVESTIGACION" };

  return { gravedad: "LIMPIO", tipo: "LIMPIO" };
}

export function esNoticiaRelevante(titulo: string, descripcion: string): boolean {
  const texto = `${titulo} ${descripcion}`;
  const scoreLegal =
    contarCoincidencias(texto, PATRONES_SENTENCIA) +
    contarCoincidencias(texto, PATRONES_ACUSACION) +
    contarCoincidencias(texto, PATRONES_DENUNCIA) +
    contarCoincidencias(texto, PATRONES_INVESTIGACION);
  const scorePolitica = contarCoincidencias(texto, PATRONES_POLITICA);

  return scoreLegal >= 1 || scorePolitica >= 1;
}
