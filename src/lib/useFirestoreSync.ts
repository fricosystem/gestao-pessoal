'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useGastosStore } from '@/lib/store';
import {
  subscribeSalarios,
  subscribeDividas,
  subscribeListas,
  subscribeMasterItems,
  subscribeDraft,
} from '@/lib/firestore';

export function useFirestoreSync() {
  const { user } = useAuth();
  const setUserId = useGastosStore((s) => s.setUserId);
  const setMonthlySalaries = useGastosStore((s) => s.setMonthlySalaries);
  const setDebts = useGastosStore((s) => s.setDebts);
  const setGroceryLists = useGastosStore((s) => s.setGroceryLists);
  const setGroceryItemsMaster = useGastosStore((s) => s.setGroceryItemsMaster);
  const setGroceryDraft = useGastosStore((s) => s.setGroceryDraft);

  useEffect(() => {
    if (!user || !user.uid) {
      setUserId(null);
      setMonthlySalaries([]);
      setDebts([]);
      setGroceryLists([]);
      setGroceryItemsMaster([]);
      setGroceryDraft(null);
      return;
    }

    const uid = user.uid;
    setUserId(uid);

    // Subscribe to real-time updates (use local uid variable to avoid undefined issues)
    const unsub1 = subscribeSalarios(uid, setMonthlySalaries);
    const unsub2 = subscribeDividas(uid, setDebts);
    const unsub3 = subscribeListas(uid, setGroceryLists);
    const unsub4 = subscribeMasterItems(uid, setGroceryItemsMaster);
    const unsub5 = subscribeDraft(uid, (draft) => {
      setGroceryDraft(draft ? { listName: draft.listName, items: draft.items, updatedAt: draft.updatedAt } : null);
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
    };
  }, [user, setUserId, setMonthlySalaries, setDebts, setGroceryLists, setGroceryItemsMaster, setGroceryDraft]);
}
