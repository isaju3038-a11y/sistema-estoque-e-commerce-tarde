import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowUpDown, 
  MapPin, 
  Tag, 
  LayoutGrid, 
  Table as TableIcon,
  ShoppingBag
} from 'lucide-react';
import { Item, StockStatusFilter, FilterOptions } from '../types';

interface ItemListProps {
  items: Item[];
  filter: FilterOptions;
  onFilterChange: (newFilter: Partial<FilterOptions>) => void;
  onEditItem: (item: Item) => void;
  onDeleteItem: (id: string, name: string) => void;
  onQuickMovement: (item: Item, type: 'IN' | 'OUT') => void;
  onOpenNewItem: () => void;
}

export const ItemList: React.FC<ItemListProps> = ({
  items,
  filter,
  onFilterChange,
  onEditItem,
  onDeleteItem,
  onQuickMovement,
  onOpenNewItem,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Extract unique categories
  const categories = Array.from(new Set(items.map((i) => i.category || 'Geral'))).filter(Boolean);

  // Filter items
  const filteredItems = items.filter((item) => {
    // Search query
    const matchSearch =
      !filter.search ||
      item.name.toLowerCase().includes(filter.search.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(filter.search.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(filter.search.toLowerCase())) ||
      (item.location && item.location.toLowerCase().includes(filter.search.toLowerCase()));

    // Category filter
    const matchCategory = !filter.category || item.category === filter.category;

    // Status filter
    let matchStatus = true;
    if (filter.status === 'LOW') {
      matchStatus = item.current_quantity > 0 && item.current_quantity <= item.min_quantity;
    } else if (filter.status === 'OUT_OF_STOCK') {
      matchStatus = item.current_quantity <= 0;
    } else if (filter.status === 'NORMAL') {
      matchStatus = item.current_quantity > item.min_quantity;
    }

    return matchSearch && matchCategory && matchStatus;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    const factor = filter.sortOrder === 'asc' ? 1 : -1;
    switch (filter.sortBy) {
      case 'name':
        return a.name.localeCompare(b.name) * factor;
      case 'quantity':
        return (a.current_quantity - b.current_quantity) * factor;
      case 'min_quantity':
        return (a.min_quantity - b.min_quantity) * factor;
      case 'value':
        return (a.current_quantity * (a.unit_price || 0) - b.current_quantity * (b.unit_price || 0)) * factor;
      case 'updated_at':
      default:
        return (new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()) * factor;
    }
  });

  const formatCurrency = (val?: number) => {
    if (val === undefined || isNaN(val)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const getStatusBadge = (item: Item) => {
    if (item.current_quantity <= 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
          <XCircle className="h-3.5 w-3.5" />
          Esgotado
        </span>
      );
    }
    if (item.current_quantity <= item.min_quantity) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 animate-pulse">
          <AlertTriangle className="h-3.5 w-3.5" />
          Estoque Baixo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Normal
      </span>
    );
  };

  const getStockPercentage = (current: number, min: number) => {
    if (min <= 0) return 100;
    const pct = Math.round((current / min) * 100);
    return Math.min(pct, 100);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      
      {/* Control Bar: Search & Filters */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="search-input"
              type="text"
              placeholder="Buscar por nome, SKU, categoria ou prateleira..."
              value={filter.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            {filter.search && (
              <button
                onClick={() => onFilterChange({ search: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Quick Selectors & View Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Select */}
            <div className="relative">
              <select
                id="category-filter-select"
                value={filter.category}
                onChange={(e) => onFilterChange({ category: e.target.value })}
                className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Todas Categorias ({categories.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Select */}
            <div className="relative">
              <select
                id="sort-select"
                value={`${filter.sortBy}-${filter.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-') as [any, any];
                  onFilterChange({ sortBy, sortOrder });
                }}
                className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="name-asc">Nome (A - Z)</option>
                <option value="name-desc">Nome (Z - A)</option>
                <option value="quantity-asc">Menor Estoque</option>
                <option value="quantity-desc">Maior Estoque</option>
                <option value="min_quantity-desc">Maior Estoque Mínimo</option>
                <option value="value-desc">Maior Valor em Estoque</option>
                <option value="updated_at-desc">Mais Recentes</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800">
              <button
                id="btn-view-table"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Visualização em Tabela"
              >
                <TableIcon className="h-4 w-4" />
              </button>
              <button
                id="btn-view-grid"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Visualização em Grade"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            id="tab-filter-all"
            onClick={() => onFilterChange({ status: 'ALL' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter.status === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Todos ({items.length})
          </button>
          
          <button
            id="tab-filter-low"
            onClick={() => onFilterChange({ status: 'LOW' })}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter.status === 'LOW'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Estoque Baixo ({items.filter((i) => i.current_quantity > 0 && i.current_quantity <= i.min_quantity).length})</span>
          </button>

          <button
            id="tab-filter-out"
            onClick={() => onFilterChange({ status: 'OUT_OF_STOCK' })}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter.status === 'OUT_OF_STOCK'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 hover:bg-rose-100'
            }`}
          >
            <XCircle className="h-3 w-3" />
            <span>Esgotados ({items.filter((i) => i.current_quantity <= 0).length})</span>
          </button>

          <button
            id="tab-filter-normal"
            onClick={() => onFilterChange({ status: 'NORMAL' })}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter.status === 'NORMAL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>Normal ({items.filter((i) => i.current_quantity > i.min_quantity).length})</span>
          </button>
        </div>
      </div>

      {/* Item List Display */}
      {sortedItems.length === 0 ? (
        <div className="py-16 px-4 text-center">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Nenhum item encontrado
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {filter.search || filter.category || filter.status !== 'ALL'
              ? 'Tente ajustar ou limpar os filtros de busca para visualizar os itens.'
              : 'Comece cadastrando seu primeiro item no estoque com a quantidade e estoque mínimo.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            {(filter.search || filter.category || filter.status !== 'ALL') ? (
              <button
                onClick={() => onFilterChange({ search: '', category: '', status: 'ALL' })}
                className="px-3.5 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-semibold"
              >
                Limpar Filtros
              </button>
            ) : (
              <button
                onClick={onOpenNewItem}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Cadastrar Primeiro Item</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Item / Código</th>
                <th className="py-3 px-4">Categoria & Local</th>
                <th className="py-3 px-4">Estoque Atual</th>
                <th className="py-3 px-4">Estoque Mínimo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Preço Unit.</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {sortedItems.map((item) => {
                const isLow = item.current_quantity > 0 && item.current_quantity <= item.min_quantity;
                const isOut = item.current_quantity <= 0;
                const pct = getStockPercentage(item.current_quantity, item.min_quantity);

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                      isLow ? 'bg-amber-50/20 dark:bg-amber-950/10' : isOut ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                    }`}
                  >
                    {/* Item Name & SKU */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {item.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {item.sku && (
                          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                            {item.sku}
                          </span>
                        )}
                        {item.description && (
                          <span className="truncate max-w-xs">{item.description}</span>
                        )}
                      </div>
                    </td>

                    {/* Category & Location */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <Tag className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.category || 'Geral'}</span>
                      </div>
                      {item.location && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span>{item.location}</span>
                        </div>
                      )}
                    </td>

                    {/* Current Quantity */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-bold ${
                          isOut ? 'text-rose-600 dark:text-rose-400' : isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                        }`}>
                          {item.current_quantity}
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {item.unit || 'un'}
                        </span>
                      </div>

                      {/* Progress Bar vs Minimum Stock */}
                      <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOut
                              ? 'bg-rose-500 w-0'
                              : isLow
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </td>

                    {/* Minimum Quantity */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {item.min_quantity} <span className="text-xs text-slate-500 font-normal">{item.unit || 'un'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Nível de Alerta
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(item)}
                    </td>

                    {/* Unit Price */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        {formatCurrency(item.unit_price)}
                      </div>
                      {item.cost_price > 0 && (
                        <div className="text-[11px] text-slate-400">
                          Custo: {formatCurrency(item.cost_price)}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Quick IN */}
                        <button
                          id={`btn-quick-in-${item.id}`}
                          onClick={() => onQuickMovement(item, 'IN')}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 transition-colors"
                          title="Entrada Rápida (+)"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>

                        {/* Quick OUT */}
                        <button
                          id={`btn-quick-out-${item.id}`}
                          onClick={() => onQuickMovement(item, 'OUT')}
                          disabled={item.current_quantity <= 0}
                          className={`p-1.5 rounded-lg transition-colors ${
                            item.current_quantity <= 0
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300'
                          }`}
                          title="Saída / Baixa Rápida (-)"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          id={`btn-edit-${item.id}`}
                          onClick={() => onEditItem(item)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                          title="Editar Item"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          id={`btn-delete-${item.id}`}
                          onClick={() => onDeleteItem(item.id, item.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title="Excluir Item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedItems.map((item) => {
            const isLow = item.current_quantity > 0 && item.current_quantity <= item.min_quantity;
            const isOut = item.current_quantity <= 0;
            const pct = getStockPercentage(item.current_quantity, item.min_quantity);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isLow
                    ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20'
                    : isOut
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        {item.category || 'Geral'}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 line-clamp-1">
                        {item.name}
                      </h4>
                    </div>
                    {getStatusBadge(item)}
                  </div>

                  {item.sku && (
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                      SKU: {item.sku}
                    </div>
                  )}

                  {item.location && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span>{item.location}</span>
                    </div>
                  )}

                  {/* Stock meter */}
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Estoque Atual:</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {item.current_quantity} {item.unit || 'un'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-slate-500 dark:text-slate-400">Estoque Mínimo:</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {item.min_quantity} {item.unit || 'un'}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full ${
                          isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {item.unit_price > 0 && (
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Preço Unitário:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.unit_price)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onQuickMovement(item, 'IN')}
                      className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 hover:bg-emerald-200 transition-all"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Entrada</span>
                    </button>
                    <button
                      onClick={() => onQuickMovement(item, 'OUT')}
                      disabled={item.current_quantity <= 0}
                      className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-semibold flex items-center gap-1 hover:bg-rose-200 transition-all disabled:opacity-40"
                    >
                      <Minus className="h-3 w-3" />
                      <span>Saída</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditItem(item)}
                      className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id, item.name)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="py-3 px-5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          Exibindo <strong>{sortedItems.length}</strong> de <strong>{items.length}</strong> itens cadastrados
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Normal
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Estoque Baixo
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> Esgotado
          </span>
        </div>
      </div>

    </div>
  );
};
