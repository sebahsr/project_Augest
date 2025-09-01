// services/mqttService.js
const mqtt = require('mqtt');
const { saveTelemetry } = require('./telemetryService');
const { upsertFromIngest } = require('./deviceService');
const { saveEmergency } = require('./emergencyService');
const sockets = require('../sockets');

// ---------- Tunables ----------
const RECONNECT_MS = 2000;
const TRICKLE_MS = Number(process.env.TELEMETRY_TRICKLE_MS || 60_000);          // persist at most 1/min per device
const UPSERT_THROTTLE_MS = Number(process.env.DEVICE_UPSERT_THROTTLE_MS || 300_000); // upsert at most 1/5min per device
const LOG_VERBOSE = process.env.MQTT_LOG_VERBOSE === '1'; // default: quiet
// Thresholds used by the server to infer emergencies from telemetry
const LIMITS = {
  CO2:  { warn: 1000, danger: 1500 },
  CO:   { danger: 35 },            // ppm
  PM2_5:{ warn: 35, danger: 100 }, // µg/m³
  STOVE_TEMP: { danger: 250 }      // °C
};
// ------------------------------

let client;

// per-device cadence control
const lastPersistAt = new Map(); // deviceId -> ts
const lastUpsertAt = new Map();  // deviceId -> ts

// Track active danger types per device so we only persist on rising edges
// deviceId -> Set<string> of active danger types (e.g., "CO_DANGER", "PM2_5_DANGER")
const activeDangerByDevice = new Map();

function startMqtt() {
  const url =
    process.env.MQTT_URL ||
    'mqtts://43d915ee13464d378123cf8314cb259b.s1.eu.hivemq.cloud:8883';

  const opts = {
    username: process.env.MQTT_USERNAME || 'sebah',
    password: process.env.MQTT_PASSWORD || 'Ss123456789',
    reconnectPeriod: RECONNECT_MS,
    rejectUnauthorized: false, // dev only
  };

  client = mqtt.connect(url, opts);

  client.on('connect', () => {
    console.log('✅ MQTT connected:', url);
    client.subscribe(
      [
        // Primary shapes for  two nodes:
        'shega/+/airnode/data',
        'shega/+/stovenode/status',
        // (still accept device-generated events if they come back later)
        'shega/+/events',
        // Server fan-out alerts:
        'shega/alerts',
        // Legacy fallback:
        'shega/+/data',
        'shega/+/status',
      ],
      { qos: 0 },
      (err) => {
        if (err) console.error('MQTT subscribe error:', err.message);
        else if (LOG_VERBOSE) console.log(' Subscribed to air/stove/data/status, events, alerts.');
      }
    );
  });

  client.on('reconnect', () => LOG_VERBOSE && console.log('… MQTT reconnecting …'));
  client.on('error', (err) => console.error('MQTT error:', err.message));

  client.on('message', async (topic, buf) => {
    // Parse payload
    let raw;
    try {
      raw = JSON.parse(buf.toString());
    } catch (e) {
      if (LOG_VERBOSE) console.warn(`[MQTT] Non-JSON on ${topic}:`, buf.toString().slice(0, 200));
      return;
    }

    // Alerts side-channel → fan out only
    if (topic === 'shega/alerts') {
      try { sockets.emitAlert(raw); } catch {}
      return;
    }

    // Device EVENTS (emergencies/interventions/etc.) — still supported but optional now
    if (isEventsTopic(topic)) {
      try {
        const evt = normalizeEvent(topic, raw);
        if (!evt.homeId || !evt.deviceId || !evt.type) {
          if (LOG_VERBOSE) console.warn('[MQTT] Invalid event:', raw);
          return;
        }
        try { sockets.emitEvent(evt); } catch {}
        const emerg = eventToEmergency(evt);
        if (emerg) {
          const saved = await saveEmergency(emerg);
          try { sockets.emitAlert({ ...emerg, _id: saved?._id }); } catch {}
        }
      } catch (e) {
        console.error('EVENT handling error:', e.message);
      }
      return; // do not fall through to telemetry
    }

    // TELEMETRY / STATUS
    const msg = normalizeMessage(topic, raw);
    if (LOG_VERBOSE) {
      console.log(` ${topic} :: ${msg.homeId || '-'} / ${msg.deviceId || '-'} [${msg.stream || '-'}] @ ${msg.ts}`);
    }

    // Guards
    if (!msg.homeId || !msg.deviceId) {
      if (LOG_VERBOSE) console.warn('[MQTT] Missing homeId/deviceId, skipping:', raw);
      return;
    }
    if (!msg.stream) {
      if (LOG_VERBOSE) console.warn('[MQTT] Could not derive stream (AIR/STOVE), skipping:', raw);
      return;
    }

    try {
      // Upsert device (throttled)
      throttleUpsert(msg.homeId, msg.deviceId, msg.stream);

      // Decide persistence policy (alert or trickle)
      const alerts = computeAlertsForDecision(msg.payload);
      const shouldPersist = alerts.length > 0 || shouldTrickle(msg.deviceId, TRICKLE_MS);

      // Always craft a doc for live sockets
      let doc = {
        homeId: msg.homeId,
        deviceId: msg.deviceId,
        stream: msg.stream,
        payload: msg.payload,
        ts: msg.ts,
      };

      if (shouldPersist) {
        const deviceRef = await safeUpsertForPersist(msg.homeId, msg.deviceId, msg.stream);
        doc.deviceRef = deviceRef?._id;
        const saved = await saveTelemetry(doc);
        doc = saved?.toObject ? saved.toObject() : saved;
        if (LOG_VERBOSE) {
          console.log(` Telemetry saved: ${msg.deviceId} (${msg.stream}) ${alerts.length ? '[ALERT]' : '[TRICKLE]'}`);
        }
      }

      // Live push (every message)
      try { sockets.emitTelemetry(doc); } catch {}

      // —— NEW: Server-driven emergency detection from telemetry ——
      await evaluateAndPersistEmergenciesFromTelemetry(msg.homeId, msg.deviceId, msg.stream, msg.payload, msg.ts);

      // Still publish + emit alerts for UI if any
      if (alerts.length) maybePublishAlerts({ ...msg, alerts });
    } catch (e) {
      console.error('MQTT message error:', e.message);
    }
  });

  return client;
}

