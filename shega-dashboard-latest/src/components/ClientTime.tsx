'use client';

import { useEffect, useState } from 'react';

/**
 * Client-only time formatter that avoids hydration mismatch.
 * Renders a stable placeholder on the server, then formats on the client.
 */
export default function ClientTime({
  iso,
  locale = 'en-GB',                 // choose one and keep it consistent
  timeZone = 'Europe/Rome',         //  project TZ
  options = { dateStyle: 'short', timeStyle: 'medium' } as Intl.DateTimeFormatOptions,
}: {
  iso: string;
  locale?: string;
  timeZone?: string;
  options?: Intl.DateTimeFormatOptions;
}) {
  const [txt, setTxt] = useState<string>(() => {
    // Server-rendered placeholder: stable ISO (no locale)
    // This prevents SSR/client mismatch.
    const d = new Date(iso);
    // ISO without milliseconds, in UTC for stability
    return d.toISOString().replace('T', ' ').replace('Z', ' UTC').replace(/\.\d{3}/, '');
  });

  useEffect(() => {
    try {
      const d = new Date(iso);
      setTxt(new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(d));
    } catch {
      // keep placeholder if Intl fails
    }
  }, [iso, locale, timeZone, options]);

  return (
    <time dateTime={iso} suppressHydrationWarning>
      {txt}
    </time>
  );
}
