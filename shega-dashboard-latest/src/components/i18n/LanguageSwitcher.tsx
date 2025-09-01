// src/components/i18n/LanguageSwitcher.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '@/components/i18n/I18nProvider';
import type { Lang } from '@/lib/i18n';

export default function LanguageSwitcher({
  className = 'inline-flex items-center gap-1 rounded-xl border px-2.5 py-2 text-sm hover:bg-gray-50',
}: { className?: string }) {
  const router = useRouter();
  const { lang, t } = useI18n();
  const [open, setOpen] = React.useState(false);

  async function setLang(next: Lang) {
    await fetch('/api/lang', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lang: next }),
    });
    setOpen(false);
    router.refresh(); // re-render with new cookie
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('language')}
        className={className}
        onClick={() => setOpen((o) => !o)}
      >
        {lang === 'en' ? 'EN' : 'አማ'} <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="listbox"
          className="fixed  mt-1 w-28 rounded-xl border bg-white shadow-lg overflow-hidden z-1000"
        >
          {(['en', 'am'] as Lang[]).map((code) => (
            <button
              key={code}
              role="option"
              aria-selected={lang === code}
              onClick={() => setLang(code)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                lang === code ? 'bg-gray-50' : ''
              }`}
            >
              {code === 'en' ? 'EN' : 'አማ'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
