'use client';

import React, { createContext, useContext } from 'react';
import type { Lang } from '@/lib/i18n';

type Dict = Record<string, string>;
type Ctx = { lang: Lang; t: (k: string) => string };

const I18nContext = createContext<Ctx>({ lang: 'en', t: (k) => k });

export function I18nProvider({ lang, dict, children }: { lang: Lang; dict: Dict; children: React.ReactNode }) {
  const t = (k: string) => dict[k] ?? k;
  return <I18nContext.Provider value={{ lang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
