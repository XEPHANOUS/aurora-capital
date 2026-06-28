import type { AgentType } from '@/lib/types';
import type { ChatAgentProfile, ChatMode } from '@/lib/chat/types';
import type { AgentReply } from '@/lib/chat/types';
import type { ChatAgentId } from '@/lib/chat/types';
import { getSystemContext, formatCtxCurrency, formatCtxPercent } from '@/lib/chat/systemContext';

export interface BuildResponseContext {
  analystReports?: AgentReply[];
  riskReport?: AgentReply;
  supervisorSummary?: AgentReply;
  survivalReport?: AgentReply;
  auditorValidation?: AgentReply;
  profileLabel?: string;
  activeWeights?: Partial<Record<AgentType, number>>;
  weightedAnalystScore?: number;
  weightedFinalScore?: number;
}

export interface MockAgentOutput {
  content: string;
  confidenceScore: number;
}

// ---------------------------------------------------------------------------
// Intent classification
// ---------------------------------------------------------------------------

export type ChatIntent = 'buy_sell' | 'system_status' | 'risk_profile' | 'market_analysis' | 'general';

const INTENT_PATTERNS: Array<{ intent: ChatIntent; pattern: RegExp }> = [
  {
    intent: 'buy_sell',
    pattern: /\b(comprar|vender|compra|venta|abrir|cerrar|posicion|trade|operar|entrada|salida|long|short|btc|eth|sol|bnb|xrp|nvda|aapl|spy|usdt)\b/i,
  },
  {
    intent: 'system_status',
    pattern: /\b(estado|status|sistema|salud|como esta|funcionando|activo|reporta|informe|diagnostico)\b/i,
  },
  {
    intent: 'risk_profile',
    pattern: /\b(perfil|conservador|agresivo|balanceado|supervivencia primero|cambiar perfil|ajustar riesgo|configurar riesgo)\b/i,
  },
  {
    intent: 'market_analysis',
    pattern: /\b(analiza|analisis|mercado|tendencia|contexto|situacion|panorama|perspectiva|evalua|evaluar|debemos|deberia)\b/i,
  },
];

export function classifyIntent(prompt: string): ChatIntent {
  for (const { intent, pattern } of INTENT_PATTERNS) {
    if (pattern.test(prompt)) return intent;
  }
  return 'general';
}

function extractAsset(prompt: string): string | null {
  const m = prompt.match(/\b(BTC|ETH|SOL|BNB|XRP|NVDA|AAPL|SPY|MSFT|ADA|DOT|AVAX|USDT)\b/i);
  return m ? m[0].toUpperCase() : null;
}

// ---------------------------------------------------------------------------
// Response matrix
// ---------------------------------------------------------------------------

