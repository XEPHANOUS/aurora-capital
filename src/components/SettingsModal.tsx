import { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AgentAssignmentConfig } from '@/components/AgentAssignmentConfig';
import { 
  Gear, 
  Users, 
  GitBranch, 
  Plug, 
  Brain, 
  CurrencyDollar,
  ShieldCheck,
  Database,
  Globe,
  X
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { Agent, SystemConfig, OrganizationalProfile } from '@/lib/types';
import { formatCurrency } from '@/lib/mockData';

type SettingsCategory = 'general' | 'agents' | 'consensus' | 'apis' | 'llms' | 'trading' | 'environments' | 'security' | 'backups';

interface CategoryItem {
  id: SettingsCategory;
  label: string;
  icon: React.ElementType;
  description: string;
  comingSoon?: boolean;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'general',
    label: 'General',
    icon: Gear,
    description: 'Configuración básica del sistema'
  },
  {
    id: 'agents',
    label: 'Agentes',
    icon: Users,
    description: 'Gestión y configuración de agentes'
  },
  {
    id: 'consensus',
    label: 'Consenso',
    icon: GitBranch,
    description: 'Sistema de votación y decisiones'
  },
  {
    id: 'apis',
    label: 'APIs',
    icon: Plug,
    description: 'Integraciones y conexiones externas',
    comingSoon: true
  },
  {
    id: 'llms',
    label: 'LLMs',
    icon: Brain,
    description: 'Modelos de lenguaje',
    comingSoon: true
  },
  {
    id: 'trading',
    label: 'Trading',
    icon: CurrencyDollar,
    description: 'Parámetros de operación'
  },
  {
    id: 'environments',
    label: 'Entornos',
    icon: Globe,
    description: 'Configuración multi-entorno',
    comingSoon: true
  },
  {
    id: 'security',
    label: 'Seguridad',
    icon: ShieldCheck,
    description: 'Permisos y autenticación',
    comingSoon: true
  },
  {
    id: 'backups',
    label: 'Backups',
    icon: Database,
    description: 'Respaldos y recuperación',
    comingSoon: true
  }
];

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: SystemConfig;
  agents: Agent[];
  onSimulationToggle: (enabled: boolean) => void;
  onUpdateAgent: (agentId: string, updates: Partial<Agent>) => void;
  onProfileChange: (profile: OrganizationalProfile) => void;
}

