// src/app/LandingClient.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Bell, Fan, Thermometer, Droplets, Activity } from 'lucide-react';
import { useI18n } from '@/components/i18n/I18nProvider';
  let gradientFrom = 'from-[var(--brand-from)]'
  let gradientTo = 'to-[var(--brand-to)]'
  const ctaGrad = `bg-gradient-to-r ${gradientFrom} ${gradientTo}`;
 const ctaGrad2= `bg-gradient-to-r  ${gradientTo} ${gradientFrom}`;
type Lang = 'en' | 'am';
function cx(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(' ');
}
const sectionCopy: Record<
  Lang,
  {
    pills: string[];
    airTitle: string;
    airText: string;
    stoveTitle: string;
    stoveText: string;
    airFeatures: [React.ReactNode, string][];
    stoveFeatures: [React.ReactNode, string][];
  }
> = {
  en: {
    pills: ['Real-time alerts', 'Fan & buzzer control', 'Trends & history', 'CSV export', 'Safety coach (RAG) — soon'],
    airTitle: 'AirNode — indoor air that cares',
    airText:
      'Tracks CO₂, CO, PM₂․₅/PM₁₀, temperature and humidity. SHEGA highlights what matters, shows trends, and sends alerts when levels drift out of the safe range.',
    stoveTitle: 'StoveNode — calm in the kitchen',
    stoveText:
      'Monitors surface temperature and can trigger the fan or buzzer when heat rises too fast. You can also control them manually from the dashboard.',
    airFeatures: [
      [<Activity key="a" className="h-4 w-4 text-blue-600" />, 'Accurate sensors'],
      [<Bell key="b" className="h-4 w-4 text-amber-600" />, 'Instant alerts'],
      [<Droplets key="c" className="h-4 w-4 text-cyan-700" />, 'Humidity & temperature'],
      [<Shield key="d" className="h-4 w-4 text-emerald-600" />, 'Safe thresholds'],
    ],
    stoveFeatures: [
      [<Thermometer key="a" className="h-4 w-4 text-rose-600" />, 'Surface temp tracking'],
      [<Fan key="b" className="h-4 w-4 text-sky-700" />, 'Fan control'],
      [<Bell key="c" className="h-4 w-4 text-amber-600" />, 'Buzzer alerts'],
      [<Activity key="d" className="h-4 w-4 text-purple-700" />, 'Automation-ready'],
    ],
  },
  am: {
    pills: ['በቀጥታ ማንቂያዎች', 'ፋን እና ቢዝዝር መቆጣጠር', 'ትኩረት እና ታሪክ', 'CSV ማውጣት', 'የደህንነት አስተማሪ (RAG) — በቅርብ'],
    airTitle: 'AirNode — ለቤት አየር እንክብካቤ',
    airText:
      'CO₂፣ CO፣ PM₂․₅/PM₁₀፣ ሙቀት እና እርጥበት ይቆጣጠራል። SHEGA አስፈላጊውን በግልጽ ያሳያል፣ ዝርዝር ይቀርባል እና ከደረጃ ሲወጣ ማንቂያ ይላካል።',
    stoveTitle: 'StoveNode — ጸጥታ በምግብ ቤት',
    stoveText:
      'የምድር ሙቀትን ይመለከታል እና ሙቀት ፈጥኖ ሲጨምር ፋን ወይም ቢዝዝር ሊነሳ ይችላል። ከዳሽቦርዱ በእጅ መቆጣጠር እንኳን ትችላለህ።',
    airFeatures: [
      [<Activity key="a" className="h-4 w-4 text-blue-600" />, 'ትክክለኛ ሴንሰሮች'],
      [<Bell key="b" className="h-4 w-4 text-amber-600" />, 'ወቅታዊ ማንቂያዎች'],
      [<Droplets key="c" className="h-4 w-4 text-cyan-700" />, 'እርጥበት እና ሙቀት'],
      [<Shield key="d" className="h-4 w-4 text-emerald-600" />, 'የደህንነት መደበኛዎች'],
    ],
    stoveFeatures: [
      [<Thermometer key="a" className="h-4 w-4 text-rose-600" />, 'የመሬት ሙቀት መከታተያ'],
      [<Fan key="b" className="h-4 w-4 text-sky-700" />, 'የፋን መቆጣጠር'],
      [<Bell key="c" className="h-4 w-4 text-amber-600" />, 'የቢዝዝር ማንቂያዎች'],
      [<Activity key="d" className="h-4 w-4 text-purple-700" />, 'ማብራሪያ ዝግጁ'],
    ],
  },
};