const RESPONSES: Record<ChatAgentId, Record<ChatIntent, string[]>> = {
  news: {
    buy_sell: [
      'Sentimiento en redes y medios es positivo con sesgo alcista para el activo.',
      'El flujo de noticias reciente muestra narrativa constructiva para este movimiento.',
      'Hay cobertura mediatica creciente que podria amplificar el desplazamiento.',
    ],
    system_status: [
      'La narrativa global mantiene sesgo risk-on. No hay eventos de ruptura inmediatos.',
      'No hay eventos macro de alto impacto en el radar informativo a corto plazo.',
      'El sentimiento agregado de las fuentes principales es neutral a positivo.',
    ],
    risk_profile: [
      'El contexto informativo no anticipa volatilidad extrema a corto plazo.',
      'La narrativa macro es compatible con un perfil moderado o moderadamente agresivo.',
      'No se detectan catalizadores que justifiquen un cambio defensivo urgente.',
    ],
    market_analysis: [
      'El sentimiento agregado muestra sesgo alcista moderado en las ultimas 48h.',
      'Los indicadores de narrativa apuntan a continuidad del trend dominante.',
      'Eventos geopoliticos pendientes podrian introducir volatilidad puntual.',
    ],
    general: [
      'No hay novedades criticas en el flujo de noticias en este momento.',
      'El sentimiento de mercado se mantiene neutral con ligero sesgo positivo.',
      'El contexto informativo no presenta alertas relevantes en el ciclo actual.',
    ],
  },

  technical: {
    buy_sell: [
      'Estructura tecnica con momentum alcista y soporte clave respetado.',
      'Se observa ruptura de resistencia con volumen confirmatorio. Señal valida.',
      'RSI en zona de momentum positivo. MACD señala continuidad de tendencia.',
    ],
    system_status: [
      'La estructura tecnica del mercado mantiene tendencia primaria alcista.',
      'Los indices principales respetan soportes y mantienen estructura valida.',
      'El momentum del mercado es positivo sin divergencias criticas detectadas.',
    ],
    risk_profile: [
      'La volatilidad implicita actual es compatible con un perfil moderado o agresivo.',
      'El regimen de baja volatilidad favorece size mas amplio para perfil agresivo.',
      'Los rangos de precio actuales requieren stop mas amplio en perfil conservador.',
    ],
    market_analysis: [
      'Tendencia alcista con soportes respetados. Sin divergencias en indicadores clave.',
      'El momentum del mercado confirma la tendencia sin señales de agotamiento.',
      'Niveles de soporte y resistencia bien definidos. Estructura favorable para operar.',
    ],
    general: [
      'No hay señales tecnicas de alerta en el seguimiento actual.',
      'La estructura de precios se mantiene dentro de parametros normales.',
      'Los indicadores tecnicos no presentan divergencias relevantes en este momento.',
    ],
  },

  risk: {
    buy_sell: [
      'Volatilidad dentro de rangos tolerables. Size maximo recomendado: 3% del capital.',
      'El riesgo es gestionable. Definir stop-loss antes de abrir la posicion.',
      'Exposicion maxima para este activo: 5% del portfolio total. No superar.',
    ],
    system_status: [
      'El perfil de riesgo del sistema esta dentro de parametros configurados.',
      'La exposicion agregada no supera los limites de concentracion establecidos.',
      'No hay alertas de riesgo activas. El sistema opera con margen de seguridad.',
    ],
    risk_profile: [
      'Perfil agresivo requiere aumentar el umbral de volatilidad y revisar stops.',
      'Perfil conservador implica reducir size maximo al 2% y perdida diaria al 8%.',
      'El cambio de perfil debe ir acompañado de recalibracion del position sizing.',
    ],
    market_analysis: [
      'El riesgo sistematico del mercado se mantiene en niveles moderados.',
      'La correlacion entre activos sugiere diversificacion efectiva del portfolio.',
      'No se detectan señales de stress sistematico en los indicadores de riesgo.',
    ],
    general: [
      'Los parametros de riesgo del sistema estan dentro de limites normales.',
      'No hay alertas de riesgo activas. Control de exposicion operativo.',
      'El riesgo agregado del portfolio es conforme a los limites configurados.',
    ],
  },

  survival: {
    buy_sell: [
      'La operacion no compromete la reserva de supervivencia. Proceder con control.',
      'Con el size propuesto, el colchon de capital base permanece protegido.',
      'ALERTA: el importe propuesto se acerca al limite de reserva. Reducir size.',
    ],
    system_status: [
      'La reserva de supervivencia esta intacta y por encima del umbral critico.',
      'El capital minimo de supervivencia se mantiene protegido. Estado optimo.',
      'No hay riesgo de activacion del veto de supervivencia en condiciones actuales.',
    ],
    risk_profile: [
      'Cualquier perfil de riesgo debe mantener la reserva de supervivencia inviolable.',
      'El cambio de perfil no puede reducir el porcentaje de reserva configurado.',
      'Un perfil mas agresivo no justifica reducir el colchon de supervivencia.',
    ],
    market_analysis: [
      'Las condiciones actuales no requieren activacion del mecanismo de veto.',
      'Monitoreo activo: no hay señales de riesgo critico para el capital base.',
      'El mercado permite operar sin comprometer la reserva de seguridad.',
    ],
    general: [
      'La reserva de supervivencia permanece protegida. Sin alertas activas.',
      'Los mecanismos de veto estan activos y en modo de vigilancia normal.',
      'No hay condiciones que activen el protocolo de proteccion de capital.',
    ],
  },

  supervisor: {
    buy_sell: [
      'Coordinacion entre agentes coherente para esta operacion. Sin conflictos criticos.',
      'El flujo de decision esta alineado. No se detectan señales contradictorias.',
      'Pipeline operativo validado. La operacion puede proceder por proceso estandar.',
    ],
    system_status: [
      'Todos los agentes activos y coordinados. Pipeline de decision sin conflictos.',
      'La coherencia operativa del sistema es alta. Sin anomalias detectadas.',
      'El flujo multiagente opera dentro de los parametros de coordinacion normales.',
    ],
    risk_profile: [
      'El cambio de perfil requiere reconfigurar los pesos de influencia de agentes.',
      'La transicion de perfil puede ejecutarse sin interrumpir el flujo operativo.',
      'Recomiendo validar el nuevo perfil en sandbox antes de activarlo en produccion.',
    ],
    market_analysis: [
      'La coordinacion multiagente para el analisis es coherente. Sin conflictos.',
      'No se detectan señales contradictorias entre los agentes analizadores.',
      'El pipeline de analisis funciona dentro de los parametros operativos esperados.',
    ],
    general: [
      'El sistema operativo funciona con normalidad. Sin conflictos activos.',
      'No hay conflictos entre agentes detectados en el ciclo actual.',
      'La coordinacion del pipeline de decision es optima.',
    ],
  },

  auditor: {
    buy_sell: [
      'La operacion cumple los criterios de control. Trazabilidad completa disponible.',
      'El proceso de decision es auditable y conforme a la politica vigente.',
      'No se detectan desviaciones del proceso en la operacion propuesta.',
    ],
    system_status: [
      'El sistema cumple con todos los controles de compliance activos.',
      'La auditoria continua no muestra desviaciones del proceso en este ciclo.',
      'La calidad de las decisiones recientes esta dentro de los estandares definidos.',
    ],
    risk_profile: [
      'El cambio de perfil debe documentarse correctamente para mantener trazabilidad.',
      'Los nuevos parametros cumplen con las politicas de control vigentes.',
      'El historial de decisiones sera afectado. Activando registro de cambio de perfil.',
    ],
    market_analysis: [
      'El analisis cumple con los criterios metodologicos del proceso establecido.',
      'La consistencia con decisiones anteriores es adecuada. Sin desviaciones.',
      'No hay irregularidades auditables en el analisis presentado.',
    ],
    general: [
      'Los controles de compliance estan activos y sin alertas en este momento.',
      'La calidad del proceso de decision es conforme a los estandares.',
      'No hay desviaciones auditables detectadas en el ciclo actual.',
    ],
  },

  director: {
    buy_sell: [
      'Consenso positivo. Proceder con size disciplinado y stop definido antes de abrir.',
      'La lectura agregada es favorable. Apertura de posicion aprobada con monitoreo.',
      'Señales mixtas. Reducir size al 50% y ajustar stop-loss antes de proceder.',
    ],
    system_status: [
      'Sistema operando dentro de parametros optimos. No se requieren ajustes.',
      'Estado general favorable. Continuar operativa normal con monitoreo estandar.',
      'La salud del sistema es alta. Todos los subsistemas reportan normalidad.',
    ],
    risk_profile: [
      'El cambio de perfil es viable. Activar con ajuste gradual de posiciones abiertas.',
      'Recomiendo mantener el perfil actual dado el contexto de mercado presente.',
      'El nuevo perfil requiere ajustar la estrategia operativa. Proceder con gradualidad.',
    ],
    market_analysis: [
      'El analisis agregado indica condiciones favorables. Mantener sesgo moderado.',
      'La lectura del mercado es constructiva. Priorizar calidad de entry sobre frecuencia.',
      'Contexto mixto. Reducir tamaño de operaciones hasta mayor claridad de señal.',
    ],
    general: [
      'La operativa del sistema es normal. Sin recomendaciones de cambio inmediato.',
      'Estado general favorable. Continuar con la estrategia vigente.',
      'No hay señales que requieran accion urgente en este momento.',
    ],
  },

  investor: {
    buy_sell: [
      'Identifico una ventana de entrada con relacion riesgo-retorno estimada de 1:3.',
      'El setup actual ofrece potencial de retorno del 8-12% en el corto plazo.',
      'El punto de entrada optimo esta proximo. Esperar confirmacion de volumen.',
    ],
    system_status: [
      'El pipeline de oportunidades tiene setups activos en vigilancia.',
      'Las condiciones actuales son favorables para nuevas propuestas de trade.',
      'Hay activos con configuraciones tecnicas de alta probabilidad en el radar.',
    ],
    risk_profile: [
      'Un perfil mas agresivo abre acceso a setups con mayor volatilidad y retorno.',
      'El perfil actual limita algunas oportunidades de alta conviccion disponibles.',
      'Ajustar el perfil puede mejorar la eficiencia del pipeline de propuestas.',
    ],
    market_analysis: [
      'El mercado presenta multiples oportunidades en activos de momentum.',
      'La rotacion sectorial favorece posiciones en tecnologia y cripto.',
      'Identifico 3 setups de alta probabilidad activos en el radar actual.',
    ],
    general: [
      'No hay setups de alta conviccion activos en este momento.',
      'El pipeline de oportunidades esta en espera de confirmacion tecnica.',
      'Monitoreando activos clave para identificar proximas ventanas de entrada.',
    ],
  },

  archivist: {
    buy_sell: [
      'Setups similares tuvieron una tasa de exito del 68% en los ultimos 12 meses.',
      'En operaciones comparables el tiempo medio de resolucion fue de 3 a 5 dias.',
      'Casos analogos en contexto macro similar mostraron retorno promedio del 6%.',
    ],
    system_status: [
      'El historial muestra tasa de exito del 71% en los ultimos 90 dias.',
      'Las ultimas 20 operaciones tienen distribucion de resultados dentro de lo esperado.',
      'El registro historico no muestra patrones de deterioro en calidad de decisiones.',
    ],
    risk_profile: [
      'El historial con perfil agresivo muestra mayor volatilidad de resultados.',
      'Los mejores periodos del sistema coincidieron con perfil balanceado o conservador.',
      'Cambios de perfil en contextos similares tuvieron impacto positivo en 3 de 5 casos.',
    ],
    market_analysis: [
      'Los patrones actuales son similares a Q2 2023, que termino con sesgo alcista.',
      'El contexto macro tiene precedentes historicos de continuidad de tendencia.',
      'Los comparables historicos sugieren duracion de 2 a 4 semanas para este movimiento.',
    ],
    general: [
      'No hay precedentes historicos directamente relevantes para esta consulta.',
      'El archivo de decisiones se mantiene dentro de los rangos normales de operativa.',
      'Los registros historicos no muestran patrones de alerta aplicables.',
    ],
  },

  analyst: {
    buy_sell: [
      'Correlacion: Noticias, Tecnico e Inversor convergen en un sesgo operativo favorable.',
      'Se detecta alineacion parcial entre señales. Recomendado confirmar trigger tecnico.',
      'Hay contradiccion entre señales de contexto y timing. Conviene reducir exposicion inicial.',
    ],
    system_status: [
      'El flujo de señales entre agentes principales se mantiene consistente.',
      'No hay contradicciones criticas entre narrativa, tecnico e inversion.',
      'Coherencia multiagente estable en el ciclo de analisis actual.',
    ],
    risk_profile: [
      'Con perfil conservador aumenta el peso de contradicciones y filtros defensivos.',
      'Con perfil agresivo se prioriza coincidencia de señales de momentum.',
      'El perfil actual modifica el umbral de confirmacion necesario para operar.',
    ],
    market_analysis: [
      'Sintesis: coincidencia alta entre contexto narrativo, estructura tecnica y oportunidad.',
      'Sintesis: señales mixtas, con sesgo neutral a la espera de confirmacion.',
      'Sintesis: contradicciones visibles; se recomienda cautela operativa.',
    ],
    general: [
      'Analista listo. Esperando entradas de Noticias, Tecnico e Inversor para correlacion.',
      'No hay suficientes señales para emitir correlacion robusta.',
      'Se mantiene vigilancia sobre consistencia de señales multiagente.',
    ],
  },
};

