import { useEffect, useState } from 'react';
import {
  FileText,
  Instagram,
  Linkedin,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Quote,
  Hash,
  ArrowRight,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  supabase,
  normalizeTopicos,
  canonicalPlataforma,
  type ConteudoGerado,
  type PostGerado,
  type TopicoEstrategico,
} from '../lib/supabaseClient';
import { Badge, Card, EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui';

export default function ApprovalCenter() {
  const [relatorios, setRelatorios] = useState<ConteudoGerado[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [posts, setPosts] = useState<PostGerado[]>([]);
  const [loadingRel, setLoadingRel] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [errorRel, setErrorRel] = useState<string | null>(null);
  const [errorPosts, setErrorPosts] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  async function loadRelatorios() {
    setLoadingRel(true);
    setErrorRel(null);
    const { data, error } = await supabase
      .from('conteudo_gerado')
      .select(
        'id, relatorio_tendencias, topicos_estrategicos, sugestoes_pautas, created_at',
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

  async function loadPosts() {
    setLoadingPosts(true);
    setErrorPosts(null);
    const { data, error } = await supabase
      .from('posts_gerados')
      .select(
        'id, conteudo_gerado_id, plataforma, formato, headline, subtitulo, texto_apoio, cta, legenda, hashtags, status, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(200);
    setLoadingPosts(false);
    if (error) {
      setErrorPosts(error.message);
      setPosts([]);
      return;
    }
    setPosts((data as PostGerado[]) ?? []);
  }

  useEffect(() => {
    loadRelatorios();
    loadPosts();
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
      setErrorPosts(error.message);
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'pendente' } : p)),
      );
    }
  }

  const selected = relatorios.find((r) => r.id === selectedId) ?? null;
  const selectedPosts = selectedId !== null
    ? posts.filter((p) => p.conteudo_gerado_id === selectedId)
    : [];
  const igPosts = selectedPosts.filter((p) => canonicalPlataforma(p.plataforma) === 'instagram');
  const liPosts = selectedPosts.filter((p) => canonicalPlataforma(p.plataforma) === 'linkedin');
  const topicos = selected ? normalizeTopicos(selected.topicos_estrategicos) : [];

  return (
    <div>
      <PageHeader
        title="Central de Aprovação"
        subtitle="Revise cada notícia gerada e aprove os posts relacionados"
        action={
          <button
            onClick={() => {
              loadRelatorios();
              loadPosts();
            }}
            disabled={loadingRel || loadingPosts}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
          >
            {loadingRel || loadingPosts ? <Spinner /> : <RefreshCw size={16} />}
            Atualizar
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reports list */}
        <div className="lg:col-span-4">
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200">
              Notícias geradas
            </div>
            {loadingRel ? (
              <div className="flex justify-center py-10">
                <Spinner className="text-brand-600" />
              </div>
            ) : errorRel ? (
              <ErrorState message={errorRel} />
            ) : relatorios.length === 0 ? (
              <EmptyState message="Nenhum relatório gerado." />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[70vh] overflow-y-auto">
                {relatorios.map((r) => {
                  const count = posts.filter((p) => p.conteudo_gerado_id === r.id).length;
                  return (
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
                          <FileText size={16} className="mt-0.5 text-slate-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm text-slate-800 dark:text-slate-100 line-clamp-2">
                              {r.relatorio_tendencias}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-1">
                              <span>#{r.id}</span>
                              <span>·</span>
                              <span>{new Date(r.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                              {count > 0 && (
                                <>
                                  <span>·</span>
                                  <span className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400">
                                    <Layers size={11} />
                                    {count} posts
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Detail */}
        <div className="lg:col-span-8 space-y-6">
          {!selected ? (
            <EmptyState message="Selecione uma notícia gerada à esquerda." />
          ) : (
            <>
              {/* Report text */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={18} className="text-brand-600 dark:text-brand-400" />
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Relatório de Tendências
                  </h2>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selected.relatorio_tendencias}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-4">
                  <Calendar size={12} />
                  Gerado em {new Date(selected.created_at).toLocaleString('pt-BR')}
                </div>
              </Card>

              {/* Strategic topics */}
              {topicos.length > 0 && <RadarEstrategico topicos={topicos} />}

              {/* Related posts */}
              <Card className="p-5">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Layers size={18} className="text-gold-600 dark:text-gold-400" />
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Posts relacionados
                    </h2>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {selectedPosts.length} {selectedPosts.length === 1 ? 'post' : 'posts'}
                  </span>
                </div>

                {loadingPosts ? (
                  <div className="flex justify-center py-8">
                    <Spinner className="text-brand-600" />
                  </div>
                ) : errorPosts ? (
                  <ErrorState message={errorPosts} />
                ) : selectedPosts.length === 0 ? (
                  <EmptyState message="Nenhum post gerado para esta notícia." />
                ) : (
                  <div className="space-y-6">
                    <PostGroup
                      title="Instagram"
                      icon={Instagram}
                      accent="text-pink-600 dark:text-pink-400"
                      posts={igPosts}
                      approvingId={approvingId}
                      onApprove={approve}
                    />
                    <PostGroup
                      title="LinkedIn"
                      icon={Linkedin}
                      accent="text-sky-600 dark:text-sky-400"
                      posts={liPosts}
                      approvingId={approvingId}
                      onApprove={approve}
                    />
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PostGroup({
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
  if (posts.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className={accent} />
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {title}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          ({posts.length})
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map((p) => (
          <BriefingApprovalCard
            key={p.id}
            post={p}
            approvingId={approvingId}
            onApprove={onApprove}
          />
        ))}
      </div>
    </div>
  );
}

function BriefingApprovalCard({
  post,
  approvingId,
  onApprove,
}: {
  post: PostGerado;
  approvingId: number | null;
  onApprove: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const isInstagram = canonicalPlataforma(post.plataforma) === 'instagram';
  const platformAccent = isInstagram
    ? 'text-pink-600 dark:text-pink-400'
    : 'text-sky-600 dark:text-sky-400';
  const status = post.status ?? 'pendente';
  const isApproved = status === 'aprovado';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {isInstagram ? (
              <Instagram size={16} className={platformAccent} />
            ) : (
              <Linkedin size={16} className={platformAccent} />
            )}
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isInstagram ? 'Instagram' : 'LinkedIn'}
            </span>
          </div>
          {post.formato && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-900">
              {post.formato}
            </span>
          )}
        </div>

        {post.headline && (
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
            {post.headline}
          </h3>
        )}
        {post.subtitulo && (
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-snug">
            {post.subtitulo}
          </p>
        )}
      </div>

      <div className="px-5 py-4 flex-1 flex flex-col gap-3">
        {post.texto_apoio && (
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            {post.texto_apoio}
          </p>
        )}

        {post.cta && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gold-50 dark:bg-gold-950/30 border border-gold-200 dark:border-gold-800">
            <ArrowRight size={14} className="text-gold-600 dark:text-gold-400 shrink-0" />
            <span className="text-sm font-semibold text-gold-800 dark:text-gold-200">
              {post.cta}
            </span>
          </div>
        )}

        {(post.legenda || post.hashtags) && (
          <div className="mt-1">
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {open ? 'Recolher legenda' : 'Ver legenda e hashtags'}
            </button>

            {open && (
              <div className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-3 space-y-2.5">
                {post.legenda && (
                  <div className="flex gap-2">
                    <Quote size={14} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {post.legenda}
                    </p>
                  </div>
                )}
                {post.hashtags && (
                  <div className="flex items-start gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <Hash size={14} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-brand-600 dark:text-brand-400 font-medium break-words">
                      {post.hashtags}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Approval action */}
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Badge status={isApproved ? 'aprovado' : 'pendente'} />
          {isApproved ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 size={14} /> Aprovado
            </span>
          ) : (
            <button
              onClick={() => onApprove(post.id)}
              disabled={approvingId === post.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-60 transition-colors"
            >
              {approvingId === post.id ? <Spinner /> : <CheckCircle2 size={14} />}
              Aprovar
            </button>
          )}
        </div>
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
  { label: string; badge: string; card: string; accent: string; badgeText: string; bar: string }
> = {
  alto: {
    label: 'Tese Estratégica',
    badge:
      'bg-gold-500 text-brand-950 border-gold-600 dark:bg-gold-400 dark:border-gold-300',
    card:
      'border-gold-300 dark:border-gold-700/60 bg-gold-50/60 dark:bg-gold-950/20',
    accent: 'text-gold-700 dark:text-gold-300',
    badgeText:
      'bg-gold-100 text-gold-800 dark:bg-gold-900/60 dark:text-gold-200',
    bar: 'bg-gold-500 dark:bg-gold-400',
  },
  alerta: {
    label: 'Monitoramento',
    badge:
      'bg-brand-500 text-white border-brand-600 dark:bg-brand-400 dark:border-brand-300',
    card:
      'border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/20',
    accent: 'text-brand-700 dark:text-brand-300',
    badgeText:
      'bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200',
    bar: 'bg-brand-500 dark:bg-brand-400',
  },
  ruido: {
    label: 'Ruído',
    badge:
      'bg-slate-400 text-white border-slate-500 dark:bg-slate-500 dark:border-slate-400',
    card:
      'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 opacity-80',
    accent: 'text-slate-500 dark:text-slate-400',
    badgeText:
      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    bar: 'bg-slate-400 dark:bg-slate-500',
  },
};

function RadarEstrategico({ topicos }: { topicos: TopicoEstrategico[] }) {
  const sorted = [...topicos].sort(
    (a, b) => (b.pontuacao_relevancia ?? 0) - (a.pontuacao_relevancia ?? 0),
  );

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-1">
        <Layers size={18} className="text-brand-600 dark:text-brand-400" />
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Tópicos Estratégicos
        </h2>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
        Clusterização e pontuação de relevância, ordenada por impacto.
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
    <div className={`rounded-xl border ${cfg.card} p-4 transition-all`}>
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug pr-1">
          {topico.tema_macro}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${cfg.badgeText}`}
          >
            {cfg.label}
          </span>
          <span
            className={`inline-flex items-center justify-center min-w-[30px] h-7 px-1.5 rounded-md text-sm font-bold border ${cfg.badge}`}
            title="Pontuação de relevância"
          >
            {score}
          </span>
        </div>
      </div>

      <div className="h-1.5 w-full rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden mb-3">
        <div
          className={`h-full rounded-full ${cfg.bar} transition-all`}
          style={{ width: `${Math.min(100, score * 10)}%` }}
        />
      </div>

      {topico.justificativa_pontuacao && (
        <p className={`text-xs ${cfg.accent} mb-3 italic leading-relaxed`}>
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
