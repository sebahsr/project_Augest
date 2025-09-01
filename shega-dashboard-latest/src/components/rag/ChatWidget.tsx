'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useI18n } from '@/components/i18n/I18nProvider';
import {getUserHouseId} from '@/lib/api/dashboard.client'
import { io, Socket } from 'socket.io-client';

type Msg = { role: 'user' | 'assistant'; content: string; sources?: any[] };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000/api';
const WS_BASE  = process.env.NEXT_PUBLIC_WS_URL   || 'http://127.0.0.1:3000/live';

export default function ChatWidget({ houseId: initialHouseId }: { houseId?: string }) {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [houseId, setHouseId] = useState<string | undefined>(initialHouseId);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      content:
        lang === 'am'
          ? 'ሰላም! ሁኔታዎን ሳትለቅ ጠይቁ። ለምሳሌ፡ “የቤቴ ሁኔታ አሁን?”'
          : 'Hi! Ask while you watch your live data. For example: “How is my house right now?”',
    },
  ]);

  // LIVE telemetry state (AIR + STOVE)
  const [air, setAir] = useState<{ co2_ppm?: number; co_ppm?: number; pm25_ugm3?: number; temp_c?: number }>({});
  const [stove, setStove] = useState<{ stove_temp_c?: number; fan_on?: boolean; buzzer_on?: boolean }>({});
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // resolve houseId if not passed in
  useEffect(() => {
    if (initialHouseId) return;
    (async () => {
      const id = await getUserHouseId();
      setHouseId(id ?? undefined);
    })();
  }, [initialHouseId]);

  // socket lifecycle
  useEffect(() => {

    if (!houseId) return;
     
    const socket: Socket = io(WS_BASE, {
      withCredentials: true,
      transports: ['websocket'],
      auth: { role: 'user', homeId: houseId },
    });

    socket.on('connect', () => {
      setWsConnected(true);
      socket.emit('join:home', houseId);
    });

    socket.on('disconnect', () => setWsConnected(false));
    socket.on('connect_error', (err) => console.error('WS connect_error', err));

    // snapshot (optional): expect latestAir & latestStove if  backend provides them
    socket.on('home:snapshot', (snap: any) => {
      const a = snap?.latestAir || {};
      const s = snap?.latestStove || {};
      setAir((cur) => ({
        ...cur,
        co2_ppm: a.co2 ?? cur.co2_ppm,
        co_ppm: a.co ?? cur.co_ppm,
        pm25_ugm3: a.pm25 ?? cur.pm25_ugm3,
        temp_c: a.temperature_c ?? cur.temp_c,
      }));
      setStove((cur) => ({
        ...cur,
        stove_temp_c: s.stove_temp_c ?? cur.stove_temp_c, // adjust if  field is 'stoveTempC' etc.
        fan_on: s.fan_on ?? cur.fan_on,
        buzzer_on: s.buzzer_on ?? cur.buzzer_on,
      }));
    });

    // high-frequency telemetry stream
    socket.on('telemetry', (payload: any) => {
      const doc = payload?.doc;

      if (doc?.stream === 'AIR') {
        const p = doc.payload || {};
        setAir({
          co2_ppm: p.co2 ?? undefined,
          co_ppm: p.co ?? undefined,
          pm25_ugm3: p.pm25 ?? undefined,
          temp_c: p.temperature_c ?? undefined,
        });
      }

      if (doc?.stream === 'STOVE') {
        const p = doc.payload || {};
        setStove({
          stove_temp_c: p.stove_temp_c ?? undefined, // adjust if emitter uses different key
          fan_on: p.fan_on ?? undefined,
          buzzer_on: p.buzzer_on ?? undefined,
        });
      }
    });

    return () => {
      socket.disconnect();
      socket.close();
    };
  }, [houseId]);

  // auto-scroll
  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' });
  }, [open, messages, busy]);

  function attachSourcesToLastAssistant(sources: any[]) {
    setMessages((m) => {
      for (let i = m.length - 1; i >= 0; i--) {
        if (m[i].role === 'assistant' && m[i].content !== '…') {
          const merged = [...m];
          merged[i] = { ...merged[i], sources };
          return merged;
        }
      }
      return m;
    });
  }

  function setAssistantDelta(delta: string) {
    setMessages((m) => {
      const last = m[m.length - 1];
      if (last?.role === 'assistant') {
        const merged = [...m];
        merged[merged.length - 1] = { ...last, content: (last.content || '') + delta };
        return merged;
      }
      return [...m, { role: 'assistant', content: delta }];
    });
  }

  async function send() {
    const q = input.trim();
    if (!q || busy || !houseId) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: q }, { role: 'assistant', content: '…' }]);
    setBusy(true);
    console.log("message:", messages)
    try {
      const res = await fetch(`${API_BASE}/rag/chat/stream`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        // include freshest client-side readings from BOTH nodes (server can still override from DB)
        body: JSON.stringify({
          question: q,
          houseId,
          locale: lang,
          telemetry: {
            // AirNode
            co2_ppm: air.co2_ppm,
            co_ppm: air.co_ppm,
            pm25_ugm3: air.pm25_ugm3,
            temp_c: air.temp_c,
            // StoveNode
            stove_temp_c: stove.stove_temp_c,
            stove_fan_on: stove.fan_on,
            stove_buzzer_on: stove.buzzer_on,
          },
        }),
      });

      if (!res.ok || !res.body) throw new Error(`RAG stream failed: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // turn the '…' bubble into real text on first payload
      let typingCleared = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const packet = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          if (!packet || packet.startsWith(':')) continue; // heartbeat

          if (packet.startsWith('data: ')) {
            const json = packet.slice(6);
            try {
              const parsed = JSON.parse(json);

              if (!typingCleared) {
                setMessages((m) => {
                  const merged = [...m];
                  const last = merged[merged.length - 1];
                  if (last?.role === 'assistant' && last.content === '…') {
                    merged[merged.length - 1] = { role: 'assistant', content: '' };
                  }
                  return merged;
                });
                typingCleared = true;
              }

              if (parsed.sources) attachSourcesToLastAssistant(parsed.sources);
              if (parsed.delta) setAssistantDelta(parsed.delta);
            } catch {
              // ignore malformed packets
            }
          }
        }
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content:
            lang === 'am'
              ? 'ይቅርታ፣ አገናኝ ችግር ተከስቷል። እባክዎ እንደገና ይሞክሩ።'
              : 'Sorry, I hit a connection snag. Please try again.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const liveLine =
    // show something if either node has data
    (air.co2_ppm ?? air.co_ppm ?? air.pm25_ugm3 ?? air.temp_c ?? stove.stove_temp_c) !== undefined
      ? (lang === 'am'
          ? `ቀጥታ፡ CO₂ ${air.co2_ppm ?? '—'} ppm • CO ${air.co_ppm ?? '—'} ppm • PM2.5 ${air.pm25_ugm3 ?? '—'} µg/m³ • ሙቀት ${air.temp_c ?? '—'}°C • ስቶቭ ${stove.stove_temp_c ?? '—'}°C`
          : `Live: CO₂ ${air.co2_ppm ?? '—'} ppm • CO ${air.co_ppm ?? '—'} ppm • PM2.5 ${air.pm25_ugm3 ?? '—'} µg/m³ • Temp ${air.temp_c ?? '—'}°C • Stove ${stove.stove_temp_c ?? '—'}°C`)
      : wsConnected
      ? (lang === 'am' ? 'ቀጥታ መረጃ በመጫን ላይ…' : 'Loading live data…')
      : (lang === 'am' ? 'መገናኘት በመሞከር ላይ…' : 'Connecting…');

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 h-12 w-12 rounded-full shadow-xl bg-black/80 text-white flex items-center justify-center hover:scale-105 transition"
          aria-label="Open SHEGA Assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 w-[360px] max-w-[90vw] rounded-2xl shadow-2xl bg-white ring-1 ring-black/10 flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between">
            <div className="font-semibold">{lang === 'am' ? 'SHEGA አጋዥ' : 'SHEGA Assistant'}</div>
            <button onClick={() => setOpen(false)} className="opacity-90 hover:opacity-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* live line */}
          <div className="px-3 py-1 text-[11px] text-slate-600 bg-slate-50 border-b">
            {houseId ? liveLine : (lang === 'am' ? 'ቤት መለያ በመፈለግ ላይ…' : 'Resolving house…')}
          </div>

          <div ref={scrollRef} className="px-3 py-3 h-96 overflow-y-auto space-y-3 bg-slate-50">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'ml-auto bg-indigo-600 text-white shadow'
                    : 'mr-auto bg-white text-slate-900 shadow ring-1 ring-slate-200'
                }`}
              >
                {m.content === '…' ? (
                  <div className="flex items-center gap-2">
                    <span className="italic opacity-70">{lang === 'am' ? 'በመፃፍ ላይ…' : 'Typing…'}</span>
                    <span className="inline-block h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-.2s]" />
                    <span className="inline-block h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
                    <span className="inline-block h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:.2s]" />
                  </div>
                ) : (
                  <>
                    <div>{m.content}</div>
                    {!!m.sources?.length && (
                      <div className="mt-1 text-[11px] text-slate-500">
                        {lang === 'am' ? 'መሠረት' : 'Based on'}: {m.sources.length}{' '}
                        {lang === 'am' ? 'ምንጮች' : 'sources'}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="p-2 border-t bg-white flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => (e.key === 'Enter' ? send() : undefined)}
              placeholder={lang === 'am' ? 'ጥያቄዎን ይጻፉ…' : 'Type  question…'}
              className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
              disabled={busy || !houseId}
            />
            <button
              onClick={send}
              disabled={busy || !houseId}
              className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:scale-105 disabled:opacity-50 relative"
              aria-label="Send"
            >
              {!busy ? (
                <Send className="h-4 w-4" />
              ) : (
                <span className="block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
            </button>
          </div>

          {/* Quick actions */}
          <div className="px-3 pb-3 bg-white">
            <div className="flex flex-wrap gap-2">
              {[
                lang === 'am' ? 'እንዴት ነው የምትሠራው' : 'who are you?',
                lang === 'am' ? 'የቤቴ ሁኔታ አሁን?' : 'how is my house ?',
               
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-xs rounded-full px-3 py-1 bg-slate-100 hover:bg-slate-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
