# ENHANCED CONSENSUS & LEARNING ENGINE

## Sistema Auto-Adaptativo de Toma de Decisiones

Este documento describe la implementación completa del motor de consenso mejorado con aprendizaje automático, reputación dinámica y vetos jerárquicos.

---

## ARQUITECTURA GENERAL

El sistema está dividido en 4 motores independientes y desacoplados:

```
┌─────────────────────────────────────────────────────────┐
│              ENHANCED CONSENSUS ENGINE                  │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐ │
│  │  Consensus   │  │   Veto        │  │   Quality    │ │
│  │  Engine      │→ │   Engine      │→ │   Scoring    │ │
│  └──────────────┘  └───────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓
                          ↓ (Decision Feedback)
                          ↓
┌─────────────────────────────────────────────────────────┐
│              LEARNING ENGINE                            │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐ │
│  │  Trade       │  │   Reputation  │  │  Performance │ │
│  │  Recording   │→ │   Updates     │→ │  Analytics   │ │
│  └──────────────┘  └───────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## FASE 1: SISTEMA DE VETO REAL

### Orden de Ejecución

```javascript
1. Agentes emiten votos (APPROVE / REJECT / VETO)
2. Consensus Engine calcula resultado preliminar
3. Veto Engine evalúa reglas críticas
4. Si existe veto crítico:
     resultado final = REJECTED
     motivo = veto activado
5. Si no existe veto:
     resultado final = consenso
```

### Tipos de Veto (Prioridad Jerárquica)

1. **Survival Veto** (Prioridad 1)
   - Activado cuando: Capital después de la operación < Reserva de supervivencia
   - Agente: `survival`
   - Bloqueo: Automático e inmediato

2. **Risk Veto** (Prioridad 2)
   - Activado cuando: Riesgo de operación > Máximo permitido
   - Agente: `risk`
   - Bloqueo: Automático

3. **Auditor Veto** (Prioridad 3)
   - Activado cuando: Violación de compliance detectada
   - Agente: `auditor`
   - Bloqueo: Manual por el agente

4. **Director Override** (Prioridad 4)
   - Activado cuando: Director rechaza manualmente
   - Agente: `director`
   - Bloqueo: Manual

### Implementación

Archivo: `src/lib/services/vetoEngine.ts`

```typescript
export function evaluateVetos(
  proposal: { asset, action, amount },
  config: SystemConfig,
  currentCapital: number,
  consensus: ConsensusCalculation,
  agentRecommendations: AgentRecommendation[]
): VetoCheckResult

// Returns:
{
  hasVeto: boolean,
  vetos: VetoResult[],
  finalDecision: 'APPROVED' | 'REJECTED',
  blockingVeto?: VetoResult
}
```

---

## FASE 2: TRADE QUALITY SCORE

### Métrica Independiente

El Trade Quality Score es una métrica de **0-100** que mide la calidad de la operación propuesta, pero **NO decide** si se ejecuta o no.

### Escala de Calificación

| Score | Grade   | Description |
|-------|---------|-------------|
| 90-100| Elite   | Operación de alta calidad |
| 75-89 | Good    | Operación sólida |
| 60-74 | Average | Operación aceptable |
| 40-59 | Weak    | Operación cuestionable |
| 0-39  | Poor    | Operación de mala calidad |

### Factores (Ponderación)

```typescript
- Consenso           (25%) - Nivel de acuerdo entre agentes
- Riesgo             (20%) - Inversión del riesgo (100 - risk)
- Volatilidad        (15%) - Estabilidad del mercado
- Confianza promedio (20%) - Media de confianza de agentes
- Ratio B/R          (10%) - Beneficio / Riesgo esperado
- Alineación Agentes (10%) - Uniformidad de opiniones
```

### Implementación

Archivo: `src/lib/services/vetoEngine.ts`

```typescript
export function calculateTradeQuality(
  consensus: number,
  risk: number,
  volatility: number,
  averageConfidence: number,
  profitRiskRatio: number,
  agentAlignment: number
): TradeQuality

