import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Newspaper, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4">
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Newspaper className="text-white" size={22} />
          </div>
          <span className="text-xl font-semibold text-slate-900">TrendHub</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h1 className="text-xl font-semibold text-slate-900">Entrar na plataforma</h1>
          <p className="text-sm text-slate-500 mt-1">
            Acesse o painel de gestão de conteúdo e tendências.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="voce@empresa.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              {submitting && <Spinner />}
              Entrar
            </button>
          </form>

          <p className="text-sm text-slate-500 text-center mt-6">
            Não tem conta?{' '}
            <Link
              to="/register"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Criar conta
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          TrendHub · Plataforma de gestão de conteúdo corporativo
        </p>
      </div>
    </div>
  );
}