// ---------------------------------------------------------------------------
// Deterministic selection — same prompt + agentId always yields same response
// ---------------------------------------------------------------------------

function seededIndex(seed: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return modulo === 0 ? 0 : hash % modulo;
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function baseConfidenceFor(agentId: ChatAgentId): number {
  switch (agentId) {
    case 'auditor':
      return 80;
    case 'survival':
      return 78;
    case 'director':
      return 74;
    case 'investor':
      return 73;
    case 'technical':
      return 72;
    case 'news':
      return 71;
    case 'supervisor':
      return 69;
    case 'archivist':
      return 67;
    case 'risk':
      return 63;
    case 'analyst':
      return 70;
    default:
      return 65;
  }
}

function computeConfidence(
  agentId: ChatAgentId,
  prompt: string,
  intent: ChatIntent,
  context?: BuildResponseContext,
): number {
  const ctx = getSystemContext();
  const promptSeed = seededIndex(`${agentId}:${intent}:${prompt}`, 11) - 5;
  let score = baseConfidenceFor(agentId) + promptSeed;

  if (intent === 'buy_sell' && agentId === 'risk') score -= 8;
  if (intent === 'buy_sell' && agentId === 'survival') score += 4;
  if (intent === 'buy_sell' && agentId === 'analyst') score += 5;

  if (ctx.systemStatus === 'alert' && (agentId === 'director' || agentId === 'investor')) score -= 8;
  if (ctx.systemStatus === 'alert' && (agentId === 'risk' || agentId === 'survival')) score += 6;

  if (agentId === 'supervisor' && context?.analystReports?.length) {
    if (typeof context.weightedAnalystScore === 'number') {
      score = context.weightedAnalystScore;
    } else {
      const avg = context.analystReports.reduce((acc, cur) => acc + cur.confidenceScore, 0) / context.analystReports.length;
      score = avg;
    }
  }

  if (agentId === 'director') {
    if (typeof context?.weightedFinalScore === 'number') {
      score = context.weightedFinalScore;
    }

    const upstream = [
      context?.supervisorSummary?.confidenceScore,
      context?.survivalReport?.confidenceScore,
      context?.riskReport?.confidenceScore,
      context?.auditorValidation?.confidenceScore,
    ].filter((v): v is number => typeof v === 'number');

    if (upstream.length > 0 && typeof context?.weightedFinalScore !== 'number') {
      const avg = upstream.reduce((acc, cur) => acc + cur, 0) / upstream.length;
      score = avg;
    }
  }

  return clampConfidence(score);
}

function summarizeAnalystSignals(analystReports: AgentReply[]): { favorable: number; warnings: number } {
  let favorable = 0;
  let warnings = 0;

  for (const report of analystReports) {
    const text = report.content.toLowerCase();
    if (/(alerta|riesgo|volatilidad elevada|reducir|cautela|stress|compromete)/i.test(text)) {
      warnings += 1;
    } else {
      favorable += 1;
    }
  }

  return { favorable, warnings };
}

// ---------------------------------------------------------------------------
// Context-aware dynamic responses
// Returns a real-data string when the intent maps to known system data,
// or null to fall back to the static matrix.
// ---------------------------------------------------------------------------

function buildContextAwareResponse(
  agentId: ChatAgentId,
  intent: ChatIntent,
  _prompt: string,
): string | null {
  const ctx = getSystemContext();

  const capital = formatCtxCurrency(ctx.totalCapital);
  const reserve = formatCtxCurrency(ctx.survivalReserve);
  const opCap = formatCtxCurrency(ctx.operationalCapital);
  const pct = formatCtxPercent(ctx.survivalReservePercent);
  const env = ctx.environmentLabel;
  const profile = ctx.organizationProfileLabel;
  const statusLabel =
    ctx.systemStatus === 'optimal'
      ? 'óptimo'
      : ctx.systemStatus === 'alert'
      ? 'en alerta — revisar reservas'
      : ctx.systemStatus === 'degraded'
      ? 'degradado — monitoreo activo'
      : 'favorable';

  if (intent === 'system_status') {
    if (agentId === 'director') {
      return (
        `Capital total: ${capital}. Reserva protegida: ${reserve}. ` +
        `Operamos en modo ${env}. Perfil activo: ${profile}. ` +
        `Estado general ${statusLabel}.`
      );
    }
    if (agentId === 'survival') {
      return (
        `La reserva estratégica representa el ${pct} del capital total (${reserve}). ` +
        `Capital operativo disponible: ${opCap}. ` +
        (ctx.systemStatus === 'alert'
          ? 'ALERTA: el umbral de seguridad está comprometido.'
          : 'No corre riesgo actualmente.')
      );
    }
    if (agentId === 'risk') {
      return (
        `No existen exposiciones abiertas que comprometan los límites establecidos. ` +
        `Riesgo máximo por operación: ${formatCtxPercent(ctx.maxRiskPerOperation)}. ` +
        `Límite de pérdida diaria: ${formatCtxPercent(ctx.dailyLossLimit)}.`
      );
    }
    if (agentId === 'auditor') {
      return (
        `El sistema opera en entorno ${env}. ` +
        `Todos los controles de compliance están activos. ` +
        `Perfil organizacional: ${profile}.`
      );
    }
    if (agentId === 'supervisor') {
      const count = ctx.activeAgents.length;
      return (
        `${count > 0 ? `${count} agentes activos y coordinados.` : 'Sin agentes registrados aún.'} ` +
        `Pipeline de decisión operativo en modo ${env}. Sin conflictos detectados.`
      );
    }
    if (agentId === 'archivist') {
      return (
        `Registro de estado: modo ${env}, capital ${capital}, reserva ${reserve}. ` +
        `Los parámetros están dentro de los rangos históricos normales.`
      );
    }
  }

  if (intent === 'risk_profile') {
    if (agentId === 'director') {
      return (
        `Actualmente utilizamos el perfil ${profile}. ` +
        `Este perfil define los pesos de influencia y límites operativos del sistema.`
      );
    }
    if (agentId === 'risk') {
      return (
        `El perfil ${profile} establece un riesgo máximo del ` +
        `${formatCtxPercent(ctx.maxRiskPerOperation)} por operación ` +
        `y límite diario del ${formatCtxPercent(ctx.dailyLossLimit)}.`
      );
    }
    if (agentId === 'survival') {
      return (
        `Independientemente del perfil activo (${profile}), ` +
        `la reserva del ${pct} (${reserve}) es inviolable.`
      );
    }
    if (agentId === 'auditor') {
      return `El perfil ${profile} cumple con las políticas de control vigentes. Trazabilidad completa disponible.`;
    }
  }

  if (intent === 'buy_sell') {
    if (agentId === 'survival') {
      return (
        `Con la operación propuesta, la reserva de ${reserve} (${pct} del capital) ` +
        `permanece protegida. Capital operativo disponible: ${opCap}.`
      );
    }
    if (agentId === 'risk') {
      return (
        `Volatilidad dentro de rangos tolerables. ` +
        `Size máximo recomendado: ${formatCtxPercent(ctx.maxRiskPerOperation)} del capital (${formatCtxCurrency(ctx.totalCapital * ctx.maxRiskPerOperation / 100)}). ` +
        `Definir stop-loss antes de abrir la posición.`
      );
    }
    if (agentId === 'director') {
      return (
        `Capital operativo disponible: ${opCap}. ` +
        `Proceder con size disciplinado respetando el límite del ` +
        `${formatCtxPercent(ctx.maxRiskPerOperation)} por operación.`
      );
    }
  }

  return null; // No context override — fall back to static matrix
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildMockAgentOutput(
  profile: ChatAgentProfile,
  prompt: string,
  mode: ChatMode,
  context?: BuildResponseContext,
): MockAgentOutput {
  const intent = classifyIntent(prompt);
  const asset = extractAsset(prompt);
  const agentId = profile.identity.id as ChatAgentId;

  // Hierarchical synthesis by Supervisor (only analyst reports)
  if (mode === 'consensus' && agentId === 'supervisor' && context?.analystReports?.length) {
    const { favorable, warnings } = summarizeAnalystSignals(context.analystReports);
    const profileLabel = context.profileLabel ?? getSystemContext().organizationProfileLabel;
    const weightingNote =
      profileLabel === 'Aggressive' || profileLabel === 'HyperAggressive'
        ? 'Las señales alcistas presentan influencia superior debido al perfil activo.'
        : profileLabel === 'Conservative'
        ? 'Los factores defensivos han recibido mayor ponderación debido al perfil activo.'
        : 'La ponderación entre señales alcistas y defensivas se mantiene equilibrada.';
    const content =
      `Resumen del Supervisor: ${favorable} señales favorables, ${warnings} advertencias. ` +
      `${weightingNote} ` +
      `Síntesis basada en Noticias, Técnico, Inversor y Analista.`;

    return {
      content,
      confidenceScore: computeConfidence(agentId, prompt, intent, context),
    };
  }

  // Hierarchical final decision by Director (must use specific upstream reports)
  if (mode === 'consensus' && agentId === 'director') {
    const hasAllInputs =
      Boolean(context?.supervisorSummary) &&
      Boolean(context?.survivalReport) &&
      Boolean(context?.riskReport) &&
      Boolean(context?.auditorValidation);

    if (hasAllInputs) {
      const profileLabel = context.profileLabel ?? getSystemContext().organizationProfileLabel;
      const supervisorText = context?.supervisorSummary?.content.toLowerCase() ?? '';
      const survivalText = context?.survivalReport?.content.toLowerCase() ?? '';
      const riskText = context?.riskReport?.content.toLowerCase() ?? '';
      const auditorText = context?.auditorValidation?.content.toLowerCase() ?? '';

      const defensiveFlag = /(alerta|compromet|veto|reducir|riesgo critico)/i.test(survivalText);
      const riskFlag = /(alerta|advertencia|stress|volatilidad elevada|reducir)/i.test(riskText);
      const growthSupport = /(favorable|coincidencia|alineacion|constructiva|aprobad)/i.test(supervisorText);
      const processValid = !/(desviaci|incumpl|irregularidad)/i.test(auditorText);

      const weighted = context?.weightedFinalScore ?? computeConfidence(agentId, prompt, intent, context);
      let decision = 'REVISAR';

      if (profileLabel === 'HyperAggressive') {
        decision = weighted >= 58 ? 'APROBADO CON PRIORIDAD' : 'APROBADO CON CAUTELA';
      } else if (profileLabel === 'Aggressive') {
        decision = weighted >= 60 ? 'APROBADO' : 'APROBADO CON CAUTELA';
      } else if (profileLabel === 'Balanced') {
        decision = weighted >= 66 ? 'APROBADO CON CAUTELA' : 'REVISAR';
      } else {
        decision = weighted >= 78 && growthSupport && processValid && !defensiveFlag && !riskFlag ? 'APROBADO CON CAUTELA' : 'REVISAR';
      }

      if (!processValid) {
        decision = 'REVISAR';
      }

      const weightingNarrative =
        profileLabel === 'HyperAggressive' || profileLabel === 'Aggressive'
          ? 'Las señales de crecimiento han recibido mayor ponderación que los factores defensivos.'
          : profileLabel === 'Conservative'
          ? 'Los factores defensivos y de preservación de capital han recibido mayor ponderación.'
          : 'Se aplicó una ponderación equilibrada entre crecimiento y protección.';

      const content =
        `El perfil organizativo actual es ${profileLabel}. ` +
        `${weightingNarrative} ` +
        `Decisión del Director: ${decision}. ` +
        `Integración de insumos de Riesgo, Supervisor, Supervivencia y Auditor completada.`;

      return {
        content,
        confidenceScore: weighted,
      };
    }
  }

  if (mode === 'consensus' && agentId === 'auditor' && context?.activeWeights && context.profileLabel) {
    const w = context.activeWeights;
    const content =
      `Validación del Auditor: perfil activo ${context.profileLabel}. ` +
      `Pesos aplicados correctamente (Noticias ${w.news ?? 1.0}, Técnico ${w.technical ?? 1.0}, ` +
      `Riesgo ${w.risk ?? 1.0}, Supervivencia ${w.survival ?? 1.0}, Inversor ${w.investor ?? 1.0}). ` +
      `El proceso respeta la configuración organizativa vigente.`;

    return {
      content,
      confidenceScore: computeConfidence(agentId, prompt, intent, context),
    };
  }

  // Try context-aware dynamic response first
  const contextResponse = buildContextAwareResponse(agentId, intent, prompt);
  if (contextResponse !== null) {
    return {
      content:
        mode === 'consensus' && !profile.consensus.finalSynthesizer
          ? `[${intent.replace('_', '-')}] ${contextResponse}`
          : contextResponse,
      confidenceScore: computeConfidence(agentId, prompt, intent, context),
    };
  }

  // Fall back to static matrix
  const pool = RESPONSES[agentId]?.[intent] ?? RESPONSES[agentId]?.general ?? ['Sin respuesta disponible.'];
  const picked = pool[seededIndex(`${agentId}:${intent}:${prompt}`, pool.length)];

  const text = asset
    ? picked.replace(/\bel activo\b/gi, asset).replace(/(?<!\w)activo(?!\w)/gi, asset)
    : picked;

  const normalized = mode === 'consensus' && !profile.consensus.finalSynthesizer
    ? `[${intent.replace('_', '-')}] ${text}`
    : text;

  return {
    content: normalized,
    confidenceScore: computeConfidence(agentId, prompt, intent, context),
  };
}

// Backwards-compatible API used by older callers.
export function buildMockAgentResponse(profile: ChatAgentProfile, prompt: string, mode: ChatMode): string {
  return buildMockAgentOutput(profile, prompt, mode).content;
}
