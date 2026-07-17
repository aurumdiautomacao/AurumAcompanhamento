import { useEffect, useState } from 'react';
import {
  FileText,
  Instagram,
  Linkedin,
  CheckCircle2,
  RefreshCw,
  MessageCircle,
  Radar,
} from 'lucide-react';
import {
  supabase,
  normalizePosts,
  normalizeTopicos,
  canonicalPlataforma,
  type ConteudoGerado,
  type PostGerado,
  type TopicoEstrategico,
} from '../lib/supabaseClient';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Spinner,
} from '../components/ui';

export default function ApprovalCenter() {
  const [relatorios, setRelatorios] = useState<ConteudoGerado[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loadingRel, setLoadingRel] = useState(true);
  const [errorRel, setErrorRel] = useState<string | null>(null);

  async function loadRelatorios() {
    setLoadingRel(true);
    setErrorRel(null);
    const { data, error } = await supabase
      .from('conteudo_gerado')
      .select(
        'id, relatorio_tendencias, posts_instagram, posts_linkedin, topicos_estrategicos, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(50);
    setLoadingRel(false);
    if (error) {
      setErrorRel(error.message);
      setRelatorios([]);
      return;
    }
    const rows = (data as ConteudoGerado[]) ?? [];
    setRelatorios(rows);
    if (rows[0]) setSelectedId(rows[0].id);
  }

  useEffect(() => {
    loadRelatorios();
  }, []);

  const selected = relatorios.find((r) => r.id === selectedId) ?? null;
  const igPosts = selected ? normalizePosts(selected.posts_instagram) : [];
  const liPosts = selected ? normalizePosts(selected.posts_linkedin) : [];
  const topicos = selected ? normalizeTopicos(selected.topicos_estrategicos) : [];

  return (
    <div>
      <PageHeader
        title="Central de Aprovação"
        subtitle="Revise relatórios de tendências e aprove os posts gerados"
        action={
          <button
            onClick={loadRelatorios}
            disabled={loadingRel}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
          >
            {loadingRel ? <Spinner /> : <RefreshCw size={16} />}
            Atualizar
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200">
              Relatórios
            </div>
            {loadingRel ? (
              <div className="flex justify-center py-10">
                <Spinner className="text-brand-600" />
              </div>
            ) : errorRel ? (
              <ErrorState message={errorRel} />
            ) : relatorios.length === 0 ? (
              <EmptyState message="Nenhum relatório." />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[70vh] overflow-y-auto">
                {relatorios.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => setSelectedId(r.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        selectedId === r.id
                          ? 'bg-brand-50 dark:bg-brand-950/40 border-l-2 border-brand-600'
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <FileText
                          size={16}
                          className="mt-0.5 text-slate-400 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-sm text-slate-800 dark:text-slate-100 line-clamp-2">
                            {r.relatorio_tendencias}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            #{r.id} · {new Date(r.created_at).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <RadarEstrategico topicos={topicos} />

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={18} className="text-brand-600 dark:text-brand-400" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Relatório de Tendências
              </h2>
            </div>
            {!selected ? (
              <EmptyState message="Selecione um relatório à esquerda." />
            ) : (
              <>
                <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selected.relatorio_tendencias}
                </p>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-4">
                  Gerado em {new Date(selected.created_at).toLocaleString('pt-BR')}
                </div>
              </>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PostColumn
              title="Instagram"
              icon={Instagram}
              accent="text-pink-600 dark:text-pink-400"
              posts={igPosts}
            />
            <PostColumn
              title="LinkedIn"
              icon={Linkedin}
              accent="text-sky-600 dark:text-sky-400"
              posts={liPosts}
            />
          </div>

          <PostsGeradosPanel selectedId={selectedId} />
        </div>
      </div>
    </div>
  );
}

function PostColumn({
  title,
  icon: Icon,
  accent,
  posts,
}: {
  title: string;
  icon: typeof Instagram;
  accent: string;
  posts: string[];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <Icon size={16} className={accent} />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {title}
        </span>
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
          {posts.length} posts
        </span>
      </div>
      <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
        {posts.length === 0 ? (
          <EmptyState message={`Nenhum post para ${title}.`} />
        ) : (
          posts.map((p, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/30"
            >
              <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                {p}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function PostsGeradosPanel({ selectedId }: { selectedId: number | null }) {
  const [posts, setPosts] = useState<PostGerado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    // conteudo_gerado_id is nullable and currently null for all rows, so we
    // load all posts and filter client-side when a report is selected.
    const { data, error } = await supabase
      .from('posts_gerados')
      .select(
        'id, conteudo_gerado_id, plataforma, conteudo, status, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(100);
    setLoading(false);
    if (error) {
      setError(error.message);
      setPosts([]);
      return;
    }
    setPosts((data as PostGerado[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: number) {
    setApprovingId(id);
    const optimistic = posts.map((p) =>
      p.id === id ? { ...p, status: 'aprovado' } : p,
    );
    setPosts(optimistic);
    const { error } = await supabase
      .from('posts_gerados')
      .update({ status: 'aprovado' })
      .eq('id', id);
    setApprovingId(null);
    if (error) {
      setError(error.message);
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'pendente' } : p)),
      );
    }
  }

  const visible =
    selectedId !== null
      ? posts.filter((p) => p.conteudo_gerado_id === selectedId)
      : posts;
  const ig = visible.filter((p) => canonicalPlataforma(p.plataforma) === 'instagram');
  const li = visible.filter((p) => canonicalPlataforma(p.plataforma) === 'linkedin');

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <MessageCircle size={16} className="text-brand-600 dark:text-brand-400" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Tabela <code>posts_gerados</code>
        </span>
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
          {visible.length} posts
          {selectedId !== null ? ` (relatório #${selectedId})` : ' (todos)'}
        </span>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="text-brand-600" />
          </div>
        ) : error ? (
          <ErrorState message={error} />
        ) : visible.length === 0 ? (
          <EmptyState message="Nenhum post na tabela." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PostList
              title="Instagram"
              icon={Instagram}
              accent="text-pink-600 dark:text-pink-400"
              posts={ig}
              approvingId={approvingId}
              onApprove={approve}
            />
            <PostList
              title="LinkedIn"
              icon={Linkedin}
              accent="text-sky-600 dark:text-sky-400"
              posts={li}
              approvingId={approvingId}
              onApprove={approve}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

function PostList({
  title,
  icon: Icon,
  accent,
  posts,
  approvingId,
  onApprove,
}: {
  title: string;
  icon: typeof Instagram;
  accent: string;
  posts: PostGerado[];
  approvingId: number | null;
  onApprove: (id: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={accent} />
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
          {title}
        </span>
      </div>
      <div className="space-y-3">
        {posts.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">Nenhum post.</p>
        ) : (
          posts.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/30"
            >
              <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                {p.conteudo}
              </p>
              <div className="flex items-center justify-between mt-3">
                <Badge status={p.status ?? 'pendente'} />
                {(p.status ?? 'pendente') === 'pendente' ? (
                  <button
                    onClick={() => onApprove(p.id)}
                    disabled={approvingId === p.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-60"
                  >
                    {approvingId === p.id ? <Spinner /> : <CheckCircle2 size={14} />}
                    Aprovar
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={14} /> Aprovado
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

type ImpactTier = 'alto' | 'alerta' | 'ruido';

function impactTier(score: number): ImpactTier {
  if (score >= 8) return 'alto';
  if (score >= 5) return 'alerta';
  return 'ruido';
}

const tierConfig: Record<
  ImpactTier,
  {
    label: string;
    badge: string;
    card: string;
    accent: string;
    badgeText: string;
  }
> = {
  alto: {
    label: 'Tese Estratégica',
    badge:
      'bg-emerald-600 text-white border-emerald-700 dark:bg-emerald-500 dark:border-emerald-400',
    card:
      'border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20',
    accent: 'text-emerald-700 dark:text-emerald-300',
    badgeText: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
  },
  alerta: {
    label: 'Monitoramento',
    badge:
      'bg-amber-500 text-white border-amber-600 dark:bg-amber-500 dark:border-amber-400',
    card:
      'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10',
    accent: 'text-amber-700 dark:text-amber-300',
    badgeText: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
  },
  ruido: {
    label: 'Ruído',
    badge:
      'bg-slate-400 text-white border-slate-500 dark:bg-slate-500 dark:border-slate-400',
    card:
      'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 opacity-70',
    accent: 'text-slate-500 dark:text-slate-400',
    badgeText: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
};

function RadarEstrategico({ topicos }: { topicos: TopicoEstrategico[] }) {
  const sorted = [...topicos].sort(
    (a, b) => (b.pontuacao_relevancia ?? 0) - (a.pontuacao_relevancia ?? 0),
  );

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-1">
        <Radar size={18} className="text-brand-600 dark:text-brand-400" />
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Radar Estratégico
        </h2>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
        Clusterização e pontuação de relevância das notícias do mercado imobiliário e
        logístico, ordenada por impacto.
      </p>

      {sorted.length === 0 ? (
        <EmptyState message="Nenhum tópico estratégico gerado para este relatório." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((t, i) => (
            <TopicoCard key={`${t.tema_macro}-${i}`} topico={t} />
          ))}
        </div>
      )}
    </Card>
  );
}

function TopicoCard({ topico }: { topico: TopicoEstrategico }) {
  const [expanded, setExpanded] = useState(false);
  const score = topico.pontuacao_relevancia ?? 0;
  const tier = impactTier(score);
  const cfg = tierConfig[tier];
  const isRuido = tier === 'ruido';

  return (
    <div
      className={`rounded-xl border ${cfg.card} p-4 transition-all`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
          {topico.tema_macro}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${cfg.badgeText}`}
          >
            {cfg.label}
          </span>
          <span
            className={`inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-md text-sm font-bold border ${cfg.badge}`}
            title="Pontuação de relevância"
          >
            {score}
          </span>
        </div>
      </div>

      {topico.justificativa_pontuacao && (
        <p className={`text-xs ${cfg.accent} mb-3 italic`}>
          {topico.justificativa_pontuacao}
        </p>
      )}

      {isRuido && !expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline"
        >
          Ver síntese
        </button>
      ) : (
        topico.sintese && (
          <div>
            {isRuido && (
              <button
                onClick={() => setExpanded(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline mb-2"
              >
                Recolher
              </button>
            )}
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {topico.sintese}
            </p>
          </div>
        )
      )}
    </div>
  );
}