export function SettingsModal({
  open,
  onOpenChange,
  config,
  agents,
  onSimulationToggle,
  onUpdateAgent,
  onProfileChange,
}: SettingsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<SettingsCategory>('general');
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "p-0 gap-0 overflow-hidden",
        "w-[100vw] h-[100vh]",
        "max-sm:rounded-none",
        "sm:w-[95vw] sm:h-[90vh] sm:max-w-none",
        "md:w-[90vw] md:h-[85vh]",
        "lg:w-[85vw] lg:max-w-[1600px]"
      )}>
        <div className="flex flex-col lg:flex-row h-full">
          <div className={cn(
            "flex-shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-card/40 backdrop-blur-sm flex flex-col",
            "w-full lg:w-auto",
            "lg:min-w-[250px] lg:max-w-[25%]"
          )}>
            <div className="p-4 sm:p-6 border-b border-border/50">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-heading font-bold text-lg sm:text-xl tracking-tight">CONFIGURACIÓN</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
                  onClick={() => onOpenChange(false)}
                >
                  <X size={20} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground/80">Sistema Aurora Capital</p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <nav className="p-3 sm:p-4 space-y-1.5">
                {CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategory === category.id;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => !category.comingSoon && setSelectedCategory(category.id)}
                      disabled={category.comingSoon}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 sm:p-3.5 rounded-lg transition-all text-left group",
                        isSelected 
                          ? "bg-primary/15 border border-primary shadow-sm" 
                          : category.comingSoon
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-background/60 hover:border hover:border-border/50"
                      )}
                    >
                      <Icon 
                        size={20} 
                        weight={isSelected ? "fill" : "regular"} 
                        className={cn(
                          "mt-0.5 transition-colors flex-shrink-0",
                          isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )} 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={cn(
                            "text-sm font-semibold",
                            isSelected ? "text-primary" : "text-foreground"
                          )}>
                            {category.label}
                          </p>
                          {category.comingSoon && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground/70 border-muted-foreground/30">
                              Próximamente
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">
                          {category.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col min-w-0 bg-background/30 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6 lg:p-8 h-full">
                {selectedCategory === 'general' && (
                  <GeneralSettings config={config} onSimulationToggle={onSimulationToggle} />
                )}
                
                {selectedCategory === 'agents' && (
                  <AgentsSettings 
                    agents={agents}
                    config={config}
                    onUpdateAgent={onUpdateAgent}
                    onProfileChange={onProfileChange}
                  />
                )}
                
                {selectedCategory === 'consensus' && (
                  <ConsensusSettings config={config} />
                )}
                
                {selectedCategory === 'trading' && (
                  <TradingSettings config={config} />
                )}
                
                {selectedCategory === 'apis' && (
                  <ComingSoonPanel category="APIs" />
                )}
                
                {selectedCategory === 'llms' && (
                  <ComingSoonPanel category="LLMs" />
                )}
                
                {selectedCategory === 'environments' && (
                  <ComingSoonPanel category="Entornos" />
                )}
                
                {selectedCategory === 'security' && (
                  <ComingSoonPanel category="Seguridad" />
                )}
                
                {selectedCategory === 'backups' && (
                  <ComingSoonPanel category="Backups" />
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GeneralSettings({ config, onSimulationToggle }: { 
  config: SystemConfig; 
  onSimulationToggle: (enabled: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="pb-2">
        <h3 className="font-heading font-bold text-2xl sm:text-3xl mb-2 tracking-tight">General</h3>
        <p className="text-sm text-muted-foreground/80">
          Configuración básica del sistema de trading autónomo
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <h4 className="font-heading font-semibold text-sm sm:text-base mb-4 sm:mb-5 tracking-wide text-foreground/90">MODO DE OPERACIÓN</h4>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium mb-1 text-sm sm:text-base">Modo Simulación</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Ejecutar operaciones en modo simulado sin riesgo real. Desactivar para operar con capital real.
                </p>
              </div>
              <Switch
                checked={config.simulationMode}
                onCheckedChange={onSimulationToggle}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="p-3 sm:p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Capital Inicial</p>
                <p className="font-mono font-bold text-lg sm:text-xl">{formatCurrency(config.totalCapital)}</p>
                <p className="text-xs text-muted-foreground mt-1">Configurado por entorno</p>
              </div>
              
              <div className="p-3 sm:p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Estado del Sistema</p>
                <Badge variant="outline" className="border-accent text-accent">
                  Activo
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Todos los sistemas operativos</p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <h4 className="font-heading font-semibold text-sm sm:text-base mb-4 sm:mb-5 tracking-wide text-foreground/90">INTEGRACIONES</h4>
          
          <div className="space-y-4">
            <div className="p-3 sm:p-4 bg-background/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium mb-1 text-sm sm:text-base">Telegram</p>
                  <p className="text-xs text-muted-foreground">Notificaciones y control remoto</p>
                </div>
                <Badge variant="outline" className="border-destructive/50 text-destructive text-xs">
                  Desconectado
                </Badge>
              </div>
              <Button variant="outline" className="w-full text-sm" disabled>
                Configurar Conexión
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AgentsSettings({ 
  agents, 
  config, 
  onUpdateAgent, 
  onProfileChange 
}: { 
  agents: Agent[]; 
  config: SystemConfig;
  onUpdateAgent: (agentId: string, updates: Partial<Agent>) => void;
  onProfileChange: (profile: OrganizationalProfile) => void;
}) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="pb-4 flex-shrink-0">
        <h3 className="font-heading font-bold text-2xl sm:text-3xl mb-2 tracking-tight">Agentes</h3>
        <p className="text-sm text-muted-foreground/80">
          Gestión completa de agentes, roles, jerarquías y configuración de modelos LLM
        </p>
      </div>
      
      <div className="flex-1 min-h-0">
        <AgentAssignmentConfig
          agents={agents}
          onUpdateAgent={onUpdateAgent}
          onProfileChange={onProfileChange}
          currentProfile={config.organization?.profile ?? 'balanced'}
        />
      </div>
    </div>
  );
}

function ConsensusSettings({ config }: { config: SystemConfig }) {
  return (
    <div className="space-y-6">
      <div className="pb-2">
        <h3 className="font-heading font-bold text-2xl sm:text-3xl mb-2 tracking-tight">Consenso</h3>
        <p className="text-sm text-muted-foreground/80">
          Sistema de votación, vetos y toma de decisiones colectivas
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <h4 className="font-heading font-semibold text-sm sm:text-base mb-4 sm:mb-5 tracking-wide text-foreground/90">CONFIGURACIÓN DE CONSENSO</h4>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Umbral Mínimo</p>
                <p className="font-mono font-bold text-lg sm:text-xl">60%</p>
                <p className="text-xs text-muted-foreground mt-1">Consenso requerido</p>
              </div>
              
              <div className="p-3 sm:p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Sistema de Veto</p>
                <Badge variant="outline" className="border-accent text-accent text-xs">
                  Activo
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">3 agentes con veto</p>
              </div>
              
              <div className="p-3 sm:p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Director Override</p>
                <Badge variant="outline" className="border-warning text-warning text-xs">
                  Habilitado
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Autoridad máxima</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h5 className="font-medium mb-3 text-sm sm:text-base">Fórmula de Votación</h5>
              <div className="p-3 sm:p-4 bg-background/50 rounded-lg font-mono text-xs sm:text-sm">
                <p className="mb-2">Weighted Vote = <span className="text-primary">Influence</span> × <span className="text-accent">Reputation</span> × <span className="text-warning">Confidence</span></p>
                <p className="text-xs text-muted-foreground">
                  El consenso final se calcula sumando los votos ponderados de todos los agentes
                </p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <h4 className="font-heading font-semibold text-sm sm:text-base mb-4 sm:mb-5 tracking-wide text-foreground/90">AGENTES CON PODER DE VETO</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
              <span className="text-sm font-medium">Supervivencia</span>
              <Badge variant="outline" className="border-warning text-warning text-xs">Veto Crítico</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
              <span className="text-sm font-medium">Riesgo</span>
              <Badge variant="outline" className="border-warning text-warning text-xs">Veto Crítico</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
              <span className="text-sm font-medium">Auditor</span>
              <Badge variant="outline" className="border-warning text-warning text-xs">Veto Crítico</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
              <span className="text-sm font-medium">Director</span>
              <Badge variant="outline" className="border-destructive text-destructive text-xs">Override Absoluto</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function TradingSettings({ config }: { config: SystemConfig }) {
  return (
    <div className="space-y-6">
      <div className="pb-2">
        <h3 className="font-heading font-bold text-2xl sm:text-3xl mb-2 tracking-tight">Trading</h3>
        <p className="text-sm text-muted-foreground/80">
          Parámetros de riesgo, límites de operación y protecciones
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <h4 className="font-heading font-semibold text-sm sm:text-base mb-4 sm:mb-5 tracking-wide text-foreground/90">PARÁMETROS DE RIESGO</h4>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Reserva de Supervivencia</p>
                <p className="font-mono font-bold text-xl sm:text-2xl text-warning">{config.survivalReservePercent}%</p>
                <p className="text-xs text-muted-foreground mt-1">Capital bloqueado intocable</p>
              </div>
              
              <div className="p-3 sm:p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Capital Operativo</p>
                <p className="font-mono font-bold text-xl sm:text-2xl text-primary">{100 - config.survivalReservePercent}%</p>
                <p className="text-xs text-muted-foreground mt-1">Disponible para trading</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm font-medium">Riesgo Máximo por Operación</p>
                  <p className="font-mono font-semibold text-base sm:text-lg">{config.maxRiskPerOperation}%</p>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-warning rounded-full"
                    style={{ width: `${config.maxRiskPerOperation}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Del capital operativo</p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm font-medium">Límite de Pérdida Diaria</p>
                  <p className="font-mono font-semibold text-base sm:text-lg">{config.dailyLossLimit}%</p>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-destructive rounded-full"
                    style={{ width: `${config.dailyLossLimit}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Freno automático</p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <h4 className="font-heading font-semibold text-sm sm:text-base mb-4 sm:mb-5 tracking-wide text-foreground/90">PROTECCIONES ACTIVAS</h4>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <ShieldCheck size={18} className="text-accent flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Veto de Supervivencia</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <ShieldCheck size={18} className="text-accent flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Control de Riesgo</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <ShieldCheck size={18} className="text-accent flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Auditoría Obligatoria</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <ShieldCheck size={18} className="text-accent flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Límite Diario</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ComingSoonPanel({ category }: { category: string }) {
  return (
    <div className="space-y-6">
      <div className="pb-2">
        <h3 className="font-heading font-bold text-3xl mb-2 tracking-tight">{category}</h3>
        <p className="text-sm text-muted-foreground/80">
          Esta sección estará disponible próximamente
        </p>
      </div>
      
      <Card className="p-12 bg-card/50 backdrop-blur-sm text-center border-border/50">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Gear size={32} className="text-primary/60" />
          </div>
          <h4 className="font-heading font-semibold text-xl">Próximamente</h4>
          <p className="text-sm text-muted-foreground/70">
            La configuración de {category} se encuentra en desarrollo y estará disponible en futuras actualizaciones.
          </p>
          <Badge variant="outline" className="text-xs border-muted-foreground/30">
            En desarrollo
          </Badge>
        </div>
      </Card>
    </div>
  );
}
