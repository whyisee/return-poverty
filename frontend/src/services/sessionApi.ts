import { http } from './http';
import type {
  AvailableDecisionsResponse,
  GameMode,
  GameSession,
  LedgerEntry,
  Report,
  SimulateResponse,
} from '../types/game';

export interface CreateSessionPayload {
  mode: GameMode;
  roleId: string;
  businessTrackId: string;
  openingPackageId: string;
}

export function createSession(payload: CreateSessionPayload) {
  return http.post<unknown, GameSession>('/sessions', payload);
}

export function getSession(sessionId: string) {
  return http.get<unknown, GameSession>(`/sessions/${sessionId}`);
}

export function getAvailableDecisions(sessionId: string) {
  return http.get<unknown, AvailableDecisionsResponse>(`/sessions/${sessionId}/available-decisions`);
}

export function simulate(sessionId: string, decisionIds: string[], eventId?: string) {
  return http.post<unknown, SimulateResponse>(`/sessions/${sessionId}/simulate`, {
    decisionIds,
    eventId,
  });
}

export function getLedgers(sessionId: string) {
  return http.get<unknown, LedgerEntry[]>(`/sessions/${sessionId}/ledgers`);
}

export function generateReport(sessionId: string) {
  return http.post<unknown, Report>(`/sessions/${sessionId}/report`);
}

