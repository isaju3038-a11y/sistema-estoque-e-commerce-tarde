import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, RefreshCw, Calendar, Search, Filter, History, FileText } from 'lucide-react';
import { StockMovement, MovementType } from '../types';

interface MovementsHistoryProps {
  isOpen: boolean;
  movements: StockMovement[];
  onClose: () => void;
}

export const MovementsHistory: React.FC<MovementsHistoryProps> = ({
  isOpen,
  movements,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  if (!isOpen) return null;

  const filtered = movements.filter((m) => {
    const matchSearch =
      !searchTerm ||
      m.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.reason && m.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.notes && m.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchType = filterType === 'ALL' || m.type === filterType;

    return matchSearch && matchType;
  });

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Histórico de Movimentações
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Auditoria completa de entradas, saídas e ajustes de estoque
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

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por item, motivo ou nota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                filterType === 'ALL'
                  ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Todos ({movements.length})
            </button>
            <button
              onClick={() => setFilterType('IN')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                filterType === 'IN'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => setFilterType('OUT')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                filterType === 'OUT'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
              }`}
            >
              Saídas
            </button>
            <button
              onClick={() => setFilterType('ADJUST')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                filterType === 'ADJUST'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
              }`}
            >
              Ajustes
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Nenhuma movimentação encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Data / Hora</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3">Qtd Movimentada</th>
                    <th className="py-2.5 px-3">Saldo Anterior &rarr; Novo</th>
                    <th className="py-2.5 px-3">Motivo / Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((mov) => {
                    const isEntry = mov.type === 'IN';
                    const isExit = mov.type === 'OUT';

                    return (
                      <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {formatDate(mov.created_at)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isEntry && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              <ArrowDownRight className="h-3 w-3" /> Entrada
                            </span>
                          )}
                          {isExit && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              <ArrowUpRight className="h-3 w-3" /> Saída
                            </span>
                          )}
                          {mov.type === 'ADJUST' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              <RefreshCw className="h-3 w-3" /> Ajuste
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {mov.item_name}
                        </td>
                        <td className="py-2.5 px-3 font-bold">
                          <span className={isEntry ? 'text-emerald-600 dark:text-emerald-400' : isExit ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}>
                            {isEntry ? `+${mov.quantity}` : isExit ? `-${mov.quantity}` : `${mov.quantity}`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono">
                          {mov.previous_quantity} &rarr; <strong className="text-slate-900 dark:text-white">{mov.new_quantity}</strong>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {mov.reason || '-'}
                          </div>
                          {mov.notes && (
                            <div className="text-[11px] text-slate-400">
                              {mov.notes}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs font-semibold hover:bg-slate-700"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