// Returns:
{
  score: number,
  grade: 'Poor' | 'Weak' | 'Average' | 'Good' | 'Elite',
  factors: TradeQualityFactors
}
```

---

## FASE 3: LEARNING ENGINE

### Registro de Operaciones

Cada operación completada se almacena con:

```typescript
interface CompletedTrade {
  id: string;
  sessionId: string;
  symbol: string;
  action: OperationType;
  entryPrice: number;
  exitPrice: number;
  amount: number;
  pnl: number;
  pnlPercent: number;
  consensus: number;
  agentVotes: Record<AgentType, VoteData>;
  agentReputationsUsed: Record<AgentType, number>;
  outcome: 'win' | 'loss' | 'breakeven';
  timestamp: string;
  exitTimestamp: string;
  duration: number;
  tradeQuality?: TradeQuality;
}
```

### Estadísticas Globales

```typescript
{
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number;
  totalPnl: number;
  totalPnlPercent: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  bestTrade: number;
  worstTrade: number;
}
```

### Implementación

Archivo: `src/lib/services/learningEngine.ts`

```typescript
export function recordCompletedTrade(
  state: LearningEngineState,
  trade: CompletedTrade
): LearningEngineState
```

---

## FASE 4: REPUTATION ENGINE

### Sistema Dinámico de Reputación

Rango: **0-100**

Cada agente comienza con una reputación inicial de **70**.

### Actualización Automática

Cuando una operación termina:

```javascript
Si el agente acertó:
    reputación += recompensa (basada en el PnL)

Si el agente se equivocó:
    reputación -= penalización (basada en el PnL)
```

### Tabla de Recompensas/Penalizaciones

| Condición | PnL | Cambio |
|-----------|-----|--------|
| Strong Win | > +10% | +3 |
| Win | +5% a +10% | +2 |
| Small Win | 0% a +5% | +1 |
| Breakeven | 0% | 0 |
| Small Loss | 0% a -5% | -1 |
| Loss | -5% a -10% | -2 |
| Strong Loss | < -10% | -3 |

### Evaluación de Acierto

```typescript
// Para votos APPROVE:
Acierto = outcome === 'win' || outcome === 'breakeven'

// Para votos REJECT:
Acierto = outcome === 'loss' || outcome === 'breakeven'

// Para VETO:
Acierto = outcome === 'loss'
```

### Métricas por Agente

```typescript
interface AgentPerformanceStats {
  agentId: AgentType;
  agentName: string;
  reputation: number;  // 0-100
  totalVotes: number;
  correctVotes: number;
  incorrectVotes: number;
  accuracy: number;  // Porcentaje
  winRate: number;
  avgPnlWhenCorrect: number;
  avgPnlWhenWrong: number;
  totalPnlInfluence: number;
  consistency: number;  // 0-100
  drawdownCaused: number;
  reputationHistory: ReputationChange[];
}
```

### Implementación

Archivo: `src/lib/services/learningEngine.ts`

```typescript
export function updateAgentReputations(
  state: LearningEngineState,
  trade: CompletedTrade
): {
  state: LearningEngineState;
  updates: ReputationUpdate[];
}
```

---

## FASE 5: PERFORMANCE DASHBOARD

### Vista: Learning & Performance

Componente: `LearningDashboard.tsx`

### Secciones Principales

1. **Métricas Globales**
   - Win Rate Global
   - ROI Total
   - Profit Factor
   - Sharpe Ratio

2. **Estadísticas Detalladas**
   - Trades totales
   - Ganancia/Pérdida promedio
   - Mejor/Peor trade
   - Drawdown máximo
   - Rachas ganadoras/perdedoras

3. **Ranking de Agentes**
   - Top 9 agentes ordenados por:
     1. Reputación
     2. Precisión (Accuracy)
     3. Influencia PnL total

4. **Performance Detallado por Agente**
   - Reputación actual
   - Precisión histórica
   - PnL cuando acierta vs cuando falla
   - Consistencia
   - Drawdown causado

---

## FASE 6: CONSENSO ADAPTATIVO

### Influencia Efectiva Dinámica

La influencia de cada agente se ajusta automáticamente basándose en su desempeño histórico:

```javascript
Influencia Efectiva = 
    Influencia Base 
    × (Reputación / 100) 
    × (Precisión / 100)
