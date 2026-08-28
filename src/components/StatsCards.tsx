import React from 'react';
import { Package, AlertTriangle, XCircle, DollarSign, Layers } from 'lucide-react';
import { Item, StockStatusFilter } from '../types';

interface StatsCardsProps {
  items: Item[];
  activeStatusFilter: StockStatusFilter;
  onSelectStatusFilter: (status: StockStatusFilter) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  items,
  activeStatusFilter,
  onSelectStatusFilter,
}) => {
  const totalItems = items.length;
  
  const lowStockItems = items.filter(
    (item) => item.current_quantity > 0 && item.current_quantity <= item.min_quantity
  );
  
  const outOfStockItems = items.filter((item) => item.current_quantity <= 0);
  
  const totalUnits = items.reduce((acc, item) => acc + (Number(item.current_quantity) || 0), 0);
  
  const totalStockValue = items.reduce(
    (acc, item) => acc + (Number(item.current_quantity) || 0) * (Number(item.unit_price) || 0),
    0
  );

  const totalCostValue = items.reduce(
    (acc, item) => acc + (Number(item.current_quantity) || 0) * (Number(item.cost_price) || 0),
    0
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* Total Items Card */}
      <div 
        id="stat-total-items"
        onClick={() => onSelectStatusFilter('ALL')}
        className={`bg-white dark:bg-slate-900 rounded-xl p-4.5 border transition-all cursor-pointer shadow-xs ${
          activeStatusFilter === 'ALL'
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Cadastrado
          </span>
          <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {totalItems}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {totalItems === 1 ? 'item' : 'itens'}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Layers className="h-3.5 w-3.5" />
          <span>{totalUnits} unidades totais</span>
        </div>
      </div>

      {/* Low Stock (Alerta Estoque Mínimo) Card */}
      <div
        id="stat-low-stock"
        onClick={() => onSelectStatusFilter(activeStatusFilter === 'LOW' ? 'ALL' : 'LOW')}
        className={`bg-white dark:bg-slate-900 rounded-xl p-4.5 border transition-all cursor-pointer shadow-xs ${
          activeStatusFilter === 'LOW'
            ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md bg-amber-50/20 dark:bg-amber-950/20'
            : lowStockItems.length > 0
            ? 'border-amber-200 dark:border-amber-900/60 hover:border-amber-400'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            {lowStockItems.length > 0 && <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />}
            Estoque Mínimo / Baixo
          </span>
          <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {lowStockItems.length}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {lowStockItems.length === 1 ? 'abaixo do mínimo' : 'abaixo do mínimo'}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {lowStockItems.length > 0
            ? 'Requer reposição de compra'
            : 'Todos os níveis adequados'}
        </p>
      </div>

      {/* Out of Stock (Esgotados) Card */}
      <div
        id="stat-out-of-stock"
        onClick={() => onSelectStatusFilter(activeStatusFilter === 'OUT_OF_STOCK' ? 'ALL' : 'OUT_OF_STOCK')}
        className={`bg-white dark:bg-slate-900 rounded-xl p-4.5 border transition-all cursor-pointer shadow-xs ${
          activeStatusFilter === 'OUT_OF_STOCK'
            ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-md bg-rose-50/20 dark:bg-rose-950/20'
            : outOfStockItems.length > 0
            ? 'border-rose-200 dark:border-rose-900/60 hover:border-rose-400'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
            Itens Esgotados
          </span>
          <div className="h-9 w-9 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <XCircle className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {outOfStockItems.length}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            zerados (0 un)
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {outOfStockItems.length > 0 ? 'Indisponíveis no estoque' : 'Nenhum item zerado'}
        </p>
      </div>

      {/* Total Valuation Card */}
      <div
        id="stat-total-valuation"
        className="bg-white dark:bg-slate-900 rounded-xl p-4.5 border border-slate-200 dark:border-slate-800 shadow-xs"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Valor Estimado
          </span>
          <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(totalStockValue)}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Custo: {formatCurrency(totalCostValue)}
        </p>
      </div>

    </div>
  );
};