/* ----------------- Helpers: device upsert / trickle ----------------- */
async function throttleUpsert(homeId, deviceId, stream) {
  const now = Date.now();
  const last = lastUpsertAt.get(deviceId) || 0;
  if (now - last >= UPSERT_THROTTLE_MS) {
    await upsertFromIngest({ homeId, deviceId, stream });
    lastUpsertAt.set(deviceId, now);
  }
}
async function safeUpsertForPersist(homeId, deviceId, stream) {
  try { return await upsertFromIngest({ homeId, deviceId, stream }); }
  catch { return null; }
}
function shouldTrickle(deviceId, intervalMs) {
  const now = Date.now();
  const last = lastPersistAt.get(deviceId) || 0;
  if (now - last >= intervalMs) { lastPersistAt.set(deviceId, now); return true; }
  return false;
}

/* ----------------- Server-side Emergency from Telemetry ------------- */
async function evaluateAndPersistEmergenciesFromTelemetry(homeId, deviceId, stream, p = {}, tsISO) {
  // Which danger types are currently present based on telemetry?
  const nowDangerTypes = dangerTypesFromPayload(p, stream);
  // Which were previously active?
  const activeSet = activeDangerByDevice.get(deviceId) || new Set();

  // Rising edges: persist once per new danger type
  for (const dt of nowDangerTypes) {
    if (!activeSet.has(dt)) {
      // Persist emergency
      const emerg = {
        homeId,
        deviceId,
        type: dt,                    // e.g., 'CO_DANGER', 'PM2_5_DANGER', 'STOVE_TEMP_DANGER'
        severity: 'danger',
        detail: // include the snapshot context
          { co2: p.co2, co: p.co, pm25: p.pm25, pm10: p.pm10, stove_temp_c: p.stove_temp_c, temperature_c: p.temperature_c, humidity_pct: p.humidity_pct },
        ts: toISO(tsISO),
      };
      try {
        const saved = await saveEmergency(emerg);
        // Push to sockets so UI lights up immediately
        try { sockets.emitEvent({ ts: emerg.ts, homeId, deviceId, type: dt, detail: emerg.detail }); } catch {}
        try { sockets.emitAlert({ ...emerg, _id: saved?._id }); } catch {}
        // Optionally: publish a server-origin event on the events topic (for other devices)
        // publish(`shega/${homeId}/events`, { ts: emerg.ts, homeId, deviceId, type: dt, detail: emerg.detail });
        if (LOG_VERBOSE) console.log(`Persisted server-side emergency: ${deviceId} -> ${dt}`);
      } catch (e) {
        console.error('saveEmergency error:', e.message);
      }
      activeSet.add(dt);
    }
  }

  // Falling edges: if nothing dangerous remains, clear all active flags
  if (nowDangerTypes.size === 0 && activeSet.size) {
    activeSet.clear();
    // Optional: emit a CLEAR event for UX
    try {
      const clearEvt = { ts: toISO(tsISO), homeId, deviceId, type: 'AIR_SAFE', detail: { reason: 'CLEAR' } };
      sockets.emitEvent(clearEvt);
      // publish(`shega/${homeId}/events`, clearEvt); // if you want devices to react
    } catch {}
  }

  // Save the updated active set
  if (activeSet.size) activeDangerByDevice.set(deviceId, activeSet);
  else activeDangerByDevice.delete(deviceId);
}