```

### Ejemplo

```
Agente: Técnico
Influencia Base: 75
Reputación actual: 88
Precisión histórica: 85%

Influencia Efectiva = 75 × 0.88 × 0.85 = 56.1
```

### Cálculo del Consenso Ponderado

```typescript
WeightedConsensus = 
    (Σ (VoteValue × Confidence × EffectiveInfluence)) 
    / Total EffectiveInfluence
```

Donde:
- `VoteValue` = 1 si APPROVE, -1 si REJECT, 0 si VETO
- `Confidence` = Confianza del agente (0-100) / 100
- `EffectiveInfluence` = Influencia calculada dinámicamente

### Implementación

Archivo: `src/lib/services/consensusEngine.ts`

```typescript
export function calculateAdaptiveConsensus(
  agents: Agent[],
  agentPerformance: Record<AgentType, AgentPerformanceStats>,
  votes: AgentVote[]
): ConsensusCalculation
```

---

## FASE 7: EXPLICABILIDAD AVANZADA

### Panel: "Why This Decision?"

Componente: `EnhancedConsensusEngine.tsx`

### Información Generada Automáticamente

1. **Resumen Ejecutivo**
```
La operación fue APROBADA por consenso del 72%.
Los agentes Noticias, Inversor y Supervivencia impulsaron la aprobación.
El agente Riesgo expresó preocupación moderada.
No se activó ningún veto crítico.
La calidad estimada de la operación fue 81/100 (GOOD).
```

2. **Agentes Supporters**
   - Lista de agentes que votaron APPROVE
   - Nivel de confianza de cada uno

3. **Agentes Opositores**
   - Lista de agentes que votaron REJECT
   - Razones de oposición

4. **Factores de Riesgo Detectados**
   - Lista de advertencias y consideraciones
   - Vetos evaluados

5. **Desglose de Trade Quality**
   - Puntajes individuales por factor
   - Visualización de fortalezas/debilidades

### Implementación

Archivo: `src/lib/services/consensusEngine.ts`

```typescript
export function generateDecisionExplanation(
  consensus: ConsensusCalculation,
  tradeQuality: TradeQuality,
  vetoCheck: VetoCheckResult,
  agents: Agent[]
): DecisionExplanation
```

---

## FASE 8: PREPARACIÓN PARA IA REAL

### Arquitectura Desacoplada

El sistema está diseñado para soportar múltiples proveedores de LLM:

```typescript
export type LLMProvider = 
  | 'openai'     // GPT-4, GPT-4o, GPT-4o-mini
  | 'anthropic'  // Claude 3 (Opus, Sonnet, Haiku)
  | 'ollama'     // Llama 3, Mistral (local)
  | 'lmstudio'   // Modelos locales
  | 'local';     // Custom endpoints

export type LLMModel = 
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'llama-3-70b'
  | 'llama-3-8b'
  | 'mistral-large'
  | 'mixtral-8x7b'
  | 'custom';
```

### Configuración por Agente

Cada agente puede tener su propia configuración de modelo:

```typescript
interface AgentModelConfig {
  provider: LLMProvider;
  model: LLMModel;
  temperature: number;
  contextSize: number;
  maxTokens?: number;
}
```

### Separación de Motores

```
┌────────────────────┐
│ Consensus Engine   │  → Cálculo matemático de consenso
└────────────────────┘

┌────────────────────┐
│ Learning Engine    │  → Análisis histórico y métricas
└────────────────────┘

┌────────────────────┐
│ Reputation Engine  │  → Gestión de reputaciones
└────────────────────┘

┌────────────────────┐
│ Veto Engine        │  → Evaluación de reglas críticas
└────────────────────┘

┌────────────────────┐
│ Execution Engine   │  → Ejecución de operaciones (futuro)
└────────────────────┘
```

Esta separación permite:
- Reemplazar cualquier motor sin afectar a los demás
- Testear componentes de forma independiente
- Integrar LLMs reales sin modificar la lógica de negocio
- Escalar horizontalmente cada servicio

---

## PERSISTENCIA DE DATOS

### Almacenamiento con useKV

Todos los datos críticos se persisten automáticamente:

```typescript
// Learning Engine State
const [learningState, setLearningState] = useKV<LearningEngineState>(
  'aurora-learning',
  initializeLearningEngine()
);

