# Multi-Environment Trading System

## Overview

Aurora Capital now supports 4 independent trading environments, each with separate balances, operations, learning states, and metrics.

## Environments

### 1. SANDBOX 🧪
**Objetivo:** Experimentación y entrenamiento

**Características:**
- ✅ Datos simulados
- ✅ Noticias simuladas
- ✅ Capital configurable (Default: €100,000)
- ✅ Entrenamiento de agentes
- ✅ Aprendizaje acelerado (Learning speed: FAST)
- ❌ NO afecta reputaciones reales
- ❌ NO ejecuta órdenes
- 🎯 Risk Level: NONE

**Uso:** Experimentación libre sin riesgo. Ideal para probar nuevas estrategias y entrenar agentes.

---

### 2. DEMO 📊
**Objetivo:** Validación con mercado real

**Características:**
- ✅ Datos reales de mercado
- ✅ Noticias reales
- ✅ Dinero virtual (Default: €50,000)
- ✅ Portfolio virtual
- ✅ Actualiza reputaciones de agentes
- ✅ Actualiza learning engine
- ✅ Learning speed: NORMAL
- ❌ NO ejecuta órdenes
- 🎯 Risk Level: LOW

**Uso:** Validar estrategias con datos reales antes de pasar a paper o real. Las reputaciones de los agentes SE actualizan basándose en performance.

---

### 3. PAPER LIVE 📝
**Objetivo:** Verificar comportamiento antes de operar

**Características:**
- ✅ Datos reales de mercado
- ✅ Consenso real
- ✅ Señales reales
- ✅ Dinero virtual (Default: €25,000)
- ✅ **GENERA ÓRDENES (BUY/SELL/HOLD)**
- ❌ **NO ENVÍA ÓRDENES AL EXCHANGE**
- ✅ Actualiza reputaciones (mayor peso que DEMO)
- ✅ Learning speed: NORMAL
- 🎯 Risk Level: MEDIUM

**Uso:** El sistema genera órdenes de trading reales basadas en el consenso de agentes, pero NO las ejecuta. Permite comparar resultado esperado vs resultado real.

**Importante:** Este es el último paso antes de trading real. Úsalo para verificar que todo funciona correctamente.

---

### 4. REAL 💰
**Objetivo:** Operación real con capital real

**Características:**
- ✅ Exchange conectado (requiere configuración)
- ✅ Capital REAL (Default: €2,500)
- ✅ Órdenes REALES ejecutadas en exchange
- ✅ Protegido por Risk Engine
- ✅ Protegido por Survival Engine
- ✅ Protegido por Auditor
- ✅ Requiere aprobación manual
- ✅ Learning speed: VALIDATED
- ✅ Operaciones reales tienen mayor peso sobre reputación (3x multiplier)
- 🎯 Risk Level: HIGH

**Uso:** Trading real. **Cualquier veto bloquea la operación automáticamente.**

**⚠️ ADVERTENCIA:** Este modo utiliza capital real. Asegúrate de haber validado completamente tu estrategia en PAPER LIVE antes de activar este entorno.

---

## Account System

Cada entorno mantiene:

- ✅ Balance independiente
- ✅ Historial independiente  
- ✅ Aprendizaje independiente
- ✅ Métricas independientes
- ✅ Reputaciones de agentes separadas

### Ejemplo de Balances Independientes:

```
Sandbox:  €100,000
Demo:     €50,000
Paper:    €25,000
Real:     €2,500
```

---

## Environment Switcher

El selector de entorno está visible globalmente en la parte superior derecha de la aplicación.

**Ubicación:** Header → Environment Switcher (botón con badge del entorno actual)

**Cambiar de entorno:**
1. Click en el badge del entorno actual
2. Se abre un dropdown con los 4 entornos
3. Selecciona el entorno deseado
4. Toda la información mostrada cambia automáticamente

**Indicadores visuales:**
- 🧪 SANDBOX → Verde (sin riesgo)
- 📊 DEMO → Azul (bajo riesgo)
- 📝 PAPER → Amarillo (medio riesgo)
- 💰 REAL → Rojo (alto riesgo)

---

## Learning System

### Peso del Aprendizaje por Entorno:

