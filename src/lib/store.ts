import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { MonthlySalary, Extra, Debt, DebtPayment, GroceryList, GroceryItem } from './types';
import {
  saveSalaryFirestore,
  addExtraFirestore,
  removeExtraFirestore,
  addDebtFirestore,
  updateDebtFirestore,
  deleteDebtFirestore,
  payDebtInstallmentFirestore,
  addGroceryListFirestore,
  updateGroceryListFirestore,
  deleteGroceryListFirestore,
  addMasterItemsFirestore,
  saveGroceryDraftFirestore,
  clearGroceryDraftFirestore,
} from './firestore';
import type { GroceryDraftFirestore } from './firestore';

interface GroceryDraft {
  listName: string;
  items: GroceryItem[];
  updatedAt: string;
}

interface GastosState {
  userId: string | null;
  monthlySalaries: MonthlySalary[];
  debts: Debt[];
  groceryLists: GroceryList[];
  groceryItemsMaster: string[];
  groceryDraft: GroceryDraft | null;

  // Set data from Firestore listeners
  setUserId: (userId: string | null) => void;
  setMonthlySalaries: (salaries: MonthlySalary[]) => void;
  setDebts: (debts: Debt[]) => void;
  setGroceryLists: (lists: GroceryList[]) => void;
  setGroceryItemsMaster: (items: string[]) => void;
  setGroceryDraft: (draft: GroceryDraft | null) => void;

  // Salary
  saveSalary: (month: number, year: number, salary: number) => Promise<void>;
  addExtra: (month: number, year: number, extra: Omit<Extra, 'id'>) => Promise<void>;
  removeExtra: (month: number, year: number, extraId: string) => Promise<void>;

  // Debts
  addDebt: (debt: Omit<Debt, 'id' | 'paidInstallments' | 'payments'>) => Promise<void>;
  updateDebt: (debtId: string, updates: Partial<Omit<Debt, 'id' | 'payments'>>) => Promise<void>;
  deleteDebt: (debtId: string) => Promise<void>;
  payDebtInstallment: (debtId: string) => Promise<void>;

  // Grocery
  addGroceryList: (list: Omit<GroceryList, 'id'>) => Promise<void>;
  updateGroceryList: (listId: string, updates: Partial<GroceryList>) => Promise<void>;
  deleteGroceryList: (listId: string) => Promise<void>;
  addMasterItems: (names: string[]) => Promise<void>;

  // Grocery Draft
  saveGroceryDraft: (draft: GroceryDraft) => Promise<void>;
  clearGroceryDraft: () => Promise<void>;
}

export const useGastosStore = create<GastosState>()((set, get) => ({
  userId: null,
  monthlySalaries: [],
  debts: [],
  groceryLists: [],
  groceryItemsMaster: [],
  groceryDraft: null,

  // Setters from Firestore listeners
  setUserId: (userId) => set({ userId }),
  setMonthlySalaries: (monthlySalaries) => set({ monthlySalaries }),
  setDebts: (debts) => set({ debts }),
  setGroceryLists: (groceryLists) => set({ groceryLists }),
  setGroceryItemsMaster: (groceryItemsMaster) => set({ groceryItemsMaster }),
  setGroceryDraft: (groceryDraft) => set({ groceryDraft }),

  // Salary
  saveSalary: async (month, year, salary) => {
    const userId = get().userId;
    if (!userId) return;
    await saveSalaryFirestore(userId, month, year, salary);
  },

  addExtra: async (month, year, extra) => {
    const userId = get().userId;
    if (!userId) return;
    const newExtra: Extra = { ...extra, id: uuidv4() };
    await addExtraFirestore(userId, month, year, newExtra);
  },

  removeExtra: async (month, year, extraId) => {
    const userId = get().userId;
    if (!userId) return;
    await removeExtraFirestore(userId, month, year, extraId);
  },

  // Debts
  addDebt: async (debt) => {
    const userId = get().userId;
    if (!userId) return;
    await addDebtFirestore(userId, debt);
  },

  updateDebt: async (debtId, updates) => {
    await updateDebtFirestore(debtId, updates);
  },

  deleteDebt: async (debtId) => {
    await deleteDebtFirestore(debtId);
  },

  payDebtInstallment: async (debtId) => {
    await payDebtInstallmentFirestore(debtId);
  },

  // Grocery
  addGroceryList: async (list) => {
    const userId = get().userId;
    if (!userId) return;
    await addGroceryListFirestore(userId, list);
  },

  updateGroceryList: async (listId, updates) => {
    await updateGroceryListFirestore(listId, updates);
  },

  deleteGroceryList: async (listId) => {
    await deleteGroceryListFirestore(listId);
  },

  addMasterItems: async (names) => {
    const userId = get().userId;
    if (!userId) return;
    await addMasterItemsFirestore(userId, names);
  },

  // Grocery Draft
  saveGroceryDraft: async (draft) => {
    const userId = get().userId;
    if (!userId) return;
    // Optimistic local update
    set({ groceryDraft: draft });
    await saveGroceryDraftFirestore(userId, draft);
  },

  clearGroceryDraft: async () => {
    const userId = get().userId;
    if (!userId) return;
    set({ groceryDraft: null });
    await clearGroceryDraftFirestore(userId);
  },
}));

// Helper functions for currency and date formatting
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] || '';
}

// Calcula a data da última parcela a partir da data inicial e do nº de parcelas
export function getDebtEndDate(startDate: string, installments: number): string {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + Math.max(0, installments - 1));
  return d.toISOString();
}

// Rótulo "Mês de Ano" (ex: "Julho de 2026")
export function getMonthYearLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${getMonthName(d.getMonth() + 1)} de ${d.getFullYear()}`;
}

// Gera o cronograma de parcelas mês a mês a partir da data inicial
export function getInstallmentSchedule(
  startDate: string,
  installments: number,
  installmentValue: number
): { index: number; date: string; label: string; value: number }[] {
  const schedule: { index: number; date: string; label: string; value: number }[] = [];
  for (let i = 0; i < installments; i++) {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + i);
    schedule.push({
      index: i + 1,
      date: d.toISOString(),
      label: getMonthYearLabel(d.toISOString()),
      value: installmentValue,
    });
  }
  return schedule;
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
