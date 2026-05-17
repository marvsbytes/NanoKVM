import { atom } from 'jotai';

export type KvmSwitchState = 'disconnected' | 'connected';

export type KvmSwitchStatus = {
  connected: boolean;
  model: string;
  currentPort: number;
  portCount: number;
};

export const kvmSwitchStatusAtom = atom<KvmSwitchStatus | null>(null);

export const kvmSwitchPortNamesAtom = atom<string[]>([]);
