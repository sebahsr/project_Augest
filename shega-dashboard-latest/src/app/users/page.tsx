'use client';

import { useEffect, useState } from 'react';
import { apiFetch, apiPost } from '@/lib/api';
import type { User, UsersListResponse } from '@/types/users';
import { useI18n } from '@/components/i18n/I18nProvider';

type NewUserForm = {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  homes: string;
};

export default function AdminUsersPage() {
  const { t } = useI18n();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Add-user form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewUserForm>({
    name: '',
    email: '',
    password: '',
    role: 'user',
    homes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await apiFetch<UsersListResponse>(`/auth/getUsers`);
      setUsers(data.users || []);
    } catch (e: any) {
      setErr(e?.message || t('users.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onChange = <K extends keyof NewUserForm>(key: K, val: NewUserForm[K]) => {
    setForm((f) => ({ ...f, [key]: val }));
  };

  const validate = () => {
    if (!form.email.trim()) return t('users.err.emailRequired');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return t('users.err.emailInvalid');
    if (!form.password.trim() || form.password.length < 6) return t('users.err.password');
    if (!['admin', 'user'].includes(form.role)) return t('users.err.roleInvalid');
    return null;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr(null);
    setSuccessMsg(null);

    const v = validate();
    if (v) {
      setFormErr(v);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name?.trim() || undefined,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        homes: form.homes
          ? form.homes.split(',').map((h) => h.trim()).filter(Boolean)
          : [],
      };

      const created = await apiPost<User>(`/auth/register`, payload);
      setUsers((prev) => [created, ...prev]);

      setForm({ name: '', email: '', password: '', role: 'user', homes: '' });
      setSuccessMsg(`${t('users.create.success')}: ${created.email}`);
      setShowForm(false);
      await fetchUsers();
      setFormErr(null);
      setSuccessMsg(null);
    } catch (e: any) {
      setFormErr(e?.message || t('users.createError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('users.title')}</h1>
          <p className="text-sm text-slate-600">{t('users.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            setShowForm((s) => !s);
            setFormErr(null);
            setSuccessMsg(null);
          }}
          className="rounded-md bg-slate-900 text-white text-sm px-4 py-2"
        >
          {showForm ? t('action.cancel') : t('users.add')}
        </button>
      </header>

      {/* Add user form */}
      {showForm && (
        <section className="rounded-xl border bg-white/80 backdrop-blur p-4">
          <h2 className="text-lg font-medium mb-3">{t('users.addTitle')}</h2>

          {formErr && (
            <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-sm">
              {formErr}
            </div>
          )}
          {successMsg && (
            <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-2 text-sm">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-700">{t('users.form.nameOptional')}</label>
              <input
                className="rounded-md border px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder={t('users.placeholder.name')}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-700">{t('users.form.email')} *</label>
              <input
                required
                type="email"
                className="rounded-md border px-3 py-2 text-sm"
                value={form.email}
                onChange={(e) => onChange('email', e.target.value)}
                placeholder={t('users.placeholder.email')}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-700">{t('users.form.password')} *</label>
              <input
                required
                type="password"
                className="rounded-md border px-3 py-2 text-sm"
                value={form.password}
                onChange={(e) => onChange('password', e.target.value)}
                placeholder={t('users.placeholder.password')}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-700">{t('users.form.role')} *</label>
              <select
                className="rounded-md border px-3 py-2 text-sm"
                value={form.role}
                onChange={(e) => onChange('role', e.target.value as 'admin' | 'user')}
              >
                <option value="user">{t('role.user')}</option>
                <option value="admin">{t('role.admin')}</option>
              </select>
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="text-sm text-slate-700">{t('users.form.homes')}</label>
              <input
                className="rounded-md border px-3 py-2 text-sm"
                value={form.homes}
                onChange={(e) => onChange('homes', e.target.value)}
                placeholder={t('users.placeholder.homes')}
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-slate-900 text-white text-sm px-4 py-2 disabled:opacity-60"
              >
                {submitting ? t('users.creating') : t('users.create')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormErr(null);
                  setSuccessMsg(null);
                }}
                className="rounded-md border text-sm px-4 py-2"
              >
                {t('action.cancel')}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Error while fetching users */}
      {err && (
        <div className="rounded-md border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-sm">
          {err}
        </div>
      )}

      {/* Users table */}
      {loading ? (
        <div className="text-slate-600">{t('loading')}</div>
      ) : (
        <div className="rounded-xl border bg-white/80 backdrop-blur overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="text-left p-3">{t('users.th.name')}</th>
                <th className="text-left p-3">{t('users.th.email')}</th>
                <th className="text-left p-3">{t('users.th.role')}</th>
                <th className="text-left p-3">{t('users.th.homes')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} className="border-b align-top">
                  <td className="p-3 font-medium">{u.name || '—'}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center rounded-full border px-2 py-1 text-xs">
                      {t(`role.${u.role}`)}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {(u.homes || []).map((h) => (
                        <span key={h} className="inline-flex items-center rounded-full border px-2 py-1 text-xs">
                          {h}
                        </span>
                      ))}
                      {(!u.homes || u.homes.length === 0) && (
                        <span className="text-xs text-slate-500">{t('users.noHomes')}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500">
                    {t('users.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
