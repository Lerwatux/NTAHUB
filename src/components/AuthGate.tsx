import React, { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  User,
} from 'firebase/auth';
import { Loader2, LogIn, ShieldAlert } from 'lucide-react';
import { auth, isFirebaseConfigured } from '../firebase';
import { syncLocalDataWithCloud, stopCloudSync, NotAuthorizedError } from '../utils/cloudSync';
import { getInitialSettings } from '../utils/storage';
import { FamilyLogo } from './FamilyLogo';

export interface CloudAccount {
  email: string | null;
  signOut: () => void;
}

interface AuthGateProps {
  children: (account: CloudAccount | null) => React.ReactNode;
}

type GateState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'notAuthorized'; user: User }
  | { status: 'ready'; user: User };

function handleSignOut() {
  stopCloudSync();
  if (auth) signOut(auth);
}

/**
 * Affiche l'écran de connexion tant que personne n'est connecté,
 * puis synchronise les données avec le cloud avant d'afficher l'appli.
 * Sans configuration Firebase, l'appli s'affiche directement (mode local).
 */
export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [state, setState] = useState<GateState>(
    isFirebaseConfigured ? { status: 'loading' } : { status: 'signedOut' }
  );

  useEffect(() => {
    if (getInitialSettings().darkMode) document.documentElement.classList.add('dark');
    if (!auth) return;
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ status: 'signedOut' });
        return;
      }
      setState({ status: 'loading' });
      try {
        await syncLocalDataWithCloud();
        setState({ status: 'ready', user });
      } catch (err) {
        setState(err instanceof NotAuthorizedError ? { status: 'notAuthorized', user } : { status: 'ready', user });
      }
    });
  }, []);

  if (!isFirebaseConfigured) return <>{children(null)}</>;

  if (state.status === 'ready') {
    return <>{children({ email: state.user.email, signOut: handleSignOut })}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
        <div className="flex flex-col items-center gap-2 mb-6">
          <FamilyLogo className="h-20 w-auto" />
          <h1 className="text-lg font-bold">NTAHUB</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Le planning partagé de la famille
          </p>
        </div>

        {state.status === 'loading' && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-6">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Synchronisation…</span>
          </div>
        )}

        {state.status === 'signedOut' && <LoginForm />}

        {state.status === 'notAuthorized' && (
          <div className="text-center space-y-4">
            <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm">
              Le compte <strong>{state.user.email}</strong> n’a pas accès au planning familial.
            </p>
            <button
              onClick={handleSignOut}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold"
            >
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function errorMessage(code: string | undefined): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'E-mail ou mot de passe incorrect.';
    case 'auth/too-many-requests':
      return 'Trop d’essais. Patiente quelques minutes puis réessaie.';
    case 'auth/network-request-failed':
      return 'Pas de connexion internet.';
    default:
      return 'Connexion impossible. Réessaie.';
  }
}

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      setError(errorMessage(err?.code));
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!auth) return;
    if (!email.trim()) {
      setError('Indique d’abord ton adresse e-mail.');
      return;
    }
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo('Un e-mail pour choisir un nouveau mot de passe vient d’être envoyé.');
    } catch (err: any) {
      setError(errorMessage(err?.code));
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
        Adresse e-mail
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
        Mot de passe
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${inputClass} mt-1`}
        />
      </label>

      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      {info && <p className="text-xs text-emerald-600 dark:text-emerald-400">{info}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
        <span>Se connecter</span>
      </button>
      <button
        type="button"
        onClick={handleForgotPassword}
        className="w-full text-xs text-slate-500 dark:text-slate-400 hover:underline"
      >
        Mot de passe oublié ?
      </button>
    </form>
  );
};