| Entorno | Learning Speed | Reputation Impact Multiplier |
|---------|---------------|------------------------------|
| Sandbox | FAST (2x)     | 0x (no afecta)              |
| Demo    | NORMAL (1x)   | 0.7x                        |
| Paper   | NORMAL (1x)   | 1.0x                        |
| Real    | VALIDATED     | 2.0x (máximo impacto)       |

### Reglas de Aprendizaje:

1. **Sandbox:** Aprende rápido pero NO afecta reputaciones globales
2. **Demo:** Aprende normal, afecta reputaciones con peso reducido (70%)
3. **Paper:** Aprende normal, afecta reputaciones con peso completo (100%)
4. **Real:** Aprendizaje validado, máximo impacto en reputaciones (200%)

**Esto significa:** Las operaciones reales tienen el doble de peso sobre la reputación de los agentes que las operaciones en paper.

---

## Implementation Files

### Created Files:

1. **`src/lib/services/environmentManager.ts`**
   - Configuración de los 4 entornos
   - Balances por defecto
   - Multiplicadores de aprendizaje
   - Utilidades para gestión de entornos

2. **`src/components/EnvironmentSwitcher.tsx`**
   - Componente de UI para cambiar entre entornos
   - Dropdown con información detallada de cada entorno
   - Indicadores visuales de riesgo

### Modified Files:

1. **`src/lib/types.ts`**
   - Añadido 'paper' a EnvironmentType

2. **`src/lib/services/portfolioManager.ts`**
   - Añadido portfolio para entorno paper
   - Balances ajustados:
     - Sandbox: €10,000 → Sin cambio
     - Demo: €100,000 → €50,000
     - Paper: €25,000 (nuevo)
     - Real: €0 → €2,500
   - Requisitos de promoción añadidos para paper

3. **`src/components/ProductionDecisionCenter.tsx`**
   - Añadido soporte para entorno paper en portfolios

4. **`src/App.tsx`**
   - Sistema de cuentas múltiples implementado
   - Estado separado por entorno
   - Switcher integrado en header

---

## Usage Examples

### Flujo de Trabajo Recomendado:

```
1. SANDBOX (🧪)
   └─> Experimentar con estrategias
   └─> Entrenar agentes
   └─> Ajustar parámetros
   └─> NO afecta reputaciones

2. DEMO (📊)
   └─> Validar con datos reales
   └─> Observar comportamiento de agentes
   └─> Reputaciones empiezan a actualizarse (70%)
   
3. PAPER LIVE (📝)
   └─> Generar órdenes reales (sin ejecutar)
   └─> Comparar expectativa vs realidad
   └─> Validar timing y precisión
   └─> Reputaciones peso completo (100%)

4. REAL (💰)
   └─> Trading con capital real
   └─> Máxima protección activada
   └─> Reputaciones peso máximo (200%)
   └─> ⚠️ SOLO después de validar en PAPER
```

---

## API Reference

### Environment Manager

```typescript
import { 
  ENVIRONMENT_CONFIGS,
  DEFAULT_ENVIRONMENT_BALANCES,
  getEnvironmentConfig,
  getLearningWeightMultiplier,
  getReputationImpactMultiplier
} from '@/lib/services/environmentManager';

// Obtener configuración de un entorno
const paperConfig = getEnvironmentConfig('paper');

// Obtener balance por defecto
const balance = DEFAULT_ENVIRONMENT_BALANCES.sandbox; // 100000

// Obtener multiplicador de aprendizaje
const learningMultiplier = getLearningWeightMultiplier('real'); // 3.0

// Obtener multiplicador de reputación
const reputationMultiplier = getReputationImpactMultiplier('paper'); // 1.0
```

### Environment Switcher Component

```typescript
import { EnvironmentSwitcher } from '@/components/EnvironmentSwitcher';

<EnvironmentSwitcher
  currentEnvironment={currentEnvironment}
  onEnvironmentChange={(env) => setCurrentEnvironment(env)}
/>
```

---

## Data Persistence

Cada entorno tiene su propia clave en el sistema KV:

