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
  Radar,
  Clock,
  Check,
  CircleDashed,
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

type PostTab = 'instagram' | 'linkedin';

export default function ApprovalCenter() {
  const [relatorios, setRelatorios] = useState<ConteudoGerado[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [posts, setPosts] = useState<PostGerado[]>([]);
  const [loadingRel, setLoadingRel] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [errorRel, setErrorRel] = useState<string | null>(null);
  const [errorPosts, setErrorPosts] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [postTab, setPostTab] = useState<PostTab>('instagram');

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

  const approvedCount = selectedPosts.filter((p) => (p.status ?? 'pendente') === 'aprovado').length;
  const pendingCount = selectedPosts.length - approvedCount;
  const activeTabPosts = postTab === 'instagram' ? igPosts : liPosts;

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Reports list */}
        <aside className="lg:col-span-4 xl:col-span-3">
          <Card className="overflow-hidden lg:sticky lg:top-4">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Notícias geradas
              </span>
              <span className="text-xs text-slate-400">{relatorios.length}</span>
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
              <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[60vh] lg:max-h-[calc(100vh-12rem)] overflow-y-auto">
                {relatorios.map((r) => {
                  const count = posts.filter((p) => p.conteudo_gerado_id === r.id).length;
                  return (
                    <li key={r.id}>
                      <button
                        onClick={() => setSelectedId(r.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                          selectedId === r.id
                            ? 'bg-brand-50 dark:bg-brand-950/40 border-l-2 border-brand-600'
                            : 'border-l-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <FileText size={15} className="mt-0.5 text-slate-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
                              {r.relatorio_tendencias}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                              <Clock size={10} />
                              {new Date(r.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              {count > 0 && (
                                <span className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300 font-medium">
                                  {count}
                                </span>
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
        </aside>

        {/* Detail */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          {!selected ? (
            <EmptyState message="Selecione uma notícia gerada à esquerda." />
          ) : (
            <>
              {/* Summary stats bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatChip
                  icon={Layers}
                  label="Posts"
                  value={selectedPosts.length}
                  tone="brand"
                />
                <StatChip
                  icon={Check}
                  label="Aprovados"
                  value={approvedCount}
                  tone="success"
                />
                <StatChip
                  icon={CircleDashed}
                  label="Pendentes"
                  value={pendingCount}
                  tone="warning"
                />
                <StatChip
                  icon={Radar}
                  label="Tópicos"
                  value={topicos.length}
                  tone="gold"
                />
              </div>

              {/* Report text - collapsible */}
              <RelatorioCard texto={selected.relatorio_tendencias} createdAt={selected.created_at} />

              {/* Strategic topics - collapsible */}
              {topicos.length > 0 && <RadarEstrategico topicos={topicos} />}

              {/* Related posts with tabs */}
              <Card className="overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Layers size={18} className="text-gold-600 dark:text-gold-400" />
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        Posts relacionados
                      </h2>
                    </div>
                    {/* Tabs */}
                    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-fit">
                      <TabButton
                        active={postTab === 'instagram'}
                        onClick={() => setPostTab('instagram')}
                        icon={Instagram}
                        label="Instagram"
                        count={igPosts.length}
                      />
                      <TabButton
                        active={postTab === 'linkedin'}
                        onClick={() => setPostTab('linkedin')}
                        icon={Linkedin}
                        label="LinkedIn"
                        count={liPosts.length}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {loadingPosts ? (
                    <div className="flex justify-center py-8">
                      <Spinner className="text-brand-600" />
                    </div>
                  ) : errorPosts ? (
                    <ErrorState message={errorPosts} />
                  ) : activeTabPosts.length === 0 ? (
                    <EmptyState message={`Nenhum post para ${postTab === 'instagram' ? 'Instagram' : 'LinkedIn'}.`} />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {activeTabPosts.map((p) => (
                        <BriefingApprovalCard
                          key={p.id}
                          post={p}
                          approvingId={approvingId}
                          onApprove={approve}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Layers;
  label: string;
  value: number;
  tone: 'brand' | 'success' | 'warning' | 'gold';
}) {
  const tones: Record<string, string> = {
    brand: 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40',
    success: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
    warning: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40',
    gold: 'text-gold-600 dark:text-gold-400 bg-gold-50 dark:bg-gold-950/40',
  };
  return (
    <Card className="p-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tones[tone]}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">
          {value}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
          {label}
        </div>
      </div>
    </Card>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Instagram;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
        active
          ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
      }`}
    >
      <Icon size={15} />
      {label}
      <span
        className={`text-[11px] px-1.5 py-0.5 rounded-full ${
          active
            ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-200'
            : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function RelatorioCard({ texto, createdAt }: { texto: string; createdAt: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = texto.length > 280;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <FileText size={16} className="text-white" />
        </div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Relatório de Tendências
        </h2>
      </div>
      <p
        className={`text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed ${
          isLong && !expanded ? 'line-clamp-4' : ''
        }`}
      >
        {texto}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 mt-2"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Recolher relatório' : 'Ler relatório completo'}
        </button>
      )}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Calendar size={12} />
        Gerado em {new Date(createdAt).toLocaleString('pt-BR')}
      </div>
    </Card>
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
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            {isInstagram ? (
              <Instagram size={15} className={platformAccent} />
            ) : (
              <Linkedin size={15} className={platformAccent} />
            )}
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {isInstagram ? 'Instagram' : 'LinkedIn'}
            </span>
          </div>
          {post.formato && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-900">
              {post.formato}
            </span>
          )}
        </div>

        {post.headline && (
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2">
            {post.headline}
          </h3>
        )}
        {post.subtitulo && (
          <p className="text-[13px] text-slate-600 dark:text-slate-300 mt-1 leading-snug line-clamp-2">
            {post.subtitulo}
          </p>
        )}
      </div>

      <div className="px-4 py-3 flex-1 flex flex-col gap-2.5">
        {post.texto_apoio && (
          <p className="text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed line-clamp-3">
            {post.texto_apoio}
          </p>
        )}

        {post.cta && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gold-50 dark:bg-gold-950/30 border border-gold-200 dark:border-gold-800">
            <ArrowRight size={13} className="text-gold-600 dark:text-gold-400 shrink-0" />
            <span className="text-[13px] font-semibold text-gold-800 dark:text-gold-200 line-clamp-1">
              {post.cta}
            </span>
          </div>
        )}

        {(post.legenda || post.hashtags) && (
          <div className="mt-0.5">
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {open ? 'Recolher' : 'Ver legenda e hashtags'}
            </button>

            {open && (
              <div className="mt-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-2.5 space-y-2">
                {post.legenda && (
                  <div className="flex gap-1.5">
                    <Quote size={13} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                    <p className="text-[13px] text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {post.legenda}
                    </p>
                  </div>
                )}
                {post.hashtags && (
                  <div className="flex items-start gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <Hash size={13} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                    <p className="text-[13px] text-brand-600 dark:text-brand-400 font-medium break-words">
                      {post.hashtags}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Approval action */}
        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-slate-100 dark:border-slate-800">
          <Badge status={isApproved ? 'aprovado' : 'pendente'} />
          {isApproved ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 size={13} /> Aprovado
            </span>
          ) : (
            <button
              onClick={() => onApprove(post.id)}
              disabled={approvingId === post.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-60 transition-colors"
            >
              {approvingId === post.id ? <Spinner /> : <CheckCircle2 size={13} />}
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
  const [open, setOpen] = useState(true);
  const sorted = [...topicos].sort(
    (a, b) => (b.pontuacao_relevancia ?? 0) - (a.pontuacao_relevancia ?? 0),
  );

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Radar size={16} className="text-white" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Tópicos Estratégicos
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {topicos.length} tópicos clusterizados
            </p>
          </div>
        </div>
        {open ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {sorted.length === 0 ? (
            <EmptyState message="Nenhum tópico estratégico gerado." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sorted.map((t, i) => (
                <TopicoCard key={`${t.tema_macro}-${i}`} topico={t} />
              ))}
            </div>
          )}
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
    <div className={`rounded-lg border ${cfg.card} p-3 transition-all`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 leading-snug pr-1">
          {topico.tema_macro}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${cfg.badgeText}`}
          >
            {cfg.label}
          </span>
          <span
            className={`inline-flex items-center justify-center min-w-[26px] h-6 px-1 rounded text-xs font-bold border ${cfg.badge}`}
            title="Pontuação de relevância"
          >
            {score}
          </span>
        </div>
      </div>

      <div className="h-1 w-full rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden mb-2">
        <div
          className={`h-full rounded-full ${cfg.bar} transition-all`}
          style={{ width: `${Math.min(100, score * 10)}%` }}
        />
      </div>

      {topico.justificativa_pontuacao && (
        <p className={`text-[11px] ${cfg.accent} mb-2 italic leading-relaxed line-clamp-2`}>
          {topico.justificativa_pontuacao}
        </p>
      )}

      {isRuido && !expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline"
        >
          Ver síntese
        </button>
      ) : (
        topico.sintese && (
          <div>
            {isRuido && (
              <button
                onClick={() => setExpanded(false)}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline mb-1.5"
              >
                Recolher
              </button>
            )}
            <p className="text-[13px] text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {topico.sintese}
            </p>
          </div>
        )
      )}
    </div>
  );
}
