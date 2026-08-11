import type { ShibieApi } from '@shared/contracts';

declare global {
  interface Window {
    api: ShibieApi;
  }
}

export {};
