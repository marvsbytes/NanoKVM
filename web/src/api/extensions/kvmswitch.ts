import { http } from '@/lib/http.ts';

// get kvm switch connection status and current port
export function getStatus() {
  return http.get('/api/extensions/kvmswitch/status');
}

// connect to a kvm switch device
export function connect(data: {
  model: string;
  host?: string;
  port?: string;
  portCount?: number;
}) {
  return http.post('/api/extensions/kvmswitch/connect', data);
}

// disconnect from the active kvm switch device
export function disconnect() {
  return http.post('/api/extensions/kvmswitch/disconnect');
}

// switch to a port (1-based)
export function switchPort(port: number) {
  return http.post('/api/extensions/kvmswitch/switch', { port });
}

// get on-device port names
export function getPortNames() {
  return http.get('/api/extensions/kvmswitch/port-names');
}

// update on-device port names
export function setPortNames(names: string[]) {
  return http.post('/api/extensions/kvmswitch/port-names', { names });
}