function dangerTypesFromPayload(p = {}, stream) {
  const out = new Set();

  // Air-side dangers
  if (isFiniteNumber(p.co2) && p.co2 >= LIMITS.CO2.danger) out.add('CO2_DANGER');
  if (isFiniteNumber(p.co)  && p.co  >= LIMITS.CO.danger)  out.add('CO_DANGER');
  if (isFiniteNumber(p.pm25) && p.pm25 >= LIMITS.PM2_5.danger) out.add('PM2_5_DANGER');

  // Stove-side danger (even if reported on airnode, we still persist it if present)
  if (isFiniteNumber(p.stove_temp_c) && p.stove_temp_c >= LIMITS.STOVE_TEMP.danger) out.add('STOVE_TEMP_DANGER');

  return out;
}

/* ----------------- EVENTS handling (optional if devices send) ------- */
function isEventsTopic(topic) {
  // shega/HOME_01/events
  const parts = topic.split('/');
  return parts.length === 3 && parts[0] === 'shega' && parts[2] === 'events';
}
function normalizeEvent(topic, raw) {
  const ts = toISO(raw.ts);
  const parts = topic.split('/'); // [shega, HOME_XX, events]
  const homeId = raw.homeId || parts[1];
  const deviceId = raw.from || raw.deviceId || 'UNKNOWN';
  const type = String(raw.type || '').toUpperCase();
  const d = raw.detail || {};
  const detail = {
    ...d,
    stove_temp_c: pickNumber(d.stove_temp_c),
    co: pickNumber(d.co),
    pm25: pickNumber(d.pm25),
    reason: d.reason || d.why || d.action || undefined,
    action: d.action,
  };
  return { ts, homeId, deviceId, type, detail };
}
function eventToEmergency(evt) {
  const { homeId, deviceId, type, detail, ts } = evt;
  if (type === 'STOVE_EMERGENCY') {
    return { homeId, deviceId, type, severity: 'danger', detail, ts };
  }
  if (type === 'AIR_INTERVENTION' && (detail?.action === 'CO_DANGER' || detail?.reason === 'CO_DANGER')) {
    return { homeId, deviceId, type: 'CO_DANGER', severity: 'danger', detail, ts };
  }
  if (type === 'CONTROL_DENIED') {
    return { homeId, deviceId, type, severity: 'warn', detail, ts };
  }
  return null;
}

