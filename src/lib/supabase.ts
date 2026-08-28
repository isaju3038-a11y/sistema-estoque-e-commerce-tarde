import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Item, StockMovement } from '../types';
import { INITIAL_ITEMS, INITIAL_MOVEMENTS } from './sampleData';

const LOCAL_ITEMS_KEY = 'stock_system_items_v1';
const LOCAL_MOVEMENTS_KEY = 'stock_system_movements_v1';
const SUPABASE_URL_KEY = 'stock_system_supabase_url';
const SUPABASE_KEY_KEY = 'stock_system_supabase_anon_key';

export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- SCHEMA COMPLETO DO BANCO DE DADOS E POLÍTICAS DE ARMAZENAMENTO (SUPABASE)
-- Sistema de Gestão de Estoque
-- ==============================================================================

-- 1. CRIAÇÃO DA TABELA DE ITENS / PRODUTOS
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT,
    category TEXT DEFAULT 'Geral',
    current_quantity NUMERIC NOT NULL DEFAULT 0,
    min_quantity NUMERIC NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'un',
    cost_price NUMERIC DEFAULT 0,
    unit_price NUMERIC DEFAULT 0,
    location TEXT,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CRIAÇÃO DA TABELA DE MOVIMENTAÇÕES DE ESTOQUE (HISTÓRICO / AUDITORIA)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUST')),
    quantity NUMERIC NOT NULL,
    previous_quantity NUMERIC NOT NULL,
    new_quantity NUMERIC NOT NULL,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ÍNDICES PARA ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category);
CREATE INDEX IF NOT EXISTS idx_items_sku ON public.items(sku);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item_id ON public.stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements(created_at DESC);

-- 4. HABILITAR ROW LEVEL SECURITY (RLS) NAS TABELAS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE ACESSO (RLS) PARA AS TABELAS (Público / Anon / Autenticado)
DROP POLICY IF EXISTS "Permitir leitura total de itens" ON public.items;
CREATE POLICY "Permitir leitura total de itens" 
    ON public.items FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Permitir insercao de itens" ON public.items;
CREATE POLICY "Permitir insercao de itens" 
    ON public.items FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao de itens" ON public.items;
CREATE POLICY "Permitir atualizacao de itens" 
    ON public.items FOR UPDATE 
    USING (true);

DROP POLICY IF EXISTS "Permitir exclusao de itens" ON public.items;
CREATE POLICY "Permitir exclusao de itens" 
    ON public.items FOR DELETE 
    USING (true);

DROP POLICY IF EXISTS "Permitir leitura de movimentacoes" ON public.stock_movements;
CREATE POLICY "Permitir leitura de movimentacoes" 
    ON public.stock_movements FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Permitir insercao de movimentacoes" ON public.stock_movements;
CREATE POLICY "Permitir insercao de movimentacoes" 
    ON public.stock_movements FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao de movimentacoes" ON public.stock_movements;
CREATE POLICY "Permitir atualizacao de movimentacoes" 
    ON public.stock_movements FOR UPDATE 
    USING (true);

DROP POLICY IF EXISTS "Permitir exclusao de movimentacoes" ON public.stock_movements;
CREATE POLICY "Permitir exclusao de movimentacoes" 
    ON public.stock_movements FOR DELETE 
    USING (true);

-- ==============================================================================
-- 6. CONFIGURAÇÃO DO SUPABASE STORAGE (BUCKET E POLÍTICAS DE ARMAZENAMENTO)
-- ==============================================================================

-- Criação do Bucket de Armazenamento para Imagens de Itens/Anexos (Público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'inventory-images',
    'inventory-images',
    true,
    5242880, -- 5MB limite de tamanho
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'application/pdf'];

-- Políticas de Armazenamento (Storage RLS Policies) para o bucket 'inventory-images'
DROP POLICY IF EXISTS "Permitir visualizacao publica de arquivos do estoque" ON storage.objects;
CREATE POLICY "Permitir visualizacao publica de arquivos do estoque" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'inventory-images');

DROP POLICY IF EXISTS "Permitir upload de arquivos no estoque" ON storage.objects;
CREATE POLICY "Permitir upload de arquivos no estoque" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'inventory-images');

DROP POLICY IF EXISTS "Permitir atualizacao de arquivos no estoque" ON storage.objects;
CREATE POLICY "Permitir atualizacao de arquivos no estoque" 
    ON storage.objects FOR UPDATE 
    USING (bucket_id = 'inventory-images');

DROP POLICY IF EXISTS "Permitir exclusao de arquivos no estoque" ON storage.objects;
CREATE POLICY "Permitir exclusao de arquivos no estoque" 
    ON storage.objects FOR DELETE 
    USING (bucket_id = 'inventory-images');
