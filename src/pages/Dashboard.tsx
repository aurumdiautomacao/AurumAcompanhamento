import { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, Search, Newspaper } from 'lucide-react';
import { supabase, type NoticiaBruta } from '../lib/supabaseClient';
import { Badge, Card, EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui';

export default function Dashboard() {
  const [noticias, setNoticias] = useState<NoticiaBruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('noticias_brutas')
      .select(
        'id, status_processamento, url_fonte, nome_fonte, titulo, conteudo_bruto, data_coleta',
      )
      .order('data_coleta', { ascending: false })
      .limit(100);
    setLoading(false);
    if (error) {
      setError(error.message);
      setNoticias([]);
      return;
    }
    setNoticias((data as NoticiaBruta[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = noticias.filter((n) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (n.titulo ?? '').toLowerCase().includes(q) ||
      (n.nome_fonte ?? '').toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === 'all' || (n.status_processamento ?? 'pendente') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <PageHeader
        title="Central de Notícias"
        subtitle="Conteúdo bruto coletado de fontes externas"
        action={
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? <Spinner /> : <RefreshCw size={16} />}
            Atualizar
          </button>
        }
      />

      <Card className="mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título ou fonte..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="processando">Processando</option>
            <option value="concluido">Concluído</option>
            <option value="falha">Falha</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-brand-600" />
          </div>
        ) : error ? (
          <ErrorState message={`Erro ao carregar: ${error}`} />
        ) : filtered.length === 0 ? (
          <EmptyState message="Nenhuma notícia encontrada." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Fonte</th>
                  <th className="text-left font-medium px-4 py-3">Título</th>
                  <th className="text-left font-medium px-4 py-3">Link</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">Coletado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((n) => (
                  <tr
                    key={n.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                          <Newspaper size={14} />
                        </div>
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {n.nome_fonte ?? '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 max-w-md">
                      <div className="truncate">{n.titulo}</div>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={n.url_fonte}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:text-brand-700"
                      >
                        Abrir <ExternalLink size={14} />
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={n.status_processamento ?? 'pendente'} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(n.data_coleta).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
        {filtered.length} de {noticias.length} registros · tabela{' '}
        <code>noticias_brutas</code>
      </p>
    </div>
  );
}
