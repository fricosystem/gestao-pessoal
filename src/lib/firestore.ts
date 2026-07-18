import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  setDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MonthlySalary, Extra, Debt, DebtPayment, GroceryList, GroceryItem, FutureGroceryList } from './types';

// ─── Helper: convert Firestore timestamps to ISO strings ───
function toISO(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

// ─── Helper: check if Firestore is available ───
function isFirestoreError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message || '';
    const code = (err as { code?: string }).code || '';
    return (
      msg.includes('PreconditionFailed') ||
      msg.includes('pendente') ||
      code === 'failed-precondition' ||
      code === 'unavailable' ||
      code === 'permission-denied' ||
      code === 'not-found'
    );
  }
  return false;
}

// ─── Salários ───
const SALARIOS_COL = 'salarios';

export async function saveSalaryFirestore(
  userId: string,
  month: number,
  year: number,
  salary: number
): Promise<void> {
  const existing = await getDocs(
    query(collection(db, SALARIOS_COL), where('userId', '==', userId), where('month', '==', month), where('year', '==', year))
  );

  if (!existing.empty) {
    const docRef = doc(db, SALARIOS_COL, existing.docs[0].id);
    await updateDoc(docRef, { salary });
  } else {
    await addDoc(collection(db, SALARIOS_COL), {
      userId,
      month,
      year,
      salary,
      extras: [],
    });
  }
}

export async function addExtraFirestore(
  userId: string,
  month: number,
  year: number,
  extra: Extra
): Promise<void> {
  const q = query(
    collection(db, SALARIOS_COL),
    where('userId', '==', userId),
    where('month', '==', month),
    where('year', '==', year)
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    const docRef = doc(db, SALARIOS_COL, snap.docs[0].id);
    const current = snap.docs[0].data();
    const extras = [...(current.extras || []), extra];
    await updateDoc(docRef, { extras });
  } else {
    await addDoc(collection(db, SALARIOS_COL), {
      userId,
      month,
      year,
      salary: 0,
      extras: [extra],
    });
  }
}

export async function removeExtraFirestore(
  userId: string,
  month: number,
  year: number,
  extraId: string
): Promise<void> {
  const q = query(
    collection(db, SALARIOS_COL),
    where('userId', '==', userId),
    where('month', '==', month),
    where('year', '==', year)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    const docRef = doc(db, SALARIOS_COL, snap.docs[0].id);
    const current = snap.docs[0].data();
    const extras = (current.extras || []).filter((e: Extra) => e.id !== extraId);
    await updateDoc(docRef, { extras });
  }
}

// ─── Dívidas ───
const DIVIDAS_COL = 'dividas';

export async function addDebtFirestore(
  userId: string,
  debt: Omit<Debt, 'id' | 'paidInstallments' | 'payments'>
): Promise<string> {
  const docRef = await addDoc(collection(db, DIVIDAS_COL), {
    userId,
    description: debt.description,
    totalValue: debt.totalValue,
    installments: debt.installments,
    installmentValue: debt.installmentValue,
    startDate: debt.startDate,
    dueDate: debt.dueDate,
    paidInstallments: 0,
    payments: [],
  });
  return docRef.id;
}

export async function updateDebtFirestore(
  debtId: string,
  updates: Partial<Omit<Debt, 'id' | 'payments'>>
): Promise<void> {
  const docRef = doc(db, DIVIDAS_COL, debtId);
  await updateDoc(docRef, updates as Record<string, unknown>);
}

export async function deleteDebtFirestore(debtId: string): Promise<void> {
  await deleteDoc(doc(db, DIVIDAS_COL, debtId));
}

