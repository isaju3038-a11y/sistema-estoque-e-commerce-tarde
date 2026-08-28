import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Check, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  UploadCloud, 
  Code, 
  Sparkles, 
  Key, 
  Globe 
} from 'lucide-react';
import { 
  SUPABASE_SQL_SCHEMA, 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  testSupabaseConnection,
  getLocalItems,
  upsertItem
} from '../lib/supabase';
import { SupabaseConfig } from '../types';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const currentCreds = getSupabaseCredentials();
  const [url, setUrl] = useState(currentCreds.url);
  const [anonKey, setAnonKey] = useState(currentCreds.anonKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; tableFound: boolean } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(url, anonKey);
      setTestResult(res);
      if (res.success) {
        saveSupabaseCredentials(url, anonKey);
        onConfigUpdated();
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message, tableFound: false });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveOnly = () => {
    saveSupabaseCredentials(url, anonKey);
    onConfigUpdated();
    onClose();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const items = getLocalItems();
      let count = 0;
      for (const item of items) {
        const res = await upsertItem(item);
        if (res.fromSupabase) count++;
      }
      setSyncResult(`Sucesso: ${count} itens sincronizados diretamente com o banco de dados Supabase!`);
      onConfigUpdated();
    } catch (e: any) {
      setSyncResult(`Erro ao sincronizar: ${e?.message || 'Verifique as permissões de tabela.'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClear = () => {
    setUrl('');
    setAnonKey('');
    saveSupabaseCredentials('', '');
    setTestResult(null);
    onConfigUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Conexão com Banco de Dados Supabase
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure as chaves da sua instância Supabase e execute o script SQL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
          
          {/* Quick Guide */}
          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 space-y-2">
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Como conectar seu Supabase em 2 minutos:
            </h4>
            <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-decimal list-inside pl-1">
              <li>
                Acesse o painel do seu projeto no{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-emerald-700 dark:text-emerald-400 underline inline-flex items-center gap-0.5"
                >
                  supabase.com <ExternalLink className="h-3 w-3" />
                </a>.
              </li>
              <li>
                No menu lateral esquerdo, vá em <strong>SQL Editor</strong>, copie o script abaixo e clique em <strong>Run</strong>.
              </li>
              <li>
                Em <strong>Project Settings &rarr; API</strong>, copie a <strong>Project URL</strong> e a chave <strong>anon / public</strong> e cole nos campos abaixo.
              </li>
            </ol>
          </div>

          {/* Credentials Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Project URL (Supabase API URL)
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="input-supabase-url"
                  type="text"
                  placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Project API Key (anon / public key)
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="input-supabase-anon-key"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Test Connection Button & Status */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                id="btn-test-supabase"
                onClick={handleTestConnection}
                disabled={isTesting || !url || !anonKey}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Testando Conexão...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Testar & Salvar Conexão</span>
                  </>
                )}
              </button>

              {url && (
                <button
                  onClick={handleClear}
                  className="px-3 py-2 text-xs text-slate-500 hover:text-rose-600 transition-colors"
                >
                  Desconectar / Resetar
                </button>
              )}
            </div>

            {/* Test Feedback Message */}
            {testResult && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}>
                {testResult.success ? (
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{testResult.message}</p>
                  {testResult.success && testResult.tableFound && (
                    <button
                      onClick={handleSyncToSupabase}
                      disabled={isSyncing}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 shadow-xs"
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      <span>{isSyncing ? 'Sincronizando...' : 'Enviar Itens Locais para o Supabase'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {syncResult && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-300">
                {syncResult}
              </div>
            )}
          </div>

          {/* SQL Schema Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Code className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Script SQL de Criação de Tabelas (PostgreSQL / Supabase)</span>
              </label>
              <button
                id="btn-copy-sql"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-semibold transition-all"
              >
                {copiedSql ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="p-3.5 bg-slate-950 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800 leading-relaxed select-all">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
            <p className="text-[11px] text-slate-400">
              * Este script cria as tabelas <code>items</code> e <code>stock_movements</code> com chaves estrangeiras, índices e políticas de segurança RLS prontas para uso.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {currentCreds.isConfigured ? '🟢 Conectado ao Supabase' : '⚪ Operando com armazenamento local'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Fechar
            </button>
            <button
              onClick={handleSaveOnly}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-sm"
            >
              Salvar & Concluir
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
