import { useEffect, useState } from 'react';
import { UserPlus, Search, RefreshCw, Pencil, Ban, ShieldCheck, Info } from 'lucide-react';
import { supabase, type FonteNoticia, type BaseDeConhecimento } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Badge, Card, EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui';

type AdminUser = {
  id: string;
  email: string | undefined;
  createdAt: string | undefined;
};

export default function UserManagement() {
  const { user } = useAuth();
  const [fontes, setFontes] = useState<FonteNoticia[]>([]);
  const [bases, setBases] = useState<BaseDeConhecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    const [fontesRes, basesRes] = await Promise.all([
      supabase
        .from('fontes_noticias')
        .select('id, nome, url, ativo, data_cadastro, tipo_coleta')
        .order('data_cadastro', { ascending: false }),
      supabase
        .from('base_de_conhecimento')
        .select('id, nome_cliente, tom_de_voz, publico_alvo, regras_extras, created_at')
        .order('created_at', { ascending: false }),
    ]);
    setLoading(false);
    if (fontesRes.error || basesRes.error) {
      setError(fontesRes.error?.message ?? basesRes.error?.message ?? 'Erro ao carregar');
      return;
    }
    setFontes((fontesRes.data as FonteNoticia[]) ?? []);
    setBases((basesRes.data as BaseDeConhecimento[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const adminUsers: AdminUser[] = user
    ? [{ id: user.id, email: user.email, createdAt: user.created_at }]
    : [];

  const filteredUsers = adminUsers.filter((u) =>
    (u.email ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="Gestão de Usuários"
        subtitle="Usuários cadastrados na plataforma"
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
            <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">
              <UserPlus size={16} />
              Novo usuário
            </button>
          </div>
        }
      />

      <div className="mb-6 flex items-start gap-2 text-sm text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg px-3 py-2">
        <Info size={16} className="mt-0.5 shrink-0" />
        <span>
          Este projeto não possui uma tabela <code>profiles</code>. A lista abaixo mostra o
          usuário autenticado atual (vindo do Supabase Auth). Para listar todos os usuários,
          crie uma tabela <code>profiles</code> com RLS e faça o insert via trigger.
        </span>
      </div>

      <Card className="mb-6 p-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por e-mail..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </Card>

      <Card className="overflow-hidden mb-8">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200">
          Usuários autenticados
        </div>
        {filteredUsers.length === 0 ? (
          <EmptyState message="Nenhum usuário encontrado." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Usuário</th>
                  <th className="text-left font-medium px-4 py-3">Perfil</th>
                  <th className="text-left font-medium px-4 py-3">Cadastro</th>
                  <th className="text-right font-medium px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 flex items-center justify-center text-sm font-semibold">
                          {(u.email ?? '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-100">
                            {u.email ?? '—'}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">
                            ID: {u.id.slice(0, 8)}…
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge status="admin" />
                        <ShieldCheck size={14} className="text-indigo-500" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                          title="Editar usuário"
                        >
                          <Pencil size={13} />
                          Editar
                        </button>
                        <button
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Desativar usuário"
                        >
                          <Ban size={13} />
                          Desativar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200">
            Fontes de Notícias ({fontes.length})
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="text-indigo-600" />
            </div>
          ) : error ? (
            <ErrorState message={error} />
          ) : fontes.length === 0 ? (
            <EmptyState message="Nenhuma fonte." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Nome</th>
                    <th className="text-left font-medium px-4 py-3">Tipo</th>
                    <th className="text-left font-medium px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {fontes.map((f) => (
                    <tr
                      key={f.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 dark:text-slate-100">
                          {f.nome}
                        </div>
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate block max-w-xs"
                        >
                          {f.url}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {f.tipo_coleta ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={f.ativo ? 'ativo' : 'inativo'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200">
            Base de Conhecimento ({bases.length})
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="text-indigo-600" />
            </div>
          ) : error ? (
            <ErrorState message={error} />
          ) : bases.length === 0 ? (
            <EmptyState message="Nenhuma base." />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {bases.map((b) => (
                <div key={b.id} className="px-4 py-3">
                  <div className="font-medium text-slate-800 dark:text-slate-100">
                    {b.nome_cliente}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Tom: {b.tom_de_voz} · Público: {b.publico_alvo}
                  </div>
                  {b.regras_extras && (
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">
                      {b.regras_extras}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
        As ações de Editar e Desativar são ilustrativas neste MVP.
      </p>
    </div>
  );
}