`;

let cachedClient: SupabaseClient | null = null;

export function getSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const storedUrl = (localStorage.getItem(SUPABASE_URL_KEY) || '').trim();
  const storedKey = (localStorage.getItem(SUPABASE_KEY_KEY) || '').trim();

  const url = storedUrl || envUrl;
  const anonKey = storedKey || envKey;

  const isConfigured = Boolean(
    url &&
    anonKey &&
    url.startsWith('http') &&
    !url.includes('your-project.supabase.co') &&
    anonKey !== 'your-anon-key'
  );

  return { url, anonKey, isConfigured };
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  if (url) localStorage.setItem(SUPABASE_URL_KEY, url.trim());
  else localStorage.removeItem(SUPABASE_URL_KEY);

  if (anonKey) localStorage.setItem(SUPABASE_KEY_KEY, anonKey.trim());
  else localStorage.removeItem(SUPABASE_KEY_KEY);

  cachedClient = null;
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();

  if (!isConfigured) return null;

  if (!cachedClient) {
    try {
      cachedClient = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      });
    } catch (e) {
      console.error('Erro ao instanciar Supabase Client:', e);
      return null;
    }
  }

  return cachedClient;
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string; tableFound: boolean }> {
  try {
    if (!url || !anonKey) {
      return { success: false, message: 'URL e Anon Key são obrigatórios.', tableFound: false };
    }
    const testClient = createClient(url.trim(), anonKey.trim());
    const { data, error } = await testClient.from('items').select('id').limit(1);

    if (error) {
      // If table doesn't exist yet, connection is valid but schema needed
      if (error.code === '42P01' || error.message.includes('relation "public.items" does not exist') || error.message.includes('items')) {
        return {
          success: true,
          message: 'Conexão estabelecida com sucesso! No entanto, a tabela "items" ainda não foi criada. Execute o script SQL no SQL Editor do Supabase.',
          tableFound: false
        };
      }
      return {
        success: false,
        message: `Falha na conexão: ${error.message}`,
        tableFound: false
      };
    }

    return {
      success: true,
      message: 'Conectado com sucesso ao Supabase! Tabelas encontradas e prontas.',
      tableFound: true
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao conectar: ${err.message || 'Verifique a URL e Chave.'}`,
      tableFound: false
    };
  }
}

// Local Storage Fallback helpers
export function getLocalItems(): Item[] {
  try {
    const raw = localStorage.getItem(LOCAL_ITEMS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_ITEMS_KEY, JSON.stringify(INITIAL_ITEMS));
      return INITIAL_ITEMS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ITEMS;
  }
}

export function saveLocalItems(items: Item[]): void {
  try {
    localStorage.setItem(LOCAL_ITEMS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Erro ao salvar localmente:', e);
  }
}

export function getLocalMovements(): StockMovement[] {
  try {
    const raw = localStorage.getItem(LOCAL_MOVEMENTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_MOVEMENTS_KEY, JSON.stringify(INITIAL_MOVEMENTS));
      return INITIAL_MOVEMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOVEMENTS;
  }
}

export function saveLocalMovements(movements: StockMovement[]): void {
  try {
    localStorage.setItem(LOCAL_MOVEMENTS_KEY, JSON.stringify(movements));
  } catch (e) {
    console.error('Erro ao salvar movimentações:', e);
  }
}

// Unified API layer (Supabase with automatic LocalStorage synchronization / fallback)
export async function fetchAllItems(): Promise<{ items: Item[]; fromSupabase: boolean }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mappedItems: Item[] = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          sku: d.sku || '',
          category: d.category || 'Geral',
          current_quantity: Number(d.current_quantity) || 0,
          min_quantity: Number(d.min_quantity) || 0,
          unit: d.unit || 'un',
          cost_price: Number(d.cost_price) || 0,
          unit_price: Number(d.unit_price) || 0,
          location: d.location || '',
          description: d.description || '',
          created_at: d.created_at || new Date().toISOString(),
          updated_at: d.updated_at || d.created_at || new Date().toISOString(),
        }));
        saveLocalItems(mappedItems);
        return { items: mappedItems, fromSupabase: true };
      } else {
        console.warn('Erro ao buscar do Supabase, utilizando cache local:', error?.message);
      }
    } catch (e) {
      console.warn('Exceção ao buscar do Supabase:', e);
    }
  }

  return { items: getLocalItems(), fromSupabase: false };
}

