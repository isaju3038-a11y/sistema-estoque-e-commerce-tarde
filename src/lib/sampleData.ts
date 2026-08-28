import { Item, StockMovement } from '../types';

export const INITIAL_ITEMS: Item[] = [
  {
    id: 'item-1',
    name: 'Parafuso Sextavado Aço Inox M8x30',
    sku: 'PAR-M8-30',
    category: 'Fixadores & Ferragens',
    current_quantity: 45,
    min_quantity: 100, // Low stock alert!
    unit: 'un',
    cost_price: 0.85,
    unit_price: 1.90,
    location: 'Prateleira A-02',
    description: 'Parafuso sextavado em aço inox 304 para fixação mecânica.',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'item-2',
    name: 'Fita Isolante 3M Alta Temperatura 20m',
    sku: 'ELE-FIT-3M',
    category: 'Elétrica',
    current_quantity: 120,
    min_quantity: 30,
    unit: 'un',
    cost_price: 8.50,
    unit_price: 15.00,
    location: 'Gaveteiro E-14',
    description: 'Fita isolante antichama para fiação industrial e residencial.',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'item-3',
    name: 'Óleo Lubrificante Sintético 5W30',
    sku: 'LUB-SINT-5W30',
    category: 'Manutenção & Lubrificantes',
    current_quantity: 6,
    min_quantity: 15, // Low stock alert!
    unit: 'lt',
    cost_price: 28.00,
    unit_price: 49.90,
    location: 'Depósito Químico B-01',
    description: 'Lubrificante de alta performance para maquinário e motores.',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'item-4',
    name: 'Disjuntor Bipolar DIN 32A',
    sku: 'ELE-DISJ-32A',
    category: 'Elétrica',
    current_quantity: 0,
    min_quantity: 10, // Out of stock!
    unit: 'un',
    cost_price: 18.00,
    unit_price: 34.50,
    location: 'Prateleira E-04',
    description: 'Disjuntor termomagnético curva C para painéis de distribuição.',
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'item-5',
    name: 'Luva de Proteção Nitrílica G',
    sku: 'EPI-LUV-NIT-G',
    category: 'EPI & Segurança',
    current_quantity: 85,
    min_quantity: 25,
    unit: 'par',
    cost_price: 4.20,
    unit_price: 8.90,
    location: 'Armário EPI 01',
    description: 'Luvas de proteção química e mecânica sem pó.',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'item-6',
    name: 'Disco de Corte Inox 4.1/2"',
    sku: 'FER-DISC-45',
    category: 'Ferramentas & Abrasivos',
    current_quantity: 14,
    min_quantity: 50, // Low stock alert!
    unit: 'un',
    cost_price: 3.10,
    unit_price: 6.80,
    location: 'Prateleira F-09',
    description: 'Disco fino para corte rápido de chapas de aço e inox.',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

export const INITIAL_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-1',
    item_id: 'item-1',
    item_name: 'Parafuso Sextavado Aço Inox M8x30',
    type: 'OUT',
    quantity: 55,
    previous_quantity: 100,
    new_quantity: 45,
    reason: 'Ordem de Produção #4029',
    notes: 'Retirada para montagem da linha 2',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'mov-2',
    item_id: 'item-4',
    item_name: 'Disjuntor Bipolar DIN 32A',
    type: 'OUT',
    quantity: 10,
    previous_quantity: 10,
    new_quantity: 0,
    reason: 'Venda / Atendimento de Pedido #8912',
    notes: 'Estoque esgotado - solicitar compra urgente',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'mov-3',
    item_id: 'item-2',
    item_name: 'Fita Isolante 3M Alta Temperatura 20m',
    type: 'IN',
    quantity: 50,
    previous_quantity: 70,
    new_quantity: 120,
    reason: 'Recebimento de Fornecedor - NF-e 44921',
    notes: 'Lote 2026/08 recebido em perfeito estado',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];
