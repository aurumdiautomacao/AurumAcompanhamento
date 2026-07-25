import { useState } from 'react';
import {
  Radar,
  TrendingUp,
  Lightbulb,
  FileText,
  Instagram,
  Linkedin,
  ChevronDown,
  ChevronUp,
  Quote,
  Hash,
  ArrowRight,
} from 'lucide-react';
import {
  Card,
  EmptyState,
} from './ui';
import type {
  ConteudoGerado,
  PostGerado,
  TopicoEstrategico,
  SugestaoPauta,
} from '../lib/supabaseClient';

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

export function RelatorioView({ conteudo }: { conteudo: ConteudoGerado | null }) {
  if (!conteudo) {
    return <EmptyState message="Nenhum relatório disponível." />;
  }

  return (
    <div className="space-y-6">
      <RelatorioTexto texto={conteudo.relatorio_tendencias} />
      <RadarEstrategico topicos={parseTopicos(conteudo.topicos_estrategicos)} />
      <SugestoesPautas sugestoes={parseSugestoes(conteudo.sugestoes_pautas)} />
    </div>
  );
}

function parseTopicos(
  raw: TopicoEstrategico[] | string | null | undefined,
): TopicoEstrategico[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p as TopicoEstrategico[];
    } catch {
      return [];
    }
  }
  return [];
}

function parseSugestoes(
  raw: SugestaoPauta[] | string | null | undefined,
): SugestaoPauta[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p as SugestaoPauta[];
    } catch {
      return [];
    }
  }
  return [];
}

function RelatorioTexto({ texto }: { texto: string }) {
  return (
    <Card className="p-6 lg:p-8">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
          <FileText size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Relatório de Tendências
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Visão macro e estratégica do mercado
          </p>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-brand-200 via-gold-200 to-transparent dark:from-brand-800 dark:via-gold-800 mb-5" />
      <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
        {texto}
      </p>
    </Card>
  );
}

function RadarEstrategico({ topicos }: { topicos: TopicoEstrategico[] }) {
  const sorted = [...topicos].sort(
    (a, b) => (b.pontuacao_relevancia ?? 0) - (a.pontuacao_relevancia ?? 0),
  );

  return (
    <Card className="p-6 lg:p-8">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-9 h-9 rounded-lg bg-gold-500 flex items-center justify-center">
          <Radar size={18} className="text-brand-950" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Radar Estratégico
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tópicos ordenados por pontuação de relevância
          </p>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-gold-200 via-brand-200 to-transparent dark:from-gold-800 dark:via-brand-800 my-5" />

      {sorted.length === 0 ? (
        <EmptyState message="Nenhum tópico estratégico gerado." />
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

      {/* Relevance bar */}
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

function SugestoesPautas({ sugestoes }: { sugestoes: SugestaoPauta[] }) {
  return (
    <Card className="p-6 lg:p-8">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
          <Lightbulb size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Sugestões de Pautas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Direções de conteúdo para a equipe de estratégia
          </p>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-brand-200 via-gold-200 to-transparent dark:from-brand-800 dark:via-gold-800 my-5" />

      {sugestoes.length === 0 ? (
        <EmptyState message="Nenhuma sugestão de pauta gerada." />
      ) : (
        <ol className="space-y-3">
          {sugestoes.map((s, i) => (
            <li
              key={i}
              className="flex gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
            >
              <div className="flex flex-col items-center shrink-0">
                <span className="w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                  {s.titulo}
                </h3>
                {s.contexto && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {s.contexto}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Briefings section (tabs + cards)
// ---------------------------------------------------------------------------

type TabKey = 'instagram' | 'linkedin';

function canonicalPlataforma(p: string | null | undefined): TabKey | 'other' {
  const v = (p ?? '').toLowerCase();
  if (v === 'instagram' || v === 'ig') return 'instagram';
  if (v.includes('linked')) return 'linkedin';
  return 'other';
}

export function BriefingsSection({ posts }: { posts: PostGerado[] }) {
  const [tab, setTab] = useState<TabKey>('instagram');

  const ig = posts.filter((p) => canonicalPlataforma(p.plataforma) === 'instagram');
  const li = posts.filter((p) => canonicalPlataforma(p.plataforma) === 'linkedin');
  const active = tab === 'instagram' ? ig : li;

  return (
    <Card className="p-6 lg:p-8">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-9 h-9 rounded-lg bg-brand-700 flex items-center justify-center">
          <TrendingUp size={18} className="text-gold-300" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Briefings de Design
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Posts gerados para a equipe de design
          </p>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-brand-200 via-gold-200 to-transparent dark:from-brand-800 dark:via-gold-800 my-5" />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-fit mb-6">
        <TabButton
          active={tab === 'instagram'}
          onClick={() => setTab('instagram')}
          icon={Instagram}
          label="Instagram"
          count={ig.length}
        />
        <TabButton
          active={tab === 'linkedin'}
          onClick={() => setTab('linkedin')}
          icon={Linkedin}
          label="LinkedIn"
          count={li.length}
        />
      </div>

      {active.length === 0 ? (
        <EmptyState message={`Nenhum post para ${tab === 'instagram' ? 'Instagram' : 'LinkedIn'}.`} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {active.map((p) => (
            <BriefingCard key={p.id} post={p} />
          ))}
        </div>
      )}
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
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
        active
          ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
      }`}
    >
      <Icon size={16} />
      {label}
      <span
        className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
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

function BriefingCard({ post }: { post: PostGerado }) {
  const [open, setOpen] = useState(false);
  const isInstagram = canonicalPlataforma(post.plataforma) === 'instagram';
  const platformAccent = isInstagram
    ? 'text-pink-600 dark:text-pink-400'
    : 'text-sky-600 dark:text-sky-400';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft overflow-hidden flex flex-col">
      {/* Card header */}
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

      {/* Card body */}
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

        {/* Expandable caption + hashtags */}
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
      </div>
    </div>
  );
}