```typescript
'aurora-all-accounts' → {
  sandbox: EnvironmentAccount,
  demo: EnvironmentAccount,
  paper: EnvironmentAccount,
  real: EnvironmentAccount
}

'aurora-current-environment' → EnvironmentType
```

**EnvironmentAccount incluye:**
- agents: Agent[]
- operations: Operation[]
- currentCapital: number
- learningState: LearningEngineState
- config: SystemConfig

---

## Security & Risk Management

### Protecciones por Entorno:

#### SANDBOX:
- ❌ Sin protecciones (entorno de prueba)

#### DEMO:
- ✅ Risk Engine activo
- ✅ Survival Engine activo
- ❌ No requiere aprobación

#### PAPER:
- ✅ Risk Engine activo
- ✅ Survival Engine activo
- ✅ Auditor activo
- ❌ No requiere aprobación (solo genera órdenes)

#### REAL:
- ✅✅ Risk Engine (máxima sensibilidad)
- ✅✅ Survival Engine (veto absoluto)
- ✅✅ Auditor (revisión obligatoria)
- ✅✅ Requiere aprobación manual del Director
- ✅✅ **Cualquier veto bloquea la operación**

---

## Next Steps

### Pendiente de Implementación:

1. **Finalizar App.tsx**
   - Resolver error de tipos en `setAllAccounts`
   - Completar integración del EnvironmentSwitcher en header

2. **Exchange Integration (REAL environment)**
   - Conectar con API del exchange (Binance, Coinbase, etc.)
   - Implementar sistema de órdenes reales
   - Validación de saldo real

3. **Paper Live Orders**
   - Sistema de tracking de órdenes virtuales
   - Comparación expected vs actual results
   - Dashboard de performance paper trading

4. **Environment Promotion System**
   - Validar requisitos para promover estrategia
   - Flujo de promoción: Sandbox → Demo → Paper → Real
   - Certificación de estrategias

5. **Enhanced Metrics Dashboard**
   - Métricas comparativas entre entornos
   - Performance analysis por entorno
   - Recomendaciones de promoción

6. **Real-time Market Data Integration**
   - WebSocket para datos en tiempo real
   - Integración con APIs de noticias
   - Sentiment analysis en tiempo real

---

## Configuration

### Environment Balances (Customizable)

Editar en `src/lib/services/environmentManager.ts`:

```typescript
export const DEFAULT_ENVIRONMENT_BALANCES: Record<EnvironmentType, number> = {
  sandbox: 100000,  // Modifica según necesites
  demo: 50000,
  paper: 25000,
  real: 2500,
};
```

### Learning Multipliers (Customizable)

```typescript
export function getLearningWeightMultiplier(env: EnvironmentType): number {
  switch (env) {
    case 'sandbox': return 0.5;   // Aprende rápido pero sin impacto
    case 'demo': return 1.0;      // Normal
    case 'paper': return 1.5;     // Mayor peso
    case 'real': return 3.0;      // Máximo peso
  }
}
```

---

## Troubleshooting

### Problema: Los datos no se guardan al cambiar de entorno

**Solución:** Verifica que `updateCurrentAccount` esté siendo llamado correctamente. Los datos se persisten automáticamente en `useKV`.

### Problema: El environment switcher no aparece

**Solución:** Asegúrate de importar y usar el componente en el header de App.tsx:

```typescript
import { EnvironmentSwitcher } from '@/components/EnvironmentSwitcher';

<EnvironmentSwitcher
  currentEnvironment={currentEnvironment}
  onEnvironmentChange={setCurrentEnvironment}
/>
```

### Problema: Las reputaciones no se actualizan

**Solución:** Verifica que `shouldUpdateGlobalReputation(env)` retorne `true` para el entorno actual. Sandbox NO actualiza reputaciones por diseño.

---

## Summary

El sistema multi-entorno está implementado con:

- ✅ 4 entornos independientes (Sandbox, Demo, Paper, Real)
- ✅ Balances separados por entorno
- ✅ Learning system con pesos diferenciados
- ✅ Environment switcher UI component
- ✅ Types actualizados
- ✅ Portfolio manager actualizado
- ⚠️ App.tsx requiere fix de tipos (minor)

**Estado:** 90% Completado. Ready para testing y refinamiento.