export async function payDebtInstallmentFirestore(debtId: string): Promise<void> {
  const docRef = doc(db, DIVIDAS_COL, debtId);
  const { getDoc: getDocFn } = await import('firebase/firestore');
  const snap = await getDocFn(docRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const newPaid = (data.paidInstallments || 0) + 1;
  const payment: DebtPayment = {
    date: new Date().toISOString(),
    amount: data.installmentValue || 0,
  };
  await updateDoc(docRef, {
    paidInstallments: newPaid,
    payments: [...(data.payments || []), payment],
  });
}

// ─── Listas de Mercado ───
const LISTAS_COL = 'listas_mercado';

export async function addGroceryListFirestore(
  userId: string,
  list: Omit<GroceryList, 'id'>
): Promise<string> {
  const docRef = await addDoc(collection(db, LISTAS_COL), {
    userId,
    date: list.date,
    name: list.name,
    purchaseType: list.purchaseType,
    items: list.items,
    total: list.total,
  });
  return docRef.id;
}

export async function updateGroceryListFirestore(
  listId: string,
  updates: Partial<GroceryList>
): Promise<void> {
  const docRef = doc(db, LISTAS_COL, listId);
  await updateDoc(docRef, updates as Record<string, unknown>);
}

export async function deleteGroceryListFirestore(listId: string): Promise<void> {
  await deleteDoc(doc(db, LISTAS_COL, listId));
}

// ─── Compras Futuras (planejadas) ───
const COMPRAS_FUTURAS_COL = 'compras_futuras';

export async function addFutureGroceryListFirestore(
  userId: string,
  list: Omit<FutureGroceryList, 'id'>
): Promise<string> {
  const docRef = await addDoc(collection(db, COMPRAS_FUTURAS_COL), {
    userId,
    date: list.date,
    name: list.name,
    purchaseType: list.purchaseType,
    items: list.items,
    total: list.total,
  });
  return docRef.id;
}

export async function updateFutureGroceryListFirestore(
  listId: string,
  updates: Partial<FutureGroceryList>
): Promise<void> {
  const docRef = doc(db, COMPRAS_FUTURAS_COL, listId);
  await updateDoc(docRef, updates as Record<string, unknown>);
}

export async function deleteFutureGroceryListFirestore(listId: string): Promise<void> {
  await deleteDoc(doc(db, COMPRAS_FUTURAS_COL, listId));
}

export function subscribeComprasFuturas(userId: string, callback: (data: FutureGroceryList[]) => void) {
  const q = query(collection(db, COMPRAS_FUTURAS_COL), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => {
      const docData = d.data();
      return {
        id: d.id,
        date: toISO(docData.date),
        name: docData.name,
        purchaseType: docData.purchaseType || 'Supermercado',
        items: (docData.items || []).map((i: Record<string, unknown>) => ({
          id: i.id as string,
          name: i.name as string,
          unitPrice: i.unitPrice as number,
          quantity: i.quantity as number,
        })),
        total: docData.total || 0,
      } as FutureGroceryList;
    });
    callback(data);
  }, (error) => {
    console.warn('[Firestore] Erro ao escutar compras futuras:', error?.message || error);
    callback([]);
  });
}

// ─── Itens Mestre do Mercado (autocomplete) ───
const ITENS_MESTRE_COL = 'itens_mercado_mestre';

export async function addMasterItemsFirestore(userId: string, names: string[]): Promise<void> {
  const docRef = doc(db, ITENS_MESTRE_COL, userId);
  const { getDoc: getDocFn } = await import('firebase/firestore');
  const snap = await getDocFn(docRef);
  const current: string[] = snap.exists() ? (snap.data().names || []) : [];
  const newNames = names.filter(
    (n) => !current.some((c) => c.toLowerCase() === n.toLowerCase())
  );
  if (newNames.length > 0) {
    await setDoc(docRef, { names: [...current, ...newNames], userId }, { merge: true });
  }
}

// ─── Rascunho do Mercado ───
const RASCUNHOS_COL = 'rascunhos_mercado';

export interface GroceryDraftFirestore {
  listName: string;
  items: GroceryItem[];
  updatedAt: string;
}

