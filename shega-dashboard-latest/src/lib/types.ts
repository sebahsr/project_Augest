export type Role = 'user' | 'admin';
export type DeviceKind = 'AirNode' | 'StoveNode';

export type Device = {
  id: string;
  kind: DeviceKind;
  homeId: string;
  ownerId: string;
  status: 'online'|'offline';
};
