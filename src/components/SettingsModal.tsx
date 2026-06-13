import { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
      <DialogContent className="w-[90vw] max-w-[1400px] h-[85vh] p-0 gap-0">
        <div className="flex h-full">
          <div className="w-[20%] min-w-[220px] border-r border-border bg-card/30 backdrop-blur-sm flex flex-col">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-heading font-bold text-xl">CONFIGURACIÓN</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => onOpenChange(false)}
                >
                  <X size={20} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Sistema Aurora Capital</p>
            </div>
            
            <ScrollArea className="flex-1">
              <nav className="p-3 space-y-1">
                {CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategory === category.id;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => !category.comingSoon && setSelectedCategory(category.id)}
                      disabled={category.comingSoon}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left",
                        isSelected 
                          ? "bg-primary/10 border border-primary" 
                          : category.comingSoon
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-background/50"
                      )}
                    >
                      <Icon size={20} weight={isSelected ? "fill" : "regular"} className={isSelected ? "text-primary mt-0.5" : "text-muted-foreground mt-0.5"} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "text-sm font-medium",
                            isSelected ? "text-primary" : "text-foreground"
                          )}>
                            {category.label}
                          </p>
                          {category.comingSoon && (
                            <Badge variant="outline" className="text-xs py-0 h-4 text-muted-foreground">
                              Próximamente
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {category.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </ScrollArea>
          </div>
          
          <div className="flex-1 flex flex-col min-w-0">
            <ScrollArea className="flex-1">
              <div className="p-8">
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
            </ScrollArea>
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
      <div>
        <h3 className="font-heading font-bold text-2xl mb-2">General</h3>
        <p className="text-sm text-muted-foreground">
          Configuración básica del sistema de trading autónomo
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <h4 className="font-heading font-semibold text-lg mb-4">MODO DE OPERACIÓN</h4>
          
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium mb-1">Modo Simulación</p>
                <p className="text-sm text-muted-foreground">
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
              <div className="p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Capital Inicial</p>
                <p className="font-mono font-bold text-xl">{formatCurrency(config.totalCapital)}</p>
                <p className="text-xs text-muted-foreground mt-1">Configurado por entorno</p>
              </div>
              
              <div className="p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Estado del Sistema</p>
                <Badge variant="outline" className="border-accent text-accent">
                  Activo
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Todos los sistemas operativos</p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <h4 className="font-heading font-semibold text-lg mb-4">INTEGRACIONES</h4>
          
          <div className="space-y-4">
            <div className="p-4 bg-background/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium mb-1">Telegram</p>
                  <p className="text-xs text-muted-foreground">Notificaciones y control remoto</p>
                </div>
                <Badge variant="outline" className="border-destructive/50 text-destructive">
                  Desconectado
                </Badge>
              </div>
              <Button variant="outline" className="w-full" disabled>
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
    <div className="space-y-6">
      <div>
        <h3 className="font-heading font-bold text-2xl mb-2">Agentes</h3>
        <p className="text-sm text-muted-foreground">
          Gestión completa de agentes, roles, jerarquías y configuración de modelos LLM
        </p>
      </div>
      
      <AgentAssignmentConfig
        agents={agents}
        onUpdateAgent={onUpdateAgent}
        onProfileChange={onProfileChange}
        currentProfile={config.organization?.profile ?? 'balanced'}
      />
    </div>
  );
}

function ConsensusSettings({ config }: { config: SystemConfig }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading font-bold text-2xl mb-2">Consenso</h3>
        <p className="text-sm text-muted-foreground">
          Sistema de votación, vetos y toma de decisiones colectivas
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <h4 className="font-heading font-semibold text-lg mb-4">CONFIGURACIÓN DE CONSENSO</h4>
          
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Umbral Mínimo</p>
                <p className="font-mono font-bold text-xl">60%</p>
                <p className="text-xs text-muted-foreground mt-1">Consenso requerido</p>
              </div>
              
              <div className="p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Sistema de Veto</p>
                <Badge variant="outline" className="border-accent text-accent">
                  Activo
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">3 agentes con veto</p>
              </div>
              
              <div className="p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Director Override</p>
                <Badge variant="outline" className="border-warning text-warning">
                  Habilitado
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Autoridad máxima</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h5 className="font-medium mb-3">Fórmula de Votación</h5>
              <div className="p-4 bg-background/50 rounded-lg font-mono text-sm">
                <p className="mb-2">Weighted Vote = <span className="text-primary">Influence</span> × <span className="text-accent">Reputation</span> × <span className="text-warning">Confidence</span></p>
                <p className="text-xs text-muted-foreground">
                  El consenso final se calcula sumando los votos ponderados de todos los agentes
                </p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <h4 className="font-heading font-semibold text-lg mb-4">AGENTES CON PODER DE VETO</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
              <span className="text-sm font-medium">Supervivencia</span>
              <Badge variant="outline" className="border-warning text-warning">Veto Crítico</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
              <span className="text-sm font-medium">Riesgo</span>
              <Badge variant="outline" className="border-warning text-warning">Veto Crítico</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
              <span className="text-sm font-medium">Auditor</span>
              <Badge variant="outline" className="border-warning text-warning">Veto Crítico</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
              <span className="text-sm font-medium">Director</span>
              <Badge variant="outline" className="border-destructive text-destructive">Override Absoluto</Badge>
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
      <div>
        <h3 className="font-heading font-bold text-2xl mb-2">Trading</h3>
        <p className="text-sm text-muted-foreground">
          Parámetros de riesgo, límites de operación y protecciones
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <h4 className="font-heading font-semibold text-lg mb-4">PARÁMETROS DE RIESGO</h4>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Reserva de Supervivencia</p>
                <p className="font-mono font-bold text-2xl text-warning">{config.survivalReservePercent}%</p>
                <p className="text-xs text-muted-foreground mt-1">Capital bloqueado intocable</p>
              </div>
              
              <div className="p-4 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Capital Operativo</p>
                <p className="font-mono font-bold text-2xl text-primary">{100 - config.survivalReservePercent}%</p>
                <p className="text-xs text-muted-foreground mt-1">Disponible para trading</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Riesgo Máximo por Operación</p>
                  <p className="font-mono font-semibold text-lg">{config.maxRiskPerOperation}%</p>
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
                  <p className="text-sm font-medium">Límite de Pérdida Diaria</p>
                  <p className="font-mono font-semibold text-lg">{config.dailyLossLimit}%</p>
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
        
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
          <h4 className="font-heading font-semibold text-lg mb-4">PROTECCIONES ACTIVAS</h4>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <ShieldCheck size={20} className="text-accent" />
              <span className="text-sm font-medium">Veto de Supervivencia</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <ShieldCheck size={20} className="text-accent" />
              <span className="text-sm font-medium">Control de Riesgo</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <ShieldCheck size={20} className="text-accent" />
              <span className="text-sm font-medium">Auditoría Obligatoria</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <ShieldCheck size={20} className="text-accent" />
              <span className="text-sm font-medium">Límite Diario</span>
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
      <div>
        <h3 className="font-heading font-bold text-2xl mb-2">{category}</h3>
        <p className="text-sm text-muted-foreground">
          Esta sección estará disponible próximamente
        </p>
      </div>
      
      <Card className="p-12 bg-card/50 backdrop-blur-sm text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Gear size={32} className="text-primary" />
          </div>
          <h4 className="font-heading font-semibold text-xl">Próximamente</h4>
          <p className="text-sm text-muted-foreground">
            La configuración de {category} se encuentra en desarrollo y estará disponible en futuras actualizaciones.
          </p>
          <Badge variant="outline" className="text-xs">
            En desarrollo
          </Badge>
        </div>
      </Card>
    </div>
  );
}
