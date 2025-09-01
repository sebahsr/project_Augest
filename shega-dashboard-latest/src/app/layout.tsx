// src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';
import { cookies } from 'next/headers';
import ChatWidget from '@/components/rag/ChatWidget';

import { I18nProvider } from '@/components/i18n/I18nProvider'; 
import { messages, type Lang } from '@/lib/i18n';              
const inter = Inter({ subsets: ['latin'] });
type Role = 'admin' | 'user' ; 

type JwtPayload = { userId?: string; role?: Role; name?: string; email?: string; houseId?: string };

function decodeJwtPayload(token?: string): JwtPayload | null {
  if (!token) return null;
  const [_, b64] = token.split('.');
  if (!b64) return null;
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  try { return JSON.parse(Buffer.from(b64.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString('utf8')); }
  catch { return null; }
}
  
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();

  const token = cookieStore.get(process.env.JWT_COOKIE_NAME || 'shega_token')?.value;
  const jwt = decodeJwtPayload(token);
  const houseId = jwt?.houseId || '';

  const langCookie = (cookieStore.get('lang')?.value ?? 'en') as Lang | string;
  const lang: Lang = langCookie === 'am' ? 'am' : 'en';
  const dict = messages[lang];

  return (
    <html lang={lang} className={inter.className}>
      <body className="bg-gray-50 text-gray-900">
        <I18nProvider lang={lang} dict={dict}>
          <Header
            role={jwt?.role}
            name={jwt?.name}
            isAuthenticated={Boolean(jwt?.role)}
            unreadAlerts={3}
          />
          <main className="mx-auto max-w-7xl px-3 sm:px-4 py-4">{children}</main>
          {jwt?.role=='user'&&<ChatWidget  houseId={houseId} />}
        </I18nProvider>
      </body>
    </html>
  );
}
