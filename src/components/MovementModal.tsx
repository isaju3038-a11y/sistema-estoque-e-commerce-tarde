import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Item, MovementType, StockMovement } from '../types';

interface MovementModalProps {
  isOpen: boolean;
  items: Item[];
  preselectedItem: Item | null;
  initialType?: MovementType;
  onClose: () => void;
  onConfirm: (movementData: Omit<StockMovement, 'id' | 'created_at'>) => Promise<void>;
}

const COMMON_REASONS = {
  IN: [
    'Recebimento de Fornecedor / Compra',
    'Devolução de Cliente',
    'Retorno de Produção / Obra',
    'Transferência de Depósito',
    'Ajuste / Entrada Inicial'
  ],
  OUT: [
    'Venda / Faturamento',
    'Ordem de Produção / Consumo Interno',
    'Uso em Manutenção / Obra',
    'Avaria / Perda / Danificado',
    'Descarte / Validade Vencida',
    'Devolução a Fornecedor'
  ],
  ADJUST: [
    'Inventário / Contagem Física Periódica',
    'Correção de Saldo Divergente',
    'Reclassificação de Lote'
  ]
};

export const MovementModal: React.FC<MovementModalProps> = ({
  isOpen,
  items,
  preselectedItem,
  initialType = 'IN',
  onClose,
  onConfirm,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [type, setType] = useState<MovementType>(initialType);
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (preselectedItem) {
      setSelectedItemId(preselectedItem.id);
    } else if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id);
    }
    setType(initialType);
    setQuantity(1);
    setReason(COMMON_REASONS[initialType][0]);
    setNotes('');
    setErrorMsg('');
  }, [isOpen, preselectedItem, initialType, items]);

  useEffect(() => {
    // Update default reason when type changes
    if (COMMON_REASONS[type]) {
      setReason(COMMON_REASONS[type][0]);
    }
  }, [type]);

  if (!isOpen) return null;

  const currentItem = items.find((i) => i.id === selectedItemId) || preselectedItem || items[0];

  const curQty = currentItem ? Number(currentItem.current_quantity) : 0;
  const minQty = currentItem ? Number(currentItem.min_quantity) : 0;
  const moveQty = quantity === '' ? 0 : Number(quantity);

  // Calculate new quantity
  let calculatedNewQty = curQty;
  if (type === 'IN') {
    calculatedNewQty = curQty + moveQty;
  } else if (type === 'OUT') {
    calculatedNewQty = curQty - moveQty;
  } else if (type === 'ADJUST') {
    calculatedNewQty = moveQty;
  }

  const willBeBelowMin = calculatedNewQty <= minQty;
  const isNegative = calculatedNewQty < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) {
      setErrorMsg('Selecione um item válido.');
      return;
    }

    if (moveQty <= 0 && type !== 'ADJUST') {
      setErrorMsg('A quantidade deve ser maior que zero.');
      return;
    }

    if (type === 'OUT' && moveQty > curQty) {
      setErrorMsg(`Saldo insuficiente! Estoque atual é de apenas ${curQty} ${currentItem.unit || 'un'}.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onConfirm({
        item_id: currentItem.id,
        item_name: currentItem.name,
        type,
        quantity: type === 'ADJUST' ? Math.abs(calculatedNewQty - curQty) : moveQty,
        previous_quantity: curQty,
        new_quantity: calculatedNewQty,
        reason: reason.trim() || (type === 'IN' ? 'Entrada' : type === 'OUT' ? 'Saída' : 'Ajuste'),
        notes: notes.trim()
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar movimentação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
              type === 'IN'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : type === 'OUT'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
            }`}>
              {type === 'IN' && <ArrowDownRight className="h-5 w-5" />}
              {type === 'OUT' && <ArrowUpRight className="h-5 w-5" />}
              {type === 'ADJUST' && <RefreshCw className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Movimentação de Estoque
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registre entrada, saída ou ajuste de saldo
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type Selector (Entrada / Saída / Ajuste) */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              id="btn-type-in"
              onClick={() => setType('IN')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                type === 'IN'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownRight className="h-4 w-4" />
              <span>Entrada (+)</span>
            </button>

            <button
              type="button"
              id="btn-type-out"
              onClick={() => setType('OUT')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                type === 'OUT'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Saída (-)</span>
            </button>

            <button
              type="button"
              id="btn-type-adjust"
              onClick={() => setType('ADJUST')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                type === 'ADJUST'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Balanço</span>
            </button>
          </div>

          {/* Item Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Selecionar Item
            </label>
            <select
              id="select-movement-item"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name} (Atual: {it.current_quantity} {it.unit || 'un'} | Mín: {it.min_quantity})
                </option>
              ))}
            </select>
          </div>

          {/* Current & Resulting Stock Overview Box */}
          {currentItem && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Estoque Atual:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {curQty} {currentItem.unit || 'un'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Estoque Mínimo Definido:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {minQty} {currentItem.unit || 'un'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm">
                <span className="font-bold text-slate-800 dark:text-slate-200">Novo Saldo Previsto:</span>
                <span className={`font-bold text-base ${
                  isNegative ? 'text-rose-600' : willBeBelowMin ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {calculatedNewQty} {currentItem.unit || 'un'}
                </span>
              </div>

              {/* Warning if stock drops below minimum */}
              {type === 'OUT' && willBeBelowMin && !isNegative && (
                <div className="mt-2 p-2 rounded-lg bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    <strong>Alerta de Estoque Mínimo:</strong> Esta saída deixará o estoque ({calculatedNewQty} {currentItem.unit}) no nível crítico (mínimo: {minQty}).
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {type === 'ADJUST' ? 'Nova Quantidade Real Contada' : 'Quantidade a Movimentar'}
            </label>
            <input
              id="input-movement-quantity"
              type="number"
              min="0"
              step="any"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              className="w-full px-3.5 py-2.5 text-lg font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Motivo / Justificativa
            </label>
            <input
              id="input-movement-reason"
              type="text"
              list="reason-suggestions"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Selecione ou digite o motivo..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <datalist id="reason-suggestions">
              {COMMON_REASONS[type]?.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações / Nº Documento / NF-e
            </label>
            <input
              id="input-movement-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: NF-e 88392, Pedido de compra #302, etc."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-movement"
              type="submit"
              disabled={isSubmitting || isNegative}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 ${
                type === 'IN'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                  : type === 'OUT'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {isSubmitting
                  ? 'Registrando...'
                  : type === 'IN'
                  ? 'Confirmar Entrada'
                  : type === 'OUT'
                  ? 'Confirmar Saída'
                  : 'Atualizar Saldo'}
              </span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
