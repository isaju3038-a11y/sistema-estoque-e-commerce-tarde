import React from 'react';
import { Package, Database, Plus, ArrowUpDown, AlertTriangle, ShieldCheck, History } from 'lucide-react';
import { SupabaseConfig } from '../types';

interface HeaderProps {
  supabaseConfig: SupabaseConfig;
  lowStockCount: number;
  onOpenNewItem: () => void;
  onOpenMovement: () => void;
  onOpenHistory: () => void;
  onFilterLowStock: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  supabaseConfig,
  lowStockCount,
  onOpenNewItem,
  onOpenMovement,
  onOpenHistory,
  onFilterLowStock,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Controle de Estoque
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    supabaseConfig.isConnected
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {supabaseConfig.isConnected ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <ShieldCheck className="h-3 w-3" />
                      <span>Supabase Conectado</span>
                    </>
                  ) : (
                    <>
                      <Database className="h-3 w-3 text-slate-400" />
                      <span>Modo Local / Offline</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cadastro de itens, estoque mínimo e movimentações
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {lowStockCount > 0 && (
              <button
                id="btn-alert-low-stock"
                onClick={onFilterLowStock}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/25 transition-all shadow-sm"
              >
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>{lowStockCount} {lowStockCount === 1 ? 'item crítico' : 'itens críticos'}</span>
              </button>
            )}

            <button
              id="btn-history"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all shadow-sm"
            >
              <History className="h-4 w-4 text-slate-400" />
              <span>Histórico</span>
            </button>

            <button
              id="btn-quick-movement"
              onClick={onOpenMovement}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span>Movimentar</span>
            </button>

            <button
              id="btn-new-item"
              onClick={onOpenNewItem}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Novo Item</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