export async function upsertItem(item: Item): Promise<{ item: Item; success: boolean; fromSupabase: boolean; error?: string }> {
  const client = getSupabaseClient();
  let fromSupabase = false;

  // Prepare payload for Supabase
  const payload: any = {
    name: item.name,
    sku: item.sku,
    category: item.category,
    current_quantity: item.current_quantity,
    min_quantity: item.min_quantity,
    unit: item.unit,
    cost_price: item.cost_price,
    unit_price: item.unit_price,
    location: item.location,
    description: item.description,
    updated_at: new Date().toISOString()
  };

  // Check if item id is UUID or existing
  if (item.id && !item.id.startsWith('temp-') && !item.id.startsWith('item-')) {
    payload.id = item.id;
  }

  let finalItem = { ...item, updated_at: new Date().toISOString() };

  if (client) {
    try {
      if (payload.id) {
        const { data, error } = await client
          .from('items')
          .update(payload)
          .eq('id', payload.id)
          .select()
          .single();

        if (!error && data) {
          finalItem = { ...item, id: data.id, updated_at: data.updated_at };
          fromSupabase = true;
        } else if (error) {
          console.warn('Erro ao atualizar item no Supabase:', error.message);
        }
      } else {
        const { data, error } = await client
          .from('items')
          .insert(payload)
          .select()
          .single();

        if (!error && data) {
          finalItem = { ...item, id: data.id, created_at: data.created_at, updated_at: data.updated_at };
          fromSupabase = true;
        } else if (error) {
          console.warn('Erro ao inserir item no Supabase:', error.message);
        }
      }
    } catch (e: any) {
      console.warn('Exceção no Supabase upsertItem:', e?.message);
    }
  }

  // Update local storage
  const currentItems = getLocalItems();
  const index = currentItems.findIndex(i => i.id === item.id || (finalItem.id && i.id === finalItem.id));
  if (index >= 0) {
    currentItems[index] = finalItem;
  } else {
    currentItems.unshift(finalItem);
  }
  saveLocalItems(currentItems);

  return { item: finalItem, success: true, fromSupabase };
}

export async function removeItem(id: string): Promise<{ success: boolean; fromSupabase: boolean }> {
  const client = getSupabaseClient();
  let fromSupabase = false;

  if (client && !id.startsWith('temp-') && !id.startsWith('item-')) {
    try {
      const { error } = await client.from('items').delete().eq('id', id);
      if (!error) {
        fromSupabase = true;
      }
    } catch (e) {
      console.warn('Erro ao deletar no Supabase:', e);
    }
  }

  const currentItems = getLocalItems().filter(i => i.id !== id);
  saveLocalItems(currentItems);

  return { success: true, fromSupabase };
}

export async function fetchAllMovements(): Promise<{ movements: StockMovement[]; fromSupabase: boolean }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        const mapped: StockMovement[] = data.map((d: any) => ({
          id: d.id,
          item_id: d.item_id,
          item_name: d.item_name,
          type: d.type as any,
          quantity: Number(d.quantity),
          previous_quantity: Number(d.previous_quantity),
          new_quantity: Number(d.new_quantity),
          reason: d.reason || '',
          notes: d.notes || '',
          created_at: d.created_at || new Date().toISOString()
        }));
        saveLocalMovements(mapped);
        return { movements: mapped, fromSupabase: true };
      }
    } catch (e) {
      console.warn('Exceção ao buscar movimentações Supabase:', e);
    }
  }

  return { movements: getLocalMovements(), fromSupabase: false };
}

export async function recordStockMovement(movement: StockMovement): Promise<{ movement: StockMovement; success: boolean; fromSupabase: boolean }> {
  const client = getSupabaseClient();
  let fromSupabase = false;
  let finalMov = { ...movement, created_at: movement.created_at || new Date().toISOString() };

  if (client && movement.item_id && !movement.item_id.startsWith('temp-') && !movement.item_id.startsWith('item-')) {
    try {
      const payload: any = {
        item_id: movement.item_id,
        item_name: movement.item_name,
        type: movement.type,
        quantity: movement.quantity,
        previous_quantity: movement.previous_quantity,
        new_quantity: movement.new_quantity,
        reason: movement.reason,
        notes: movement.notes
      };

      const { data, error } = await client.from('stock_movements').insert(payload).select().single();
      if (!error && data) {
        finalMov = { ...movement, id: data.id, created_at: data.created_at };
        fromSupabase = true;
      }
    } catch (e) {
      console.warn('Erro ao gravar movimentação no Supabase:', e);
    }
  }

  const movs = getLocalMovements();
  movs.unshift(finalMov);
  saveLocalMovements(movs);

  return { movement: finalMov, success: true, fromSupabase };
}