/* ----------------- TELEMETRY normalization ----------------- */
/**
 * Normalized message:
 * {
 *   ts: ISO,
 *   homeId: string,
 *   deviceId: string,
 *   stream: 'AIR' | 'STOVE',
 *   payload: {
 *     // AIR
 *     co2, co, pm25, pm10, temperature_c, humidity_pct, pressure_hpa?,
 *     // STOVE
 *     stove_temp_c, fanOn, buzzerOn, valveClosed,
 *     // Misc
 *     profile, windowOpen
 *   }
 * }
 */
function normalizeMessage(topic, raw) {
  const ts = toISO(raw.ts);

  // Parse topic parts
  // Air:   shega/HOME_01/airnode/data
  // Stove: shega/HOME_01/stovenode/status
  // Legacy: shega/HOME_01/data or status
  const parts = topic.split('/'); // [shega, HOME_01, airnode|stovenode|data|status, data|status?]
  const maybeHome = parts[1];

  const homeId =
    raw.homeId ||
    raw.home ||
    raw.h ||
    (isLikelyHomeId(maybeHome) ? maybeHome : extractHomeFromDevice(raw.deviceId));

  let deviceId = raw.deviceId || raw.device;
  let stream = (raw.stream && String(raw.stream).toUpperCase()) || inferStream(parts, raw);

  if (!deviceId && homeId && stream) {
    deviceId = (stream === 'STOVE' ? 'STOVE_' : 'AIR_') + homeId;
  }

  // Accept nested payload or flat fields
  const src = (raw.payload && typeof raw.payload === 'object') ? raw.payload : raw;

  // Canonical payload fields
  const payload = {
    // Air
    co2: pickNumber(src.co2, src.co2_ppm),
    co: pickNumber(src.co, src.co_ppm),
    pm25: pickNumber(src.pm25, src.pm25_ugm3, src.pm2_5, src.pm2_5_ugm3),
    pm10: pickNumber(src.pm10, src.pm10_ugm3),
    temperature_c: pickNumber(src.temperature_c, src.temp_c, src.temperature),
    humidity_pct: pickNumber(src.humidity_pct, src.humidity),
    pressure_hpa: pickNumber(src.pressure_hpa, src.pressure, src.pressure_hPa),

    // Stove
    stove_temp_c: pickNumber(src.stove_temp_c, src.stove_temp),
    fanOn: typeof src.fanOn === 'boolean' ? src.fanOn : undefined,
    buzzerOn: typeof src.buzzerOn === 'boolean' ? src.buzzerOn : undefined,
    valveClosed: typeof src.valveClosed === 'boolean' ? src.valveClosed : undefined,

    // Misc
    profile: src.profile,
    windowOpen: typeof src.windowOpen === 'boolean' ? src.windowOpen : undefined,
  };

  if (!stream) {
    if (isFiniteNumber(payload.stove_temp_c)) stream = 'STOVE';
    else if (
      isFiniteNumber(payload.co2) ||
      isFiniteNumber(payload.co) ||
      isFiniteNumber(payload.pm25) ||
      isFiniteNumber(payload.pm10) ||
      isFiniteNumber(payload.temperature_c) ||
      isFiniteNumber(payload.humidity_pct)
    ) stream = 'AIR';
  }

  return { ts, homeId, deviceId, stream, payload };
}

function inferStream(parts, raw) {
  const p2 = (parts[2] || '').toLowerCase();
  if (p2.includes('airnode')) return 'AIR';
  if (p2.includes('stovenode')) return 'STOVE';
  return (raw.stream && String(raw.stream).toUpperCase()) || undefined;
}

function isLikelyHomeId(s) {
  return typeof s === 'string' && /^HOME_\d{2,}$/.test(s);
}

function pickNumber(...candidates) {
  for (const v of candidates) {
    if (isFiniteNumber(v)) return Number(v);
  }
  return undefined;
}
function isFiniteNumber(v) { return typeof v === 'number' && Number.isFinite(v); }

