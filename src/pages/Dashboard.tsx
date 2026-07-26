import { useEffect, useState, useCallback } from 'react';
import {
  Newspaper,
  RefreshCw,
  Search,
  ExternalLink,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Tag,
} from 'lucide-react';
import {
  supabase,
  type NoticiaBruta,
} from '../lib/supabaseClient';
import { Badge, Card, EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui';

const PAGE_SIZE = 12;

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  processando: 'Processando',
  processado: 'Concluído',
  concluido: 'Concluído',
  falha: 'Falha',
};

export default function Dashboard() {
  const [noticias, setNoticias] = useState<NoticiaBruta[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [categorias, setCategorias] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    let countQuery = supabase
      .from('noticias_brutas')
      .select('*', { count: 'exact', head: true });

    let dataQuery = supabase
      .from('noticias_brutas')
      .select('id, titulo, conteudo_bruto, url_fonte, data_coleta, status_processamento, nome_fonte, categoria')
      .order('data_coleta', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (query) {
      countQuery = countQuery.or(`titulo.ilike.%${query}%,conteudo_bruto.ilike.%${query}%`);
      dataQuery = dataQuery.or(`titulo.ilike.%${query}%,conteudo_bruto.ilike.%${query}%`);
    }
    if (statusFilter !== 'todos') {
      countQuery = countQuery.eq('status_processamento', statusFilter);
      dataQuery = dataQuery.eq('status_processamento', statusFilter);
    }
    if (categoriaFilter !== 'todas') {
      countQuery = countQuery.eq('categoria', categoriaFilter);
      dataQuery = dataQuery.eq('categoria', categoriaFilter);
    }

    const [countRes, dataRes] = await Promise.all([countQuery, dataQuery]);
    setLoading(false);

    if (countRes.error || dataRes.error) {
      setError(countRes.error?.message ?? dataRes.error?.message ?? 'Erro ao carregar');
      setNoticias([]);
      setTotal(0);
      return;
    }
    setTotal(countRes.count ?? 0);
    setNoticias((dataRes.data as NoticiaBruta[]) ?? []);
  }, [page, query, statusFilter, categoriaFilter]);

  async function loadCategorias() {
    const { data, error } = await supabase
      .from('noticias_brutas')
      .select('categoria')
      .not('categoria', 'is', null)
      .neq('categoria', '');
    if (!error && data) {
      const unique = Array.from(
        new Set(data.map((d) => (d as { categoria: string }).categoria).filter(Boolean)),
      ).sort();
      setCategorias(unique);
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadCategorias();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [query, statusFilter, categoriaFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, total);

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
      <Card className="p-4 mb-5">
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
            <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              className="appearance-none pl-10 pr-8 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
            >
              <option value="todas">Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
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
      ) : noticias.length === 0 ? (
        <EmptyState message={total === 0 ? 'Nenhuma notícia coletada.' : 'Nenhuma notícia corresponde aos filtros.'} />
      ) : (
        <>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            {from}–{to} de {total} notícias
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {noticias.map((n) => (
              <NoticiaCard key={n.id} noticia={n} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Página {page + 1} de {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={15} />
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || loading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Próxima
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
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
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge status={STATUS_LABEL[status] ?? status} />
          {noticia.categoria && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-900">
              <Tag size={10} />
              {noticia.categoria}
            </span>
          )}
        </div>
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
