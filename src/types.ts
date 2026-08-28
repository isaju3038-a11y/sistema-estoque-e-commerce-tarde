export interface Item {
  id: string;
  name: string;
  sku: string;
  category: string;
  current_quantity: number;
  min_quantity: number;
  unit: string; // 'un', 'kg', 'cx', 'lt', 'm', 'pct', etc.
  unit_price: number;
  cost_price: number;
  location?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export type MovementType = 'IN' | 'OUT' | 'ADJUST';

export interface StockMovement {
  id: string;
  item_id: string;
  item_name: string;
  type: MovementType;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  notes?: string;
  created_at: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  usingCustomKeys: boolean;
}

export type StockStatusFilter = 'ALL' | 'NORMAL' | 'LOW' | 'OUT_OF_STOCK';

export interface FilterOptions {
  search: string;
  category: string;
  status: StockStatusFilter;
  sortBy: 'name' | 'quantity' | 'min_quantity' | 'updated_at' | 'value';
  sortOrder: 'asc' | 'desc';
}