export async function saveGroceryDraftFirestore(
  userId: string,
  draft: GroceryDraftFirestore
): Promise<void> {
  const docRef = doc(db, RASCUNHOS_COL, userId);
  await setDoc(docRef, { ...draft, userId }, { merge: true });
}

export async function clearGroceryDraftFirestore(userId: string): Promise<void> {
  const docRef = doc(db, RASCUNHOS_COL, userId);
  await deleteDoc(docRef);
}

// ─── Real-time listeners with error handling ───

export function subscribeSalarios(userId: string, callback: (data: MonthlySalary[]) => void) {
  const q = query(collection(db, SALARIOS_COL), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => {
      const docData = d.data();
      return {
        month: docData.month,
        year: docData.year,
        salary: docData.salary || 0,
        extras: (docData.extras || []).map((e: Record<string, unknown>) => ({
          id: e.id as string,
          name: e.name as string,
          value: e.value as number,
          date: toISO(e.date),
        })),
      } as MonthlySalary;
    });
    callback(data);
  }, (error) => {
    console.warn('[Firestore] Erro ao escutar salários:', error?.message || error);
    // Silently return empty data on Firestore not ready
    callback([]);
  });
}

export function subscribeDividas(userId: string, callback: (data: Debt[]) => void) {
  const q = query(collection(db, DIVIDAS_COL), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => {
      const docData = d.data();
      return {
        id: d.id,
        description: docData.description,
        totalValue: docData.totalValue,
        installments: docData.installments,
        paidInstallments: docData.paidInstallments || 0,
        installmentValue: docData.installmentValue,
        startDate: toISO(docData.startDate ?? docData.dueDate),
        dueDate: toISO(docData.dueDate),
        payments: (docData.payments || []).map((p: Record<string, unknown>) => ({
          date: toISO(p.date),
          amount: p.amount as number,
        })),
      } as Debt;
    });
    callback(data);
  }, (error) => {
    console.warn('[Firestore] Erro ao escutar dívidas:', error?.message || error);
    callback([]);
  });
}

export function subscribeListas(userId: string, callback: (data: GroceryList[]) => void) {
  const q = query(collection(db, LISTAS_COL), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => {
      const docData = d.data();
      return {
        id: d.id,
        date: toISO(docData.date),
        name: docData.name,
        purchaseType: docData.purchaseType || 'Supermercado',
        items: (docData.items || []).map((i: Record<string, unknown>) => ({
          id: i.id as string,
          name: i.name as string,
          unitPrice: i.unitPrice as number,
          quantity: i.quantity as number,
        })),
        total: docData.total || 0,
      } as GroceryList;
    });
    callback(data);
  }, (error) => {
    console.warn('[Firestore] Erro ao escutar listas de mercado:', error?.message || error);
    callback([]);
  });
}

export function subscribeMasterItems(userId: string, callback: (data: string[]) => void) {
  const docRef = doc(db, ITENS_MESTRE_COL, userId);
  return onSnapshot(docRef, (snap) => {
    callback(snap.exists() ? (snap.data().names || []) : []);
  }, (error) => {
    console.warn('[Firestore] Erro ao escutar itens mestre:', error?.message || error);
    callback([]);
  });
}

export function subscribeDraft(userId: string, callback: (data: GroceryDraftFirestore | null) => void) {
  const docRef = doc(db, RASCUNHOS_COL, userId);
  return onSnapshot(docRef, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    const docData = snap.data();
    callback({
      listName: docData.listName || '',
      items: (docData.items || []).map((i: Record<string, unknown>) => ({
        id: i.id as string,
        name: i.name as string,
        unitPrice: i.unitPrice as number,
        quantity: i.quantity as number,
      })),
      updatedAt: toISO(docData.updatedAt),
    });
  }, (error) => {
    console.warn('[Firestore] Erro ao escutar rascunho:', error?.message || error);
    callback(null);
  });
}
