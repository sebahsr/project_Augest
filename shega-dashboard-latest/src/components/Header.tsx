// src/components/Header.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield, LayoutDashboard, Gauge, Bell, Menu, X,
  Settings as SettingsIcon, LogIn,
  LogOut, User as UserIcon,
  ScrollText as Log,

 
} from 'lucide-react';

import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import { useI18n } from '@/components/i18n/I18nProvider';

type Role = 'admin' | 'user' | undefined;

type HeaderProps = {
  name?: string;
  role?: Role;
  unreadAlerts?: number;
  isAuthenticated?: boolean; // <- when true, hides "Sign in"
  gradientFrom?: string;
  gradientTo?: string;
};

function cx(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

export default function Header({
  name,
  role,
  unreadAlerts = 0,
  isAuthenticated = false,
  gradientFrom = 'from-[var(--brand-from)]',
  gradientTo = 'to-[var(--brand-to)]',
}: HeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const { t } = useI18n();

  // Build nav *after* we have t()
  const nav = React.useMemo(
    () =>
      role === 'admin'
        ? [
            { href: '/admindash', label: t('dashboard'), icon: LayoutDashboard },
            { href: '/users', label: t('users'), icon: UserIcon },
            // { href: '/EmergencyLogAd', label: t('Emergency_log'), icon: Log },
            // { href: '/settings', label: t('settings'), icon: SettingsIcon },
          ]
        : [
            { href: '/dashboard', label: t('my_home'), icon: LayoutDashboard },
            // { href: '/EmergencyLog', label: t('Emergency_log'), icon: Log },
            // { href: '/settings', label: t('settings'), icon: SettingsIcon },
          ],
    [role, t]
  );

  React.useEffect(() => setOpen(false), [pathname]);

  const activePill = `bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white ring-0`;
  const brandGrad = `bg-gradient-to-br ${gradientFrom} ${gradientTo}`;
  const ctaGrad = `bg-gradient-to-r ${gradientFrom} ${gradientTo}`;


  return (
    <header className=" z-50 w-full bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 border-b border-gray-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        {/* Top row */}
        <div className="h-16 flex items-center justify-between">
          {/* Left: menu + brand */}
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl p-2 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-[var(--brand-from)] lg:hidden"
                aria-label="Toggle menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}

            <Link href="/" className="group inline-flex items-center gap-3">
              <span className={cx('grid h-9 w-9 place-items-center rounded-xl text-white shadow-sm', brandGrad)}>
                <Shield className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <div className={cx('font-semibold tracking-tight bg-clip-text text-transparent', `bg-gradient-to-r ${gradientFrom} ${gradientTo}`)}>
                  SHEGA | ሸጋ
                </div>
                <div className="text-xs text-gray-500 -mt-0.5">{t('brand_sub')}</div>
              </div>
            </Link>

            {role && (
              <span
                className={cx(
                  'ml-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1',
                  role === 'admin'
                    ? 'bg-rose-50 text-rose-700 ring-rose-200'
                    : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                )}
                aria-label={`Role: ${role}`}
              >
                {role}
              </span>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Language selector (functional) */}
            <LanguageSwitcher />

            {/* Auth (Sign in hidden when authenticated) */}
            {isAuthenticated ? (
              <Link
                href="/api/logout"
                className={cx('inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white hover:opacity-95 shadow-sm', ctaGrad)}
              onClick={(e) => {
                e.preventDefault();
                fetch('/api/logout', { method: 'GET' }).then(() => {
                  window.location.href = '/';
                });
              }}
            >
                <LogOut className="h-4 w-4" /> {t('sign_out')}
              </Link>
            ) : (
              <Link
                href="/login"
                className={cx('inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white hover:opacity-95 shadow-sm', ctaGrad)}
              >
                <LogIn className="h-4 w-4" /> {t('sign_in')}
              </Link>
            )}
          </div>
        </div>

        {/* Desktop nav */}
        {isAuthenticated && (
           <nav className="hidden lg:flex items-center flex items-center gap-1 py-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cx(
                    'inline-flex items-center gap-2 rounded-xl px-3 py-1 text-sm',
                    active ? cx(activePill) : 'hover:bg-gray-50 text-gray-700'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          
        
          </nav>
        )}
      </div>

      {/* Mobile drawer */}
      {isAuthenticated && (
        <div
          className={cx(
            'lg:hidden border-t bg-white transition-[max-height,opacity] overflow-hidden',
            open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <nav className="px-3 sm:px-4 py-2 grid gap-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cx(
                    'flex items-center gap-2 rounded-xl px-3 py-2',
                    active ? cx(activePill) : 'hover:bg-gray-50 text-gray-800'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{label}</span>
                </Link>
              );
            })}
             <Link
              href="/api/logout"
              className="lg:hidden flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-gray-50 text-gray-800"
                onClick={(e) => {
                    e.preventDefault();
                    fetch('/api/logout', { method: 'GET' }).then(() => {
                    window.location.href = '/';
                    });
                }}
            >
                 <LogOut className="h-4 w-4" />
                  <span className="text-sm"> {t('sign_out')}</span>
             
            </Link>
          </nav>

    
        </div>
      )}
    </header>
  );
}
