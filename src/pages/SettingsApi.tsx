import { useEffect, useState, type FormEvent } from 'react';
import {
  Key,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  Wallet,
  Activity,
  TrendingUp,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { PageHeader, Card, Spinner } from '../components/ui';
import { supabase, type ApiSettings } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

type DailyUsage = { date: string; cost: number };

type UsageResponse = {
  total_cost?: number;
  currency?: string;
  period?: { start: string; end: string };
  daily?: DailyUsage[];
  error?: string;
  code?: string;
};

const FUNCTION_PATH = '/functions/v1/get_openai_usage';

export default function SettingsApi() {
  const { user } = useAuth();
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);

  async function loadSettings() {
    if (!user) return;
    const { data, error } = await supabase
      .from('api_settings')
      .select('id, user_id, openai_api_key, created_at, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) return;
    const row = data as ApiSettings | null;
    if (row) {
      setSettingsId(row.id);
      if (row.openai_api_key) setToken(row.openai_api_key);
    }
  }

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaved(false);
    const payload = { user_id: user.id, openai_api_key: token.trim() || null };
    const { data, error } = await supabase
      .from('api_settings')
      .upsert(payload, { onConflict: 'user_id' })
      .select('id')
      .single();
    setSaving(false);
    if (error) {
      setUsageError(`Erro ao salvar token: ${error.message}`);
      return;
    }
    if (data) setSettingsId(data.id as string);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function fetchUsage() {
    if (!token.trim()) {
      setUsageError('Salve um token da OpenAI antes de consultar o consumo.');
      return;
    }
    setLoadingUsage(true);
    setUsageError(null);
    setUsage(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}${FUNCTION_PATH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${sessionData.session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ openai_api_key: token.trim() }),
      });
      const json = (await res.json()) as UsageResponse;
      if (!res.ok || json.error) {
        if (res.status === 401 || json.code === 'invalid_api_key') {
          setUsageError(
            json.error ??
              'Chave da OpenAI inválida ou sem permissão. Verifique o token e tente novamente.',
          );
        } else {
          setUsageError(json.error ?? `Erro ${res.status} ao consultar consumo.`);
        }
        return;
      }
      setUsage(json);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setUsageError(`Falha ao chamar a Edge Function: ${msg}`);
    } finally {
      setLoadingUsage(false);
    }
  }

  const daily = usage?.daily ?? [];
  const maxCost = Math.max(0.0001, ...daily.map((d) => d.cost));
  const totalCost = usage?.total_cost ?? 0;
  const avgCost = daily.length > 0 ? totalCost / daily.length : 0;
  const peakCost = daily.length > 0 ? Math.max(...daily.map((d) => d.cost)) : 0;

  return (
    <div>
      <PageHeader
        title="Configurações & API"
        subtitle="Gerencie seu token OpenAI e acompanhe seu consumo individual"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Key size={18} className="text-brand-600 dark:text-brand-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Token da API OpenAI
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            Sua chave é salva por usuário na tabela <code>api_settings</code>. Cada
            usuário vê apenas o próprio consumo.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="sk-..."
                  className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showToken ? 'Ocultar token' : 'Mostrar token'}
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                {settingsId
                  ? 'Token salvo no banco (atualizado).'
                  : 'Nenhum token salvo ainda para este usuário.'}
              </p>
            </div>

            {saved && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg px-3 py-2">
                <CheckCircle2 size={16} />
                Token salvo com sucesso.
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60 rounded-lg"
            >
              {saving ? <Spinner /> : <Save size={16} />}
              Salvar token
            </button>
          </form>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Custo total (mês)"
            value={`$ ${totalCost.toFixed(2)}`}
            icon={Wallet}
            accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
          />
          <StatCard
            label="Dias com uso"
            value={String(daily.length)}
            icon={Activity}
            accent="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
          />
          <StatCard
            label="Pico diário"
            value={`$ ${peakCost.toFixed(2)}`}
            icon={TrendingUp}
            accent="bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300"
          />
        </div>
      </div>

      <Card className="p-6 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-brand-600 dark:text-brand-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Consumo diário (mês atual · {usage?.currency ?? 'USD'})
            </h2>
          </div>
          <button
            onClick={fetchUsage}
            disabled={loadingUsage}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
          >
            {loadingUsage ? <Spinner /> : <RefreshCw size={16} />}
            Buscar consumo
          </button>
        </div>

        {usageError && (
          <div className="flex items-start gap-2 text-sm text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg px-3 py-2 mb-5">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{usageError}</span>
          </div>
        )}

        {loadingUsage ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-brand-600" />
          </div>
        ) : daily.length === 0 && !usageError ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
            Clique em "Buscar consumo" para consultar a API da OpenAI via Edge Function.
          </div>
        ) : (
          <>
            <div className="flex items-end gap-1.5 sm:gap-3 h-56 px-1 overflow-x-auto">
              {daily.map((d) => {
                const heightPct = Math.max(2, Math.round((d.cost / maxCost) * 100));
                return (
                  <div
                    key={d.date}
                    className="flex-1 min-w-[24px] flex flex-col items-center gap-2"
                    title={`${d.date}: $${d.cost.toFixed(4)}`}
                  >
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      ${d.cost.toFixed(2)}
                    </div>
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400 hover:from-brand-700 hover:to-brand-500 transition-all"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {d.date.slice(8)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              <MiniStat label="Média diária" value={`$ ${avgCost.toFixed(2)}`} />
              <MiniStat label="Pico" value={`$ ${peakCost.toFixed(2)}`} />
              <MiniStat label="Total no mês" value={`$ ${totalCost.toFixed(2)}`} />
              <MiniStat
                label="Período"
                value={
                  usage?.period
                    ? `${usage.period.start} → ${usage.period.end}`
                    : '—'
                }
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
  accent: string;
}) {
  return (
    <Card className="p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${accent}`}>
        <Icon size={18} />
      </div>
      <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </div>
      <div className="text-xs text-slate-400 dark:text-slate-500">{label}</div>
    </div>
  );
}
