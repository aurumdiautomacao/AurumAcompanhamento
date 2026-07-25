import { useEffect, useState } from 'react';
import {
  Newspaper,
  RefreshCw,
  Search,
  ExternalLink,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  supabase,
  type NoticiaBruta,
} from '../lib/supabaseClient';
import { Badge, Card, EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui';

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  processando: 'Processando',
  processado: 'Concluído',
  concluido: 'Concluído',
  falha: 'Falha',
};

export default function Dashboard() {
  const [noticias, setNoticias] = useState<NoticiaBruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('noticias_brutas')
      .select('id, titulo, conteudo_bruto, url_fonte, data_coleta, status_processamento, nome_fonte')
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
    const matchesQuery =
      !query ||
      n.titulo?.toLowerCase().includes(query.toLowerCase()) ||
      n.conteudo_bruto?.toLowerCase().includes(query.toLowerCase());
    const matchesStatus =
      statusFilter === 'todos' || (n.status_processamento ?? 'pendente') === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div>
      <PageHeader
        title="Central de Notícias"
        subtitle="Notícias pesquisadas e coletadas para inteligência de mercado"
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

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título ou conteúdo..."
              className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
            />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-10 pr-8 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
            >
              <option value="todos">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="processando">Processando</option>
              <option value="processado">Concluído</option>
              <option value="falha">Falha</option>
            </select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner className="text-brand-600" />
        </div>
      ) : error ? (
        <ErrorState message={error} />
      ) : filtered.length === 0 ? (
        <EmptyState message={noticias.length === 0 ? 'Nenhuma notícia coletada.' : 'Nenhuma notícia corresponde aos filtros.'} />
      ) : (
        <>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            {filtered.length} {filtered.length === 1 ? 'notícia' : 'notícias'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((n) => (
              <NoticiaCard key={n.id} noticia={n} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NoticiaCard({ noticia }: { noticia: NoticiaBruta }) {
  const [expanded, setExpanded] = useState(false);
  const status = noticia.status_processamento ?? 'pendente';
  const data = new Date(noticia.data_coleta).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <Badge status={STATUS_LABEL[status] ?? status} />
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
          <Calendar size={11} />
          {data}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
        {noticia.titulo || 'Sem título'}
      </h3>

      {noticia.conteudo_bruto && (
        <p className={`text-sm text-slate-600 dark:text-slate-300 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
          {noticia.conteudo_bruto}
        </p>
      )}

      {noticia.conteudo_bruto && noticia.conteudo_bruto.length > 160 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 self-start"
        >
          {expanded ? 'Recolher' : 'Ler mais'}
        </button>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-auto">
        {noticia.nome_fonte ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Newspaper size={12} />
            {noticia.nome_fonte}
          </span>
        ) : (
          <span className="text-xs text-slate-400">Fonte desconhecida</span>
        )}
        {noticia.url_fonte && (
          <a
            href={noticia.url_fonte}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
          >
            <ExternalLink size={12} />
            Fonte
          </a>
        )}
      </div>
    </Card>
  );
}
