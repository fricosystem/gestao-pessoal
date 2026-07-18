export interface Extra {
  id: string;
  name: string;
  value: number;
  date: string; // ISO date
}

export interface MonthlySalary {
  month: number; // 1-12
  year: number;
  salary: number;
  extras: Extra[];
}

export interface DebtPayment {
  date: string; // ISO date
  amount: number;
}

export interface Debt {
  id: string;
  description: string;
  totalValue: number;
  installments: number; // 1 = parcela única
  paidInstallments: number;
  installmentValue: number;
  startDate: string; // ISO date - data de cadastro / 1ª parcela
  dueDate: string; // ISO date - data da última parcela (fim)
  payments: DebtPayment[];
}

export interface GroceryItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface GroceryList {
  id: string;
  date: string; // ISO date
  name: string;
  purchaseType: string; // tipo de compra (Supermercado, Farmácia, etc. ou personalizado)
  items: GroceryItem[];
  total: number;
}

// Compra futura (planejada) — só vira gasto quando comprada
export interface FutureGroceryList {
  id: string;
  date: string; // ISO date - data de cadastro/planejamento
  name: string;
  purchaseType: string;
  items: GroceryItem[];
  total: number;
}

// Tipos de compra fixos (mais opção "Outros" editável)
export const PURCHASE_TYPES = [
  'Supermercado',
  'Farmácia',
  'Vestuário',
  'Lazer',
  'Transporte',
  'Restaurante',
  'Casa',
  'Outros',
] as const;

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  criadoEm: string;
}

export type TabType = 'dashboard' | 'salary' | 'debts' | 'grocery' | 'cadastros';
