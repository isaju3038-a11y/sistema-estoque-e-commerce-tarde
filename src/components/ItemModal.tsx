import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, HelpCircle, Package, MapPin, DollarSign, Layers } from 'lucide-react';
import { Item } from '../types';

interface ItemModalProps {
  isOpen: boolean;
  itemToEdit: Item | null;
  onClose: () => void;
  onSave: (itemData: Partial<Item>) => Promise<void>;
}

const COMMON_CATEGORIES = [
  'Fixadores & Ferragens',
  'Elétrica',
  'Hidráulica',
  'Ferramentas & Abrasivos',
  'EPI & Segurança',
  'Manutenção & Lubrificantes',
  'Embalagens',
  'Matéria-Prima',
  'Informática & Escritório',
  'Geral'
];

const COMMON_UNITS = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'lt', label: 'Litro (lt)' },
  { value: 'm', label: 'Metro (m)' },
  { value: 'cx', label: 'Caixa (cx)' },
  { value: 'pct', label: 'Pacote (pct)' },
  { value: 'par', label: 'Par (par)' },
  { value: 'cj', label: 'Conjunto (cj)' },
  { value: 'rolo', label: 'Rolo' },
];

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  itemToEdit,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Geral');
  const [currentQuantity, setCurrentQuantity] = useState<number | ''>(0);
  const [minQuantity, setMinQuantity] = useState<number | ''>(10);
  const [unit, setUnit] = useState('un');
  const [costPrice, setCostPrice] = useState<number | ''>(0);
  const [unitPrice, setUnitPrice] = useState<number | ''>(0);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || '');
      setSku(itemToEdit.sku || '');
      setCategory(itemToEdit.category || 'Geral');
      setCurrentQuantity(itemToEdit.current_quantity ?? 0);
      setMinQuantity(itemToEdit.min_quantity ?? 0);
      setUnit(itemToEdit.unit || 'un');
      setCostPrice(itemToEdit.cost_price ?? 0);
      setUnitPrice(itemToEdit.unit_price ?? 0);
      setLocation(itemToEdit.location || '');
      setDescription(itemToEdit.description || '');
    } else {
      setName('');
      setSku('');
      setCategory('Geral');
      setCurrentQuantity(0);
      setMinQuantity(10);
      setUnit('un');
      setCostPrice(0);
      setUnitPrice(0);
      setLocation('');
      setDescription('');
    }
    setErrorMsg('');
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('O nome do item é obrigatório.');
      return;
    }

    const curQty = currentQuantity === '' ? 0 : Number(currentQuantity);
    const minQty = minQuantity === '' ? 0 : Number(minQuantity);
    const cPrice = costPrice === '' ? 0 : Number(costPrice);
    const uPrice = unitPrice === '' ? 0 : Number(unitPrice);

    if (curQty < 0 || minQty < 0) {
      setErrorMsg('As quantidades não podem ser negativas.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      await onSave({
        ...(itemToEdit ? { id: itemToEdit.id } : {}),
        name: name.trim(),
        sku: sku.trim(),
        category: category.trim() || 'Geral',
        current_quantity: curQty,
        min_quantity: minQty,
        unit,
        cost_price: cPrice,
        unit_price: uPrice,
        location: location.trim(),
        description: description.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar item.');
    } finally {
      setIsSaving(false);
    }
  };

  const isLowStockPreview =
    Number(currentQuantity) > 0 &&
    Number(currentQuantity) <= Number(minQuantity);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {itemToEdit ? 'Editar Item' : 'Cadastrar Novo Item'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Preencha os dados do item e defina o estoque mínimo para alertas
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Name & SKU */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Item / Produto <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-item-name"
                type="text"
                required
                placeholder="Ex: Parafuso Sextavado M8x30 Inox"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Código SKU / Ref
              </label>
              <input
                id="input-item-sku"
                type="text"
                placeholder="Ex: PAR-M8-30"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Row 2: Category & Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Categoria
              </label>
              <input
                id="input-item-category"
                type="text"
                list="category-suggestions"
                placeholder="Ex: Fixadores, Elétrica, EPI..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <datalist id="category-suggestions">
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Unidade de Medida
              </label>
              <select
                id="select-item-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Quantities (Current & Minimum Stock Highlighted) */}
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
              <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Controle de Estoque & Nível Mínimo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estoque Atual ({unit})
                </label>
                <input
                  id="input-current-quantity"
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={currentQuantity}
                  onChange={(e) => setCurrentQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-base font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-amber-700 dark:text-amber-400">
                    Estoque Mínimo ({unit}) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-amber-600/90 dark:text-amber-400/90 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Ponto de Reposição
                  </span>
                </div>
                <input
                  id="input-min-quantity"
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-base font-bold bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl text-amber-900 dark:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {isLowStockPreview && (
              <div className="p-2.5 rounded-lg bg-amber-100/70 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  <strong>Atenção:</strong> O estoque atual ({currentQuantity} {unit}) é menor ou igual ao mínimo definido ({minQuantity} {unit}). O item será sinalizado para reposição.
                </span>
              </div>
            )}
          </div>

          {/* Row 4: Pricing & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preço de Custo (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">R$</span>
                <input
                  id="input-cost-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preço Unitário / Venda (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">R$</span>
                <input
                  id="input-unit-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Localização / Prateleira
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="input-location"
                  type="text"
                  placeholder="Ex: Prateleira B-04"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição / Observações do Item
            </label>
            <textarea
              id="input-description"
              rows={2}
              placeholder="Especificações técnicas, fornecedor padrão, dimensões ou notas adicionais..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-save-item"
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Salvando...' : itemToEdit ? 'Atualizar Item' : 'Cadastrar Item'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