export default function LandingClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { t, lang } = useI18n();
  const c = sectionCopy[lang];

  const btnLift =
    'rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm hover:shadow-md hover:bg-slate-50 active:shadow';

  return (
    <main className="py-16">
      <section className="relative mx-auto max-w-7xl px-4">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-blue-400/30 to-purple-400/30 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-gradient-to-tr from-emerald-300/30 to-amber-300/30 blur-3xl" />
        </div>

        <div className="lg:grid items-center gap-10 md:grid-cols-12 flex flex-col-reverse">
          <div className="md:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-700 shadow-sm backdrop-blur">
              <Shield className="h-3.5 w-3.5 text-blue-600" />
              {t('hero.strap')}
            </div>

            <h1 className="mt-4 text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900">
              {t('hero.titleA')} <br className="hidden sm:block" />
              {t('hero.titleB')}
            </h1>

            <p className="mt-4 max-w-xl text-lg text-slate-700">{t('hero.intro')}</p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {!isLoggedIn && (
                <Link href="/login" className={btnLift + cx('inline-flex items-center gap-2 rounded-xl px-3 py-2 text-lg font-medium text-white hover:opacity-95 shadow-sm', ctaGrad)}>
                  {t('hero.btn.login')}
                </Link>
              )}
              <a href="#devices" className={btnLift + cx('inline-flex items-center gap-2 rounded-xl px-3 py-2 text-lg font-medium text-white hover:opacity-95 shadow-sm', ctaGrad2)}>
                {t('hero.btn.learn')}
              </a>
            </div>

            <ul className="mt-6 flex flex-wrap gap-2 text-sm text-slate-700">
              {c.pills.map((p) => (
                <li
                  key={p}
                  className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 shadow-sm"
                >
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative md:col-span-6">
            <div className="relative mx-auto w-[88%] max-w-[540px] overflow-hidden rounded-3xl ring-1 ring-slate-200 shadow-2xl">
              <Image
                src="/airnode.png"
                alt="SHEGA AirNode mounted on a wall"
                width={1400}
                height={1000}
                className="h-auto w-full object-cover"
                priority
              />
            </div>

            <div className="absolute -bottom-8 -left-6 w-[56%] max-w-[360px] -rotate-2 overflow-hidden rounded-2xl ring-1 ring-slate-200 shadow-xl">
              <Image
                src="/stovenode.png"
                alt="SHEGA StoveNode near a cooktop with fan"
                width={1200}
                height={900}
                className="h-auto w-full object-cover"
              />
            </div>

            <div className="absolute top-4 right-2 flex flex-col gap-2">
              <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-700 shadow">
                CO₂ 420 ppm
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-700 shadow">
                PM₂․₅ 14 µg/m³
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="devices" className="mx-auto mt-24 max-w-7xl px-4">
        {/* AirNode */}
        <div className="grid items-center gap-10 md:grid-cols-12">
          <div className="order-2 md:order-1 md:col-span-6">
            <h2 className="text-3xl font-bold text-slate-900">{c.airTitle}</h2>
            <p className="mt-3 text-slate-700">{c.airText}</p>
            <ul className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {c.airFeatures.map(([icon, label]) => (
                <li
                  key={String(label)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm"
                >
                  {icon} {label}
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 md:order-2 md:col-span-6">
            <div className="relative overflow-hidden rounded-3xl ring-1 ring-slate-200 shadow-xl">
              <Image
                src="/airnode.png"
                alt="AirNode close-up"
                width={1400}
                height={1000}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* StoveNode */}
        <div className="mt-20 grid items-center gap-10 md:grid-cols-12">
          <div className="md:col-span-6">
            <div className="relative overflow-hidden rounded-3xl ring-1 ring-slate-200 shadow-xl">
              <Image
                src="/stovenode.png"
                alt="StoveNode with auxiliary fan"
                width={1400}
                height={1000}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
          <div className="md:col-span-6">
            <h2 className="text-3xl font-bold text-slate-900">{c.stoveTitle}</h2>
            <p className="mt-3 text-slate-700">{c.stoveText}</p>
            <ul className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {c.stoveFeatures.map(([icon, label]) => (
                <li
                  key={String(label)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm"
                >
                  {icon} {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-24 max-w-7xl px-4 text-center">
        <h3 className="text-2xl font-semibold text-slate-900">{t('cta.title')}</h3>
        <p className="mt-2 text-slate-700">{t('cta.text')}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          {!isLoggedIn && (
                <Link href="/login" className={btnLift + cx('inline-flex items-center gap-2 rounded-xl px-3 py-2 text-lg font-medium text-white hover:opacity-95 shadow-sm', ctaGrad)}>
                  {t('hero.btn.login')}
                </Link>
              )}
              <a href="#devices" className={btnLift + cx('inline-flex items-center gap-2 rounded-xl px-3 py-2 text-lg font-medium text-white hover:opacity-95 shadow-sm', ctaGrad2)}>
                {t('hero.btn.learn')}
              </a>
        </div>
      </section>
    </main>
  );
}