function toISO(v) {
  if (!v) return new Date().toISOString();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function extractHomeFromDevice(deviceId) {
  if (!deviceId) return undefined;
  const m = String(deviceId).match(/HOME_\d{2,}/);
  return m ? m[0] : undefined;
}

/* ----------------- Alerts publishing (server-origin) ----------------- */
function maybePublishAlerts(msgWithAlerts) {
  if (!client) return;
  const p = msgWithAlerts.payload || {};
  const alerts = msgWithAlerts.alerts || [];
  if (!alerts.length) return;

  const payload = {
    homeId: msgWithAlerts.homeId,
    deviceId: msgWithAlerts.deviceId,
    stream: msgWithAlerts.stream,
    ts: new Date().toISOString(),
    alerts: alerts
      .map((a) => (typeof a === 'string' ? inflateAlert(a, p) : a))
      .filter(Boolean),
  };

  const str = JSON.stringify(payload);
  client.publish('shega/alerts', str, { qos: 0, retain: false });
  if (LOG_VERBOSE) console.log('🚨 Alert published → shega/alerts', str);
  try { sockets.emitAlert(payload); } catch {}
}

// Alerts still power the UI badges; independent of emergencies
function computeAlertsForDecision(p = {}) {
  const out = [];
  if (isFiniteNumber(p.co2) && p.co2 > LIMITS.CO2.warn) out.push('CO2');
  if (isFiniteNumber(p.co) && p.co > LIMITS.CO.danger) out.push('CO');
  if (isFiniteNumber(p.pm25) && p.pm25 > LIMITS.PM2_5.warn) out.push('PM2_5');
  if (isFiniteNumber(p.stove_temp_c) && p.stove_temp_c > LIMITS.STOVE_TEMP.danger) out.push('STOVE_TEMP');
  return out;
}
function inflateAlert(type, p) {
  switch (type) {
    case 'CO2':      return { type: 'CO2',      level: p.co2 > LIMITS.CO2.danger ? 'danger' : 'warn', value: p.co2, limit: LIMITS.CO2.warn };
    case 'CO':       return { type: 'CO',       level: 'danger', value: p.co, limit: LIMITS.CO.danger };
    case 'PM2_5':    return { type: 'PM2_5',    level: p.pm25 > LIMITS.PM2_5.danger ? 'danger' : 'warn', value: p.pm25, limit: LIMITS.PM2_5.warn };
    case 'STOVE_TEMP': return { type: 'STOVE_TEMP', level: 'danger', value: p.stove_temp_c, limit: LIMITS.STOVE_TEMP.danger };
    default: return null;
  }
}

/* ----------------- Command-focused publish helpers ----------------- */
function emitCommandSent(homeId, payload) {
  const evt = {
    ts: new Date().toISOString(),
    homeId,
    deviceId: 'SERVER',
    type: 'COMMAND_SENT',
    detail: {
      target: (payload && payload.target) || 'ALL',
      actions: (payload && payload.actions) || {},
      actor: payload?.meta?.actor,
    },
  };
  try { sockets.emitEvent && sockets.emitEvent(evt); } catch {}
}
function publishControl(homeId, actions, target = 'ALL', meta = {}) {
  const payload = { target, actions, meta };
  publish(`shega/${homeId}/control`, payload);
}
function publish(topic, json) {
  if (!client) throw new Error('MQTT not started');
  let obj = json;
  try { if (typeof obj === 'string') obj = JSON.parse(obj); } catch {}
  if (/^shega\/[^/]+\/control$/.test(topic)) {
    const homeId = topic.split('/')[1];
    const target = (obj && obj.target) || 'ALL';
    const actions = (obj && obj.actions) || {};
    console.log(` CONTROL → home=${homeId} target=${target} actions=${JSON.stringify(actions)}`);
    emitCommandSent(homeId, obj);
  }
  const payload = typeof json === 'string' ? json : JSON.stringify(json);
  client.publish(topic, payload, { qos: 0, retain: false });
}

module.exports = { startMqtt, publish, publishControl };
