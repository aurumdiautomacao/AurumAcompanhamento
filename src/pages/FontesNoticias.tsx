import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  ExternalLink,
  Rss,
  Code,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';
import {
  supabase,
  type FonteNoticia,
} from '../lib/supabaseClient';
import {
  Card,
  EmptyState,
  PageHeader,
  Spinner,
} from '../components/ui';

type FormState = {
  nome: string;
  url: string;
  tipo_coleta: string;
};

const EMPTY_FORM: FormState = { nome: '', url: '', tipo_coleta: 'HTML' };

export default function FontesNoticias() {
  const [fontes, setFontes] = useState<FonteNoticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('fontes_noticias')
      .select('id, nome, url, ativo, data_cadastro, tipo_coleta')
      .order('data_cadastro', { ascending: false });
    setLoading(false);
    if (error) {
      setError(error.message);
      setFontes([]);
      return;
    }
    setFontes((data as FonteNoticia[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(f: FonteNoticia) {
    setForm({
      nome: f.nome,
      url: f.url,
      tipo_coleta: (f.tipo_coleta ?? 'html').toUpperCase() === 'RSS' ? 'RSS' : 'HTML',
    });
    setEditingId(f.id);
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim() || !form.url.trim()) {
      setFormError('Nome e URL são obrigatórios.');
      return;
    }

    let normalizedUrl = form.url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      nome: form.nome.trim(),
      url: normalizedUrl,
      tipo_coleta: form.tipo_coleta.toLowerCase(),
    };

    if (editingId) {
      const { error } = await supabase
        .from('fontes_noticias')
        .update(payload)
        .eq('id', editingId);
      setSaving(false);
      if (error) {
        setFormError(error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from('fontes_noticias')
        .insert(payload);
      setSaving(false);
      if (error) {
        setFormError(error.message);
        return;
      }
    }

    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const { error } = await supabase
      .from('fontes_noticias')
      .delete()
      .eq('id', id);
    setDeletingId(null);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  }

  async function toggleAtivo(f: FonteNoticia) {
    const next = !(f.ativo ?? true);
    setFontes((prev) =>
      prev.map((x) => (x.id === f.id ? { ...x, ativo: next } : x)),
    );
    const { error } = await supabase
      .from('fontes_noticias')
      .update({ ativo: next })
      .eq('id', f.id);
    if (error) {
      setError(error.message);
      load();
    }
  }

  return (
    <div>
      <PageHeader
        title="Fontes de Notícias"
        subtitle="Cadastre e gerencie os sites de onde as notícias são coletadas"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? <Spinner /> : <RefreshCw size={16} />}
              Atualizar
            </button>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-brand-950 bg-gold-500 hover:bg-gold-400 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Nova fonte
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <Card className="w-full max-w-md p-6 relative">
            <button
              onClick={closeForm}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>

            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
              {editingId ? 'Editar fonte' : 'Cadastrar nova fonte'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Informe os dados do site que será monitorado.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                  Nome
                </label>
                <input
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex.: InfoMoney"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                  URL
                </label>
                <input
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="exemplo.com ou https://exemplo.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                  Tipo de coleta
                </label>
                <select
                  value={form.tipo_coleta}
                  onChange={(e) => setForm((f) => ({ ...f, tipo_coleta: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
                >
                  <option value="HTML">HTML</option>
                  <option value="RSS">RSS</option>
                </select>
              </div>

              {formError && (
                <p className="text-sm text-rose-600 dark:text-rose-400">{formError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-950 bg-gold-500 hover:bg-gold-400 rounded-lg disabled:opacity-60"
                >
                  {saving ? <Spinner /> : <CheckCircle2 size={16} />}
                  {editingId ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner className="text-brand-600" />
        </div>
      ) : fontes.length === 0 ? (
        <EmptyState message="Nenhuma fonte cadastrada. Clique em 'Nova fonte' para começar." />
      ) : (
        <>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            {fontes.length} {fontes.length === 1 ? 'fonte cadastrada' : 'fontes cadastradas'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {fontes.map((f) => (
              <FonteCard
                key={f.id}
                fonte={f}
                onEdit={() => openEdit(f)}
                onDelete={() => handleDelete(f.id)}
                onToggle={() => toggleAtivo(f)}
                deleting={deletingId === f.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FonteCard({
  fonte,
  onEdit,
  onDelete,
  onToggle,
  deleting,
}: {
  fonte: FonteNoticia;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  deleting: boolean;
}) {
  const isRss = (fonte.tipo_coleta ?? 'html').toLowerCase() === 'rss';
  const ativo = fonte.ativo ?? true;
  const data = new Date(fonte.data_cadastro).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
              isRss
                ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900'
                : 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-900'
            }`}
          >
            {isRss ? <Rss size={11} /> : <Code size={11} />}
            {isRss ? 'RSS' : 'HTML'}
          </span>
          <button
            onClick={onToggle}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
              ativo
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
            }`}
          >
            {ativo ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
            {ativo ? 'Ativo' : 'Inativo'}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
            title="Editar"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-40"
            title="Excluir"
          >
            {deleting ? <Spinner /> : <Trash2 size={15} />}
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
          {fonte.nome}
        </h3>
        <a
          href={fonte.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 mt-1 break-all"
        >
          <ExternalLink size={11} />
          {fonte.url}
        </a>
      </div>

      <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
        Cadastrado em {data}
      </div>
    </Card>
  );
}
