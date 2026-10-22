import { useEffect, useState, useCallback } from 'react';
import {
  CalendarRange,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Linkedin,
  Instagram,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  CircleDashed,
  Layers,
  Quote,
  Calendar,
  Star,
  Save,
  AlertCircle,
  Maximize2,
  X,
  AlignLeft,
  Type,
  Newspaper,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import type {
  ConteudoSemanal,
  TopicoSemanal,
  PostLinkedIn,
  PostInstagram,
  ReferenciaDiaria,
  ConteudoGerado,
} from '../lib/supabaseClient';
import { normalizeTopicos } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Badge, Card, EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui';
import { formatCycle, parseFlexibleDate } from '../lib/format';

type Tab = 'evolucao' | 'linkedin' | 'instagram';

function normalizeTopicosSemanais(raw: unknown): TopicoSemanal[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter(
      (t): t is TopicoSemanal =>
        t !== null && typeof t === 'object' && typeof (t as TopicoSemanal).tema === 'string',
    );
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return normalizeTopicosSemanais(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

function normalizePostsLinkedIn(raw: unknown): PostLinkedIn[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter(
      (t): t is PostLinkedIn =>
        t !== null && typeof t === 'object' && typeof (t as PostLinkedIn).tema === 'string',
    );
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return normalizePostsLinkedIn(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

function normalizePostsInstagram(raw: unknown): PostInstagram[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter(
      (t): t is PostInstagram =>
        t !== null && typeof t === 'object' && typeof (t as PostInstagram).tema === 'string',
    );
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return normalizePostsInstagram(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeReferencias(raw: unknown): ReferenciaDiaria[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter(
      (t): t is ReferenciaDiaria =>
        t !== null && typeof t === 'object' && typeof (t as ReferenciaDiaria).data === 'string',
    );
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return normalizeReferencias(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

// parseFlexibleDate: aceita "aaaa-mm-dd" sem deslocar para UTC e o legado "dd/mm/aaaa"
// de referencias_diarias.data.
function formatDateRange(inicio: string, fim: string): string {
  return formatCycle(inicio, fim);
}

function formatDateShort(dateStr: string): string {
  const date = parseFlexibleDate(dateStr);
  return date
    ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : dateStr;
}

function formatDateFull(dateStr: string): string {
  const date = parseFlexibleDate(dateStr);
  return date
    ? date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : dateStr;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  pendente: {
    label: 'Pendente',
    icon: CircleDashed,
    cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  },
  aprovado: {
    label: 'Aprovado',
    icon: CheckCircle2,
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
  },
  rejeitado: {
    label: 'Rejeitado',
    icon: XCircle,
    cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
  },
};

export default function WeeklySummary() {
  const { profile } = useAuth();
  const canEdit = profile?.role === 'admin' || profile?.role === 'editor';

  const [semanais, setSemanais] = useState<ConteudoSemanal[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('evolucao');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notaDraft, setNotaDraft] = useState<number>(0);
  const [savingNota, setSavingNota] = useState(false);
  const [notaSaved, setNotaSaved] = useState(false);

  const [detailPostLi, setDetailPostLi] = useState<PostLinkedIn | null>(null);
  const [detailPostIg, setDetailPostIg] = useState<PostInstagram | null>(null);
  const [detailRef, setDetailRef] = useState<ReferenciaDiaria | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('conteudo_semanal')
      .select(
        'id, ciclo_inicio, ciclo_fim, relatorio_evolutivo, topicos_estrategicos, posts_linkedin, posts_instagram, referencias_diarias, status, nota_semanal, created_at, updated_at',
      )
      .order('ciclo_inicio', { ascending: false })
      .limit(50);
    setLoading(false);
    if (error) {
      setError(error.message);
      setSemanais([]);
      return;
    }
    const rows = (data as ConteudoSemanal[]) ?? [];
    setSemanais(rows);
    if (rows[0] && !selectedId) setSelectedId(rows[0].id);
  }, [selectedId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = semanais.find((s) => s.id === selectedId) ?? null;

  useEffect(() => {
    if (selected) {
      setNotaDraft(selected.nota_semanal ?? 0);
    }
  }, [selectedId, selected?.nota_semanal]);

  async function updateStatus(id: string, status: 'aprovado' | 'rejeitado') {
    setActionLoading(status);
    const { error } = await supabase
      .from('conteudo_semanal')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    setActionLoading(null);
    if (error) {
      setError(error.message);
      return;
    }
    setSemanais((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  }

  async function saveNota() {
    if (!selected) return;
    setSavingNota(true);
    const { error } = await supabase
      .from('conteudo_semanal')
      .update({ nota_semanal: notaDraft, updated_at: new Date().toISOString() })
      .eq('id', selected.id);
    setSavingNota(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSemanais((prev) =>
      prev.map((s) => (s.id === selected.id ? { ...s, nota_semanal: notaDraft } : s)),
    );
    setNotaSaved(true);
    setTimeout(() => setNotaSaved(false), 2000);
  }

  const topicos = selected ? normalizeTopicosSemanais(selected.topicos_estrategicos) : [];
  const postsLi = selected ? normalizePostsLinkedIn(selected.posts_linkedin) : [];
  const postsIg = selected ? normalizePostsInstagram(selected.posts_instagram) : [];
  const referencias = selected ? normalizeReferencias(selected.referencias_diarias) : [];

  const pendentesCount = semanais.filter((s) => (s.status ?? 'pendente') === 'pendente').length;
  const aprovadosCount = semanais.filter((s) => s.status === 'aprovado').length;
  const rejeitadosCount = semanais.filter((s) => s.status === 'rejeitado').length;

  return (
    <div>
      <PageHeader
        title="Fechamento Semanal"
        subtitle="Evolução semanal dos tópicos estratégicos, posts e roteiros"
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

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
            <Layers size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">
              {semanais.length}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Total
            </div>
          </div>
        </Card>
        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <CircleDashed size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">
              {pendentesCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Pendentes
            </div>
          </div>
        </Card>
        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">
              {aprovadosCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Aprovados
            </div>
          </div>
        </Card>
        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <XCircle size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-none">
              {rejeitadosCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              Rejeitados
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sidebar list */}
        <aside className="lg:col-span-4 xl:col-span-3">
          <Card className="overflow-hidden lg:sticky lg:top-4">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Fechamentos
              </span>
              <span className="text-xs text-slate-400">{semanais.length}</span>
            </div>
            {loading ? (
              <div className="flex justify-center py-10">
                <Spinner className="text-brand-600" />
              </div>
            ) : error ? (
              <ErrorState message={error} />
            ) : semanais.length === 0 ? (
              <EmptyState message="Nenhum fechamento semanal encontrado." />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[60vh] lg:max-h-[calc(100vh-12rem)] overflow-y-auto">
                {semanais.map((s) => {
                  const statusKey = (s.status ?? 'pendente').toLowerCase();
                  const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pendente;
                  const StatusIcon = cfg.icon;
                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => setSelectedId(s.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                          selectedId === s.id
                            ? 'bg-brand-50 dark:bg-brand-950/40 border-l-2 border-brand-600'
                            : 'border-l-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <CalendarRange size={15} className="mt-0.5 text-slate-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-medium text-slate-800 dark:text-slate-100 leading-snug">
                              {formatDateRange(s.ciclo_inicio, s.ciclo_fim)}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                              <span
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${cfg.cls}`}
                              >
                                <StatusIcon size={10} />
                                {cfg.label}
                              </span>
                              {s.nota_semanal != null && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gold-100 text-gold-800 dark:bg-gold-900/50 dark:text-gold-300">
                                  <Star size={10} />
                                  {s.nota_semanal}
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
            <EmptyState message="Selecione um fechamento semanal à esquerda." />
          ) : (
            <>
              {/* Header card with date range + status */}
              <Card className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
                      <CalendarRange size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {formatDateRange(selected.ciclo_inicio, selected.ciclo_fim)}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge status={selected.status ?? 'pendente'} />
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                          <Clock size={11} />
                          {new Date(selected.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Tabs */}
              <Card className="overflow-hidden">
                <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
                  <TabButton
                    active={tab === 'evolucao'}
                    onClick={() => setTab('evolucao')}
                    icon={TrendingUp}
                    label="Evolução Semanal"
                  />
                  <TabButton
                    active={tab === 'linkedin'}
                    onClick={() => setTab('linkedin')}
                    icon={Linkedin}
                    label="Posts LinkedIn"
                    count={postsLi.length}
                  />
                  <TabButton
                    active={tab === 'instagram'}
                    onClick={() => setTab('instagram')}
                    icon={Instagram}
                    label="Roteiros Instagram"
                    count={postsIg.length}
                  />
                </div>

                <div className="p-4 sm:p-5">
                  {tab === 'evolucao' && (
                    <EvolucaoTab
                      selected={selected}
                      topicos={topicos}
                      referencias={referencias}
                      onOpenRef={setDetailRef}
                    />
                  )}
                  {tab === 'linkedin' && (
                    <LinkedInTab posts={postsLi} onOpenDetail={setDetailPostLi} />
                  )}
                  {tab === 'instagram' && (
                    <InstagramTab posts={postsIg} onOpenDetail={setDetailPostIg} />
                  )}
                </div>
              </Card>

              {/* Note calibration */}
              <Card className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center">
                    <Star size={16} className="text-brand-950" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Calibragem da Nota Semanal
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Ajuste a nota geral deste fechamento (0 a 10)
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={10}
                        step={1}
                        value={notaDraft}
                        onChange={(e) => setNotaDraft(Number(e.target.value))}
                        disabled={!canEdit}
                        className="flex-1 accent-gold-500 cursor-pointer disabled:opacity-50"
                      />
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg border-2 border-gold-400 bg-gold-50 dark:bg-gold-950/30 shrink-0">
                        <span className="text-lg font-bold text-gold-700 dark:text-gold-300">
                          {notaDraft}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
                      {[0, 2, 4, 6, 8, 10].map((n) => (
                        <span key={n}>{n}</span>
                      ))}
                    </div>
                  </div>

                  {canEdit && (
                    <button
                      onClick={saveNota}
                      disabled={savingNota || notaDraft === (selected.nota_semanal ?? 0)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-950 bg-gold-500 hover:bg-gold-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                    >
                      {savingNota ? <Spinner /> : notaSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                      {notaSaved ? 'Salvo!' : 'Salvar nota'}
                    </button>
                  )}
                </div>

                {!canEdit && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 flex items-center gap-1.5">
                    <AlertCircle size={12} />
                    Apenas administradores e editores podem ajustar a nota.
                  </p>
                )}
              </Card>

              {/* Action buttons */}
              {canEdit && (
                <Card className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Ações do Fechamento
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Aprove ou rejeite este fechamento semanal
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateStatus(selected.id, 'aprovado')}
                        disabled={actionLoading !== null || selected.status === 'aprovado'}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {actionLoading === 'aprovado' ? <Spinner /> : <CheckCircle2 size={16} />}
                        Aprovar Fechamento
                      </button>
                      <button
                        onClick={() => updateStatus(selected.id, 'rejeitado')}
                        disabled={actionLoading !== null || selected.status === 'rejeitado'}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {actionLoading === 'rejeitado' ? <Spinner /> : <XCircle size={16} />}
                        Rejeitar Fechamento
                      </button>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {detailPostLi && (
        <PostLinkedInDetailModal post={detailPostLi} onClose={() => setDetailPostLi(null)} />
      )}
      {detailPostIg && (
        <PostInstagramDetailModal post={detailPostIg} onClose={() => setDetailPostIg(null)} />
      )}
      {detailRef && (
        <ReferenciaDiariaModal refData={detailRef} onClose={() => setDetailRef(null)} />
      )}
    </div>
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
  icon: typeof TrendingUp;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active
          ? 'border-brand-600 text-brand-700 dark:text-brand-300'
          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
      }`}
    >
      <Icon size={15} />
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={`text-[11px] px-1.5 py-0.5 rounded-full ${
            active
              ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-200'
              : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function EvolucaoTab({
  selected,
  topicos,
  referencias,
  onOpenRef,
}: {
  selected: ConteudoSemanal;
  topicos: TopicoSemanal[];
  referencias: ReferenciaDiaria[];
  onOpenRef: (ref: ReferenciaDiaria) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const texto = selected.relatorio_evolutivo ?? '';
  const isLong = texto.length > 500;

  return (
    <div className="space-y-5">
      {/* Relatório evolutivo */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-brand-600 dark:text-brand-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Relatório Evolutivo
          </h3>
        </div>
        {texto ? (
          <>
            <div
              className={`text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed ${
                isLong && !expanded ? 'line-clamp-6' : ''
              }`}
            >
              {texto}
            </div>
            {isLong && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 mt-2"
              >
                {expanded ? <ChevronLeft size={14} className="rotate-90" /> : <ChevronRight size={14} className="rotate-90" />}
                {expanded ? 'Recolher relatório' : 'Ler relatório completo'}
              </button>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">
            Nenhum relatório evolutivo disponível.
          </p>
        )}
      </div>

      {/* Tópicos estratégicos */}
      {topicos.length > 0 && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Tópicos Estratégicos
            </h3>
            <span className="text-xs text-slate-400">({topicos.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topicos.map((t, i) => (
              <TopicoSemanalCard key={`${t.tema}-${i}`} topico={t} />
            ))}
          </div>
        </div>
      )}

      {/* Referências diárias */}
      {referencias.length > 0 && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Referências Diárias
            </h3>
            <span className="text-xs text-slate-400">({referencias.length})</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">
            Clique em uma data para ver o relatório completo daquele dia
          </p>
          <div className="flex flex-wrap gap-2">
            {referencias.map((ref, i) => (
              <button
                key={`${ref.id ?? i}`}
                onClick={() => onOpenRef(ref)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:border-brand-300 dark:hover:border-brand-700 transition-colors cursor-pointer"
                title={`Ver relatório de ${formatDateFull(ref.data)}`}
              >
                <Calendar size={12} className="text-slate-400 group-hover:text-brand-500" />
                {formatDateShort(ref.data)}
                <ChevronRight size={12} className="text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TopicoSemanalCard({ topico }: { topico: TopicoSemanal }) {
  const nota = topico.nota ?? 0;
  const tier = nota >= 8 ? 'alto' : nota >= 5 ? 'alerta' : 'ruido';
  const cfg = {
    alto: {
      badge: 'bg-gold-500 text-brand-950 border-gold-600',
      bar: 'bg-gold-500 dark:bg-gold-400',
      accent: 'text-gold-700 dark:text-gold-300',
      label: 'Tese Estratégica',
    },
    alerta: {
      badge: 'bg-brand-500 text-white border-brand-600',
      bar: 'bg-brand-500 dark:bg-brand-400',
      accent: 'text-brand-700 dark:text-brand-300',
      label: 'Monitoramento',
    },
    ruido: {
      badge: 'bg-slate-400 text-white border-slate-500',
      bar: 'bg-slate-400 dark:bg-slate-500',
      accent: 'text-slate-500 dark:text-slate-400',
      label: 'Ruído',
    },
  }[tier];

  return (
    <div className={`rounded-lg border p-3 ${tier === 'alto' ? 'border-gold-300 dark:border-gold-700/60 bg-gold-50/60 dark:bg-gold-950/20' : tier === 'alerta' ? 'border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/20' : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 leading-snug pr-1">
          {topico.tema}
        </h4>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${cfg.badge}`}>
            {cfg.label}
          </span>
          <span className={`inline-flex items-center justify-center min-w-[26px] h-6 px-1 rounded text-xs font-bold border ${cfg.badge}`}>
            {nota}
          </span>
        </div>
      </div>
      <div className="h-1 w-full rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden mb-2">
        <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${Math.min(100, nota * 10)}%` }} />
      </div>
      {topico.justificativa && (
        <p className={`text-[11px] ${cfg.accent} italic leading-relaxed`}>
          {topico.justificativa}
        </p>
      )}
    </div>
  );
}

/* ---------- LinkedIn posts tab ---------- */

function LinkedInTab({
  posts,
  onOpenDetail,
}: {
  posts: PostLinkedIn[];
  onOpenDetail: (post: PostLinkedIn) => void;
}) {
  if (posts.length === 0) {
    return <EmptyState message="Nenhum post de LinkedIn disponível." />;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {posts.map((p, i) => (
        <LinkedInCard key={`${p.tema}-${i}`} post={p} index={i} onOpenDetail={() => onOpenDetail(p)} />
      ))}
    </div>
  );
}

function LinkedInCard({
  post,
  index,
  onOpenDetail,
}: {
  post: PostLinkedIn;
  index: number;
  onOpenDetail: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft overflow-hidden flex flex-col">
      <button
        onClick={onOpenDetail}
        className="text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Linkedin size={15} className="text-sky-600 dark:text-sky-400" />
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              LinkedIn
            </span>
            <span className="text-[10px] text-slate-400">#{index + 1}</span>
          </div>
          <Maximize2 size={13} className="text-slate-300 dark:text-slate-600 group-hover:text-brand-500 transition-colors" />
        </div>
        <h4 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2">
          {post.tema}
        </h4>
      </button>

      <div className="px-4 py-3 flex-1 flex flex-col gap-2.5">
        <div className="flex gap-1.5">
          <AlignLeft size={13} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
          <p className="text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed line-clamp-4">
            {post.conteudo}
          </p>
        </div>

        <div className="mt-0.5">
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
          >
            {open ? <ChevronLeft size={13} className="rotate-90" /> : <ChevronRight size={13} className="rotate-90" />}
            {open ? 'Recolher' : 'Ver conteúdo completo'}
          </button>

          {open && (
            <div className="mt-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-2.5">
              <div className="flex gap-1.5">
                <Quote size={13} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                <p className="text-[13px] text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {post.conteudo}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] text-slate-400">Post LinkedIn</span>
          <button
            onClick={onOpenDetail}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
          >
            <Maximize2 size={12} />
            Abrir completo
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Instagram posts tab ---------- */

function InstagramTab({
  posts,
  onOpenDetail,
}: {
  posts: PostInstagram[];
  onOpenDetail: (post: PostInstagram) => void;
}) {
  if (posts.length === 0) {
    return <EmptyState message="Nenhum roteiro de Instagram disponível." />;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {posts.map((p, i) => (
        <InstagramCard key={`${p.tema}-${i}`} post={p} index={i} onOpenDetail={() => onOpenDetail(p)} />
      ))}
    </div>
  );
}

function InstagramCard({
  post,
  index,
  onOpenDetail,
}: {
  post: PostInstagram;
  index: number;
  onOpenDetail: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft overflow-hidden flex flex-col">
      <button
        onClick={onOpenDetail}
        className="text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Instagram size={15} className="text-pink-600 dark:text-pink-400" />
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Instagram
            </span>
            <span className="text-[10px] text-slate-400">#{index + 1}</span>
          </div>
          <Maximize2 size={13} className="text-slate-300 dark:text-slate-600 group-hover:text-brand-500 transition-colors" />
        </div>
        <h4 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2">
          {post.tema}
        </h4>
      </button>

      <div className="px-4 py-3 flex-1 flex flex-col gap-2.5">
        <div className="flex gap-1.5">
          <Quote size={13} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
          <p className="text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed line-clamp-4">
            {post.roteiro}
          </p>
        </div>

        <div className="mt-0.5">
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
          >
            {open ? <ChevronLeft size={13} className="rotate-90" /> : <ChevronRight size={13} className="rotate-90" />}
            {open ? 'Recolher' : 'Ver roteiro completo'}
          </button>

          {open && (
            <div className="mt-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-2.5">
              <div className="flex gap-1.5">
                <Quote size={13} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                <p className="text-[13px] text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {post.roteiro}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] text-slate-400">Roteiro Instagram</span>
          <button
            onClick={onOpenDetail}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
          >
            <Maximize2 size={12} />
            Abrir completo
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Post detail modals ---------- */

function PostLinkedInDetailModal({
  post,
  onClose,
}: {
  post: PostLinkedIn;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Linkedin size={18} className="text-sky-600 dark:text-sky-400" />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Post LinkedIn
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5 space-y-5">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
              <Type size={12} />
              Tema
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {post.tema}
            </h2>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
              <AlignLeft size={12} />
              Conteúdo
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {post.conteudo}
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function PostInstagramDetailModal({
  post,
  onClose,
}: {
  post: PostInstagram;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Instagram size={18} className="text-pink-600 dark:text-pink-400" />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Roteiro Instagram
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5 space-y-5">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
              <Type size={12} />
              Tema
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {post.tema}
            </h2>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
              <Quote size={12} />
              Roteiro
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {post.roteiro}
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Referência diária modal ---------- */

function ReferenciaDiariaModal({
  refData,
  onClose,
}: {
  refData: ReferenciaDiaria;
  onClose: () => void;
}) {
  const [conteudo, setConteudo] = useState<ConteudoGerado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchConteudo() {
      setLoading(true);
      setError(null);
      try {
        const refId = Number(refData.id);
        if (!Number.isFinite(refId)) {
          setError('ID da referência inválido.');
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('conteudo_gerado')
          .select(
            'id, relatorio_tendencias, posts_instagram, posts_linkedin, topicos_estrategicos, sugestoes_pautas, created_at',
          )
          .eq('id', refId)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        setConteudo(data as ConteudoGerado | null);
        setLoading(false);
      } catch {
        if (cancelled) return;
        setError('Erro ao carregar o relatório diário.');
        setLoading(false);
      }
    }
    fetchConteudo();
    return () => {
      cancelled = true;
    };
  }, [refData.id]);

  const topicos = conteudo ? normalizeTopicos(conteudo.topicos_estrategicos) : [];
  const postsIgRaw = conteudo?.posts_instagram;
  const postsLiRaw = conteudo?.posts_linkedin;
  const postsIgList: string[] = Array.isArray(postsIgRaw)
    ? postsIgRaw.filter((p): p is string => typeof p === 'string')
    : typeof postsIgRaw === 'string'
      ? (() => {
          try {
            const p = JSON.parse(postsIgRaw);
            return Array.isArray(p) ? p.filter((x): x is string => typeof x === 'string') : [];
          } catch {
            return [];
          }
        })()
      : [];
  const postsLiList: string[] = Array.isArray(postsLiRaw)
    ? postsLiRaw.filter((p): p is string => typeof p === 'string')
    : typeof postsLiRaw === 'string'
      ? (() => {
          try {
            const p = JSON.parse(postsLiRaw);
            return Array.isArray(p) ? p.filter((x): x is string => typeof x === 'string') : [];
          } catch {
            return [];
          }
        })()
      : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
              <Calendar size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                Relatório Diário
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                {formatDateFull(refData.data)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner className="text-brand-600" />
            </div>
          ) : error ? (
            <ErrorState message={error} />
          ) : !conteudo ? (
            <EmptyState message="Nenhum relatório diário encontrado para esta data." />
          ) : (
            <>
              {/* Relatório de tendências */}
              {conteudo.relatorio_tendencias && (
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
                    <Newspaper size={12} />
                    Relatório de Tendências
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {conteudo.relatorio_tendencias}
                    </p>
                  </div>
                </div>
              )}

              {/* Tópicos estratégicos */}
              {topicos.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
                    <TrendingUp size={12} />
                    Tópicos Estratégicos
                    <span className="text-slate-400 normal-case">({topicos.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {topicos.map((t, i) => {
                      const score = t.pontuacao_relevancia ?? 0;
                      const tier = score >= 8 ? 'alto' : score >= 5 ? 'alerta' : 'ruido';
                      const tierCfg = {
                        alto: { badge: 'bg-gold-500 text-brand-950 border-gold-600', accent: 'text-gold-700 dark:text-gold-300' },
                        alerta: { badge: 'bg-brand-500 text-white border-brand-600', accent: 'text-brand-700 dark:text-brand-300' },
                        ruido: { badge: 'bg-slate-400 text-white border-slate-500', accent: 'text-slate-500 dark:text-slate-400' },
                      }[tier];
                      return (
                        <div
                          key={`${t.tema_macro}-${i}`}
                          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5"
                        >
                          <div className="flex items-start justify-between gap-1.5 mb-1.5">
                            <span className="text-[12px] font-semibold text-slate-900 dark:text-slate-100 leading-snug pr-1">
                              {t.tema_macro}
                            </span>
                            <span className={`inline-flex items-center justify-center min-w-[24px] h-5 px-1 rounded text-[10px] font-bold border ${tierCfg.badge} shrink-0`}>
                              {score}
                            </span>
                          </div>
                          {t.justificativa_pontuacao && (
                            <p className={`text-[10px] ${tierCfg.accent} italic leading-relaxed`}>
                              {t.justificativa_pontuacao}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Posts LinkedIn */}
              {postsLiList.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
                    <Linkedin size={12} className="text-sky-600 dark:text-sky-400" />
                    Posts LinkedIn
                    <span className="text-slate-400 normal-case">({postsLiList.length})</span>
                  </div>
                  <div className="space-y-2">
                    {postsLiList.map((post, i) => (
                      <div
                        key={`li-${i}`}
                        className="rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-3"
                      >
                        <p className="text-[13px] text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed line-clamp-4">
                          {post}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts Instagram */}
              {postsIgList.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
                    <Instagram size={12} className="text-pink-600 dark:text-pink-400" />
                    Posts Instagram
                    <span className="text-slate-400 normal-case">({postsIgList.length})</span>
                  </div>
                  <div className="space-y-2">
                    {postsIgList.map((post, i) => (
                      <div
                        key={`ig-${i}`}
                        className="rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-3"
                      >
                        <p className="text-[13px] text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed line-clamp-4">
                          {post}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              {conteudo.created_at && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Calendar size={12} />
                  Gerado em {new Date(conteudo.created_at).toLocaleString('pt-BR')}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-2 px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
