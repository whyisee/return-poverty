export type GameMode = 'quick' | 'full';
export type GamePhase =
  | 'motivation'
  | 'precheck'
  | 'track_select'
  | 'preparation'
  | 'opening'
  | 'stable'
  | 'crisis'
  | 'report';

export interface GameMetrics {
  cash: number;
  debt: number;
  dailyNetCashFlow: number;
  weeklyNetCashFlow: number;
  survivalDays: number;
  familyPressure: number;
  energy: number;
  reputation: number;
  repeatRate: number;
  information: number;
  impulse: number;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  initialMetrics: GameMetrics;
  advantages: string[];
  risks: string[];
}

export interface BusinessTrack {
  id: string;
  name: string;
  description: string;
  baseParams: Record<string, number>;
  strengths: string[];
  risks: string[];
  uniqueSystems: string[];
}

export interface OpeningPackage {
  id: string;
  name: string;
  description: string;
  effect: Record<string, number>;
}

export interface BootstrapContent {
  contentVersion: string;
  roles: Role[];
  businessTracks: BusinessTrack[];
  openingPackages: OpeningPackage[];
  phases: Array<{ id: GamePhase; name: string }>;
}

export interface GameSession {
  id: string;
  contentVersion: string;
  mode: GameMode;
  status: 'active' | 'finished' | 'abandoned';
  phase: GamePhase;
  day: number;
  week: number;
  roleId: string;
  businessTrackId?: string;
  openingPackageId?: string;
  metrics: GameMetrics;
  flags: Record<string, boolean | number | string>;
}

export interface EventCard {
  id: string;
  phase: GamePhase;
  category: string;
  title: string;
  content: string;
  effect: Record<string, number>;
  weight: number;
}

export interface DecisionCard {
  id: string;
  title: string;
  phase: GamePhase;
  description: string;
  cost: Record<string, number>;
  effect: Record<string, number>;
  risk: string[];
  insight: string;
}

export interface AvailableDecisionsResponse {
  phase: GamePhase;
  day: number;
  week: number;
  event?: EventCard;
  decisions: DecisionCard[];
}

export interface LedgerEntry {
  periodType: 'day' | 'week';
  periodIndex: number;
  revenueAmount: number;
  materialCost: number;
  laborCost: number;
  rentCost: number;
  platformFee: number;
  discountCost: number;
  marketingCost: number;
  wasteCost: number;
  utilityCost: number;
  repairCost: number;
  operationNetCashFlow: number;
  familyCost: number;
  loanPayment: number;
  familyNetCashFlow: number;
  detail: Record<string, number | string | string[]>;
}

export interface RiskAlert {
  level: 'info' | 'warning' | 'danger';
  message: string;
}

export interface SimulateResponse {
  session: GameSession;
  eventResult: {
    title: string;
    message: string;
  };
  actionLogs: string[];
  ledger: LedgerEntry;
  riskAlerts: RiskAlert[];
}

export interface Report {
  endingType: string;
  title: string;
  summary: string;
  totalRevenue: number;
  totalNetCashFlow: number;
  maxLossSources: string[];
  rightDecisions: string[];
  dangerousDecisions: string[];
  suggestion: string;
  shareText: string;
  reportDetail: Record<string, number | string | string[]>;
}
