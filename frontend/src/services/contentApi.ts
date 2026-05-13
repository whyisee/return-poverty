import { http } from './http';
import type { BootstrapContent } from '../types/game';

export function getBootstrap() {
  return http.get<unknown, BootstrapContent>('/content/bootstrap');
}

