export type Role = 'admin' | 'user';
export type DeviceType = 'AIRNODE' | 'STOVENODE';
export type DeviceStatus = 'online' | 'offline' | 'unknown';


export type Owner = { _id: string; name?: string; email: string; role: Role };

export type HomeRow = {
  homeId: string;
  totalDevices: number;
  statusCounts: Partial<Record<DeviceStatus, number>>;
  lastSeenAt: string | null;
  devices: { deviceId: string; name: string; type: DeviceType; status: DeviceStatus }[];
  owners: Owner[];
};

export type HomesResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  homes: HomeRow[];
};
export type Telemetry = {
  temp?: number;
  humid?: number;
  co2?: number;
  co?: number;
  pm25?: number;
  pm10?: number;
  stoveTemp?: number;
  status?: string;
};
export type House = {
  houseId: string;
  address: string;
  devices: Array<{
    deviceId: string;
    kind: string;
  }>;
};
export type Device = {
  _id: string;
  deviceId: string;
  type: DeviceType;
  name?: string;
  location?: string;
  status: DeviceStatus;
  lastSeenAt?: string | null;
  lastTs?:string | null;
  owner?: Owner | string | null;
  firmware?: string;
  metadata?: Record<string, any>;
};

export type HomeDetail = {
  homeId: string;
  totalDevices: number;
  statusCounts: Partial<Record<DeviceStatus, number>>;
  byTypeCounts: Partial<Record<DeviceType, number>>;
  lastSeenAt: string | null;
  devices: Device[];
  owners: Owner[];
};
