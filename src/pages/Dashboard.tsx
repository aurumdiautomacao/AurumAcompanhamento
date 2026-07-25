import { useState } from 'react';
import { RefreshCw, Calendar } from 'lucide-react';
import { PageHeader, Spinner } from '../components/ui';
import { RelatorioView, BriefingsSection } from '../components/DashboardPieces';
import { mockConteudoGerado, mockPostsGerados } from '../lib/mockData';

export default function Dashboard() {
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    setTimeout(() => setLoading(false), 400);
  }

  const dataCriacao = new Date(mockConteudoGerado.created_at).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div>
      <PageHeader
        title="Central de Notícias"
        subtitle="Inteligência de mercado e briefings de design para a equipe Aurum DI"
        action={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Calendar size={14} />
              {dataCriacao}
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? <Spinner /> : <RefreshCw size={16} />}
              Atualizar
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner className="text-brand-600" />
        </div>
      ) : (
        <div className="space-y-6">
          <RelatorioView conteudo={mockConteudoGerado} />
          <BriefingsSection posts={mockPostsGerados} />
        </div>
      )}
    </div>
  );
}
