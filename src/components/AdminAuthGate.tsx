import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Lock, ArrowLeft, Compass } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AdminDashboard from './AdminDashboard';

export default function AdminAuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setChecking(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || submitting) return;
    setErrorMsg('');
    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error || !data.session) {
        setErrorMsg(error?.message || 'Credenciales inválidas. Verifica tu correo y contraseña.');
        return;
      }
      setSession(data.session);
      setPassword('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col items-center justify-center gap-3 px-6">
        <Compass className="w-8 h-8 text-pink-500 animate-spin" />
        <p className="text-xs sm:text-sm text-[#A1A1AA]">Verificando sesión de administrador...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col items-center justify-center px-4 py-12">
        <div
          className="w-full max-w-md rounded-[28px] p-6 sm:p-8 shadow-2xl space-y-6"
          style={{
            background: 'rgba(22, 22, 28, 0.92)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
          }}
        >
          <div className="space-y-2 text-center">
            <div className="mx-auto w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
              <Lock className="w-5 h-5 text-pink-400" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#A1A1AA] pt-1">
              HOTEL XNOX
            </p>
            <h1 className="text-2xl font-normal tracking-tight text-white">
              Acceso Administrador
            </h1>
            <p className="text-xs text-[#A1A1AA]">
              Inicia sesión para gestionar sedes, habitaciones, servicios y tours 360°.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] text-[#A1A1AA] mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hotelxnox.com"
                className="w-full rounded-xl bg-[#09090B] border border-[#27272A] px-3.5 py-2.5 text-sm text-white placeholder-[#52525B] focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#A1A1AA] mb-1.5">Contraseña</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-[#09090B] border border-[#27272A] px-3.5 py-2.5 text-sm text-white placeholder-[#52525B] focus:outline-none focus:border-white/40"
              />
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-rose-500/15 border border-rose-500/35 px-3 py-2 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-full bg-white text-[#09090B] font-semibold text-sm hover:bg-neutral-200 transition-all cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="pt-2 border-t border-white/10 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#A1A1AA] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al sitio público</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard userEmail={session.user.email} onSignOut={handleSignOut} />;
}
