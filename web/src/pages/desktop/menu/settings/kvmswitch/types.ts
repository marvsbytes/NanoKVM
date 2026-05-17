export type KvmSwitchState = 'disconnected' | 'connected';

export type Status = {
  connected: boolean;
  model: string;
  host: string;
  port: string;
  currentPort: number;
  portCount: number;
};
