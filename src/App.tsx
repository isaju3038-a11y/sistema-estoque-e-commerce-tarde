import React, { useState, useEffect, useCallback } from 'react';
import { 
  fetchAllItems, 
  upsertItem, 
  removeItem, 
  fetchAllMovements, 
  recordStockMovement, 
  getSupabaseCredentials 
} from './lib/supabase';
import { Item, StockMovement, SupabaseConfig, FilterOptions, MovementType, StockStatusFilter } from './types';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { ItemList } from './components/ItemList';
import { ItemModal } from './components/ItemModal';
import { MovementModal } from './components/MovementModal';
import { MovementsHistory } from './components/MovementsHistory';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
    isConnected: false,
    usingCustomKeys: false,
  });

  // Filter state
  const [filter, setFilter] = useState<FilterOptions>({
    search: '',
    category: '',
    status: 'ALL',
    sortBy: 'updated_at',
    sortOrder: 'desc',
  });

  // Modal visibility states
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedMovementItem, setSelectedMovementItem] = useState<Item | null>(null);
  const [movementInitialType, setMovementInitialType] = useState<MovementType>('IN');

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Delete confirmation modal state
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Load data function
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const creds = getSupabaseCredentials();
      const [itemsRes, movementsRes] = await Promise.all([
        fetchAllItems(),
        fetchAllMovements()
      ]);

      setItems(itemsRes.items);
      setMovements(movementsRes.movements);
      setSupabaseConfig({
        url: creds.url,
        anonKey: creds.anonKey,
        isConnected: itemsRes.fromSupabase,
        usingCustomKeys: creds.isConfigured,
      });
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle create or update item
  const handleSaveItem = async (itemData: Partial<Item>) => {
    try {
      const isNew = !itemData.id;
      const newItemObj: Item = {
        id: itemData.id || `item-${Date.now()}`,
        name: itemData.name || 'Sem nome',
        sku: itemData.sku || '',
        category: itemData.category || 'Geral',
        current_quantity: Number(itemData.current_quantity) || 0,
        min_quantity: Number(itemData.min_quantity) || 0,
        unit: itemData.unit || 'un',
        cost_price: Number(itemData.cost_price) || 0,
        unit_price: Number(itemData.unit_price) || 0,
        location: itemData.location || '',
        description: itemData.description || '',
        created_at: itemData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = await upsertItem(newItemObj);

      // Also record an initial movement if it's a new item with quantity > 0
      if (isNew && newItemObj.current_quantity > 0) {
        await recordStockMovement({
          id: `mov-${Date.now()}`,
          item_id: result.item.id,
          item_name: result.item.name,
          type: 'IN',
          quantity: newItemObj.current_quantity,
          previous_quantity: 0,
          new_quantity: newItemObj.current_quantity,
          reason: 'Cadastro Inicial de Item',
          created_at: new Date().toISOString()
        });
      }

      await loadData();
      showToast(
        isNew 
          ? `Item "${newItemObj.name}" cadastrado com sucesso!` 
          : `Item "${newItemObj.name}" atualizado!`
      );
    } catch (err: any) {
      showToast(`Erro ao salvar: ${err.message}`, 'warning');
      throw err;
    }
  };

  // Handle delete item
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await removeItem(itemToDelete.id);
      setItemToDelete(null);
      await loadData();
      showToast(`Item removido do estoque.`, 'info');
    } catch (err: any) {
      showToast(`Erro ao excluir: ${err.message}`, 'warning');
    }
  };

  // Handle stock movement
  const handleConfirmMovement = async (movementData: Omit<StockMovement, 'id' | 'created_at'>) => {
    try {
      const newMov: StockMovement = {
        ...movementData,
        id: `mov-${Date.now()}`,
        created_at: new Date().toISOString()
      };

      await recordStockMovement(newMov);

      // Update the item quantity
      const targetItem = items.find((i) => i.id === movementData.item_id);
      if (targetItem) {
        const updatedItem: Item = {
          ...targetItem,
          current_quantity: movementData.new_quantity,
          updated_at: new Date().toISOString()
        };
        await upsertItem(updatedItem);
      }

      await loadData();

      const typeLabel = movementData.type === 'IN' ? 'Entrada' : movementData.type === 'OUT' ? 'Saída' : 'Ajuste';
      showToast(`${typeLabel} registrada: ${movementData.item_name} agora possui saldo de ${movementData.new_quantity}.`);
    } catch (err: any) {
      showToast(`Erro ao registrar movimentação: ${err.message}`, 'warning');
      throw err;
    }
  };

  // Quick movement trigger from item row
  const handleQuickMovement = (item: Item, type: 'IN' | 'OUT') => {
    setSelectedMovementItem(item);
    setMovementInitialType(type);
    setIsMovementModalOpen(true);
  };

  // Filter low stock items count
  const lowStockItems = items.filter(
    (item) => item.current_quantity > 0 && item.current_quantity <= item.min_quantity
  );

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navigation Header */}
      <Header
        supabaseConfig={supabaseConfig}
        lowStockCount={lowStockItems.length}
        onOpenNewItem={() => {
          setItemToEdit(null);
          setIsItemModalOpen(true);
        }}
        onOpenMovement={() => {
          setSelectedMovementItem(null);
          setMovementInitialType('IN');
          setIsMovementModalOpen(true);
        }}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onFilterLowStock={() => setFilter((prev) => ({ ...prev, status: 'LOW' }))}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Top Metric Cards */}
        <StatsCards
          items={items}
          activeStatusFilter={filter.status}
          onSelectStatusFilter={(st) => setFilter((prev) => ({ ...prev, status: st }))}
        />

        {/* Low Stock Warning Banner if any */}
        {lowStockItems.length > 0 && filter.status !== 'LOW' && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-300 font-medium">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Atenção:</strong> Existem <strong>{lowStockItems.length} itens</strong> com saldo igual ou abaixo do estoque mínimo estabelecido.
              </span>
            </div>
            <button
              onClick={() => setFilter((prev) => ({ ...prev, status: 'LOW' }))}
              className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline shrink-0"
            >
              Ver itens críticos &rarr;
            </button>
          </div>
        )}

        {/* Main Items Table / Cards */}
        <ItemList
          items={items}
          filter={filter}
          onFilterChange={(newFilter) => setFilter((prev) => ({ ...prev, ...newFilter }))}
          onEditItem={(item) => {
            setItemToEdit(item);
            setIsItemModalOpen(true);
          }}
          onDeleteItem={(id, name) => setItemToDelete({ id, name })}
          onQuickMovement={handleQuickMovement}
          onOpenNewItem={() => {
            setItemToEdit(null);
            setIsItemModalOpen(true);
          }}
        />

      </main>

      {/* Item Create / Edit Modal */}
      <ItemModal
        isOpen={isItemModalOpen}
        itemToEdit={itemToEdit}
        onClose={() => {
          setIsItemModalOpen(false);
          setItemToEdit(null);
        }}
        onSave={handleSaveItem}
      />

      {/* Stock Movement Modal (In / Out / Adjust) */}
      <MovementModal
        isOpen={isMovementModalOpen}
        items={items}
        preselectedItem={selectedMovementItem}
        initialType={movementInitialType}
        onClose={() => {
          setIsMovementModalOpen(false);
          setSelectedMovementItem(null);
        }}
        onConfirm={handleConfirmMovement}
      />

      {/* Audit Log / History Modal */}
      <MovementsHistory
        isOpen={isHistoryModalOpen}
        movements={movements}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      {/* Delete Item Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Excluir Item do Estoque?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tem certeza que deseja remover <strong>"{itemToDelete.name}"</strong>? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-delete"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className={`p-3.5 rounded-xl shadow-xl border flex items-center gap-3 text-xs font-medium ${
            toast.type === 'success'
              ? 'bg-slate-900 text-white border-emerald-500/50 shadow-emerald-900/20'
              : toast.type === 'warning'
              ? 'bg-amber-950 text-amber-200 border-amber-700 shadow-amber-900/20'
              : 'bg-slate-900 text-slate-200 border-slate-700'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />}
            {toast.type === 'info' && <Info className="h-4 w-4 text-blue-400 shrink-0" />}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
