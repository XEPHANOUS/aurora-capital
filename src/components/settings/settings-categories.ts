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
} from '@phosphor-icons/react';
import type { CategoryItem } from '@/components/settings/types';

export const SETTINGS_CATEGORIES: CategoryItem[] = [
  {
    id: 'general',
    label: 'General',
    icon: Gear,
    description: 'Configuracion basica del sistema',
  },
  {
    id: 'agents',
    label: 'Agentes',
    icon: Users,
    description: 'Gestion y configuracion de agentes',
  },
  {
    id: 'consensus',
    label: 'Consenso',
    icon: GitBranch,
    description: 'Sistema de votacion y decisiones',
  },
  {
    id: 'apis',
    label: 'APIs',
    icon: Plug,
    description: 'Integraciones y conexiones externas',
  },
  {
    id: 'llms',
    label: 'LLMs',
    icon: Brain,
    description: 'Modelos de lenguaje',
  },
  {
    id: 'trading',
    label: 'Trading',
    icon: CurrencyDollar,
    description: 'Parametros de operacion',
  },
  {
    id: 'environments',
    label: 'Entornos',
    icon: Globe,
    description: 'Configuracion multi-entorno',
  },
  {
    id: 'security',
    label: 'Seguridad',
    icon: ShieldCheck,
    description: 'Permisos y autenticacion',
  },
  {
    id: 'backups',
    label: 'Backups',
    icon: Database,
    description: 'Respaldos y recuperacion',
  },
];