// Contiene:
- completedTrades: CompletedTrade[]
- agentPerformance: Record<AgentType, AgentPerformanceStats>
- globalStats: GlobalStatistics
```

### Actualización Incremental

Las reputaciones y estadísticas se actualizan de forma incremental, sin recalcular todo el historial:

```typescript
setLearningState((prev) => {
  const { state, updates } = updateAgentReputations(prev, completedTrade);
  return recordCompletedTrade(state, completedTrade);
});
```

---

## USO DEL SISTEMA

### 1. Inicialización

El sistema se inicializa automáticamente al cargar la aplicación:

```typescript
// En App.tsx
const [learningState, setLearningState] = useKV<LearningEngineState>(
  'aurora-learning',
  initializeLearningEngine()
);

// Inicialización de performance por agente
useEffect(() => {
  agents.forEach(agent => {
    if (!learningState.agentPerformance[agent.id]) {
      learningState.agentPerformance[agent.id] = 
        initializeAgentPerformance(agent.id, agent.name, agent.reputation);
    }
  });
}, [agents]);
```

### 2. Evaluación de Propuesta

```typescript
// 1. Calcular consenso adaptativo
const consensus = calculateAdaptiveConsensus(agents, learningState.agentPerformance, votes);

// 2. Evaluar vetos
const vetoCheck = evaluateVetos(proposal, config, currentCapital, consensus, votes);

// 3. Calcular calidad
const tradeQuality = calculateTradeQuality(
  consensus.weightedConsensus,
  risk, volatility, avgConfidence, profitRiskRatio, agentAlignment
);

// 4. Generar explicación
const explanation = generateDecisionExplanation(consensus, tradeQuality, vetoCheck, agents);
```

### 3. Registro de Operación Completada

```typescript
const completedTrade: CompletedTrade = {
  id: generateId(),
  sessionId: decisionSession.id,
  symbol: 'BTC',
  action: 'BUY',
  entryPrice: 50000,
  exitPrice: 52000,
  amount: 10000,
  pnl: 400,
  pnlPercent: 4.0,
  consensus: 72.5,
  agentVotes: { /* ... */ },
  agentReputationsUsed: { /* ... */ },
  outcome: 'win',
  timestamp: new Date().toISOString(),
  exitTimestamp: new Date().toISOString(),
  duration: 3600,
  tradeQuality
};

// Actualizar learning state
setLearningState((prev) => {
  const { state: updatedState, updates } = updateAgentReputations(prev, completedTrade);
  return recordCompletedTrade(updatedState, completedTrade);
});
```

### 4. Visualización

```tsx
// Dashboard de Learning
<LearningDashboard learningState={learningState} />

// Motor de Consenso Mejorado
<EnhancedConsensusEngine 
  agents={agents}
  config={config}
  currentCapital={currentCapital}
  learningState={learningState}
/>
```

---

## PRÓXIMOS PASOS

1. **Integración LLM Real**
   - Conectar con OpenAI API
   - Implementar Claude 3
   - Configurar Ollama local

2. **Backtesting Histórico**
   - Importar datos históricos
   - Simular decisiones pasadas
   - Calibrar reputaciones iniciales

3. **Optimización de Parámetros**
   - A/B testing de ponderaciones
   - Ajuste de umbrales de veto
   - Optimización de factores de quality score

4. **Ejecución Real**
   - Integración con exchanges
   - Gestión de órdenes
   - Monitoreo de posiciones

5. **Alertas y Notificaciones**
   - Telegram bot
   - Email notifications
   - Dashboard en tiempo real

---

## CONCLUSIÓN

El sistema implementado proporciona una base sólida y escalable para:

✅ Toma de decisiones con consenso adaptativo  
✅ Aprendizaje automático de patrones históricos  
✅ Reputación dinámica basada en desempeño  
✅ Vetos jerárquicos con prioridades claras  
✅ Métricas de calidad independientes  
✅ Explicabilidad completa de decisiones  
✅ Preparación para múltiples proveedores de IA  
✅ Arquitectura desacoplada y mantenible  

El sistema está listo para evolucionar hacia una plataforma de trading autónoma completamente funcional.
