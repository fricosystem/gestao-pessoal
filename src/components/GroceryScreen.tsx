'use client';

import { useState } from 'react';
import { useGastosStore, formatCurrency, formatDate, getMonthName } from '@/lib/store';
import type { GroceryList, FutureGroceryList } from '@/lib/types';
import GroceryForm from './GroceryForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ShoppingCart,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Edit3,
  Package,
  FileEdit,
  X,
  CalendarClock,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

type ScreenTab = 'now' | 'future';

export default function GroceryScreen() {
  const groceryLists = useGastosStore((s) => s.groceryLists);
  const futureGroceryLists = useGastosStore((s) => s.futureGroceryLists);
  const deleteGroceryList = useGastosStore((s) => s.deleteGroceryList);
  const deleteFutureGroceryList = useGastosStore((s) => s.deleteFutureGroceryList);
  const buyFutureGroceryList = useGastosStore((s) => s.buyFutureGroceryList);
  const groceryDraft = useGastosStore((s) => s.groceryDraft);
  const clearGroceryDraft = useGastosStore((s) => s.clearGroceryDraft);

  const [tab, setTab] = useState<ScreenTab>('now');
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<ScreenTab>('now');
  const [editingList, setEditingList] = useState<GroceryList | null>(null);
  const [editingFutureList, setEditingFutureList] = useState<FutureGroceryList | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteFutureConfirm, setDeleteFutureConfirm] = useState<string | null>(null);
  const [buyConfirm, setBuyConfirm] = useState<FutureGroceryList | null>(null);

  // Apenas compras do mês atual
  const now = new Date();
  const currentMonthLists = groceryLists.filter((l) => {
    const d = new Date(l.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const sortedLists = [...currentMonthLists].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const sortedFutureLists = [...futureGroceryLists].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  const handleEdit = (list: GroceryList) => {
    setEditingList(list);
    setEditingFutureList(null);
    setFormMode('now');
    setShowForm(true);
  };

  const handleEditFuture = (list: FutureGroceryList) => {
    setEditingFutureList(list);
    setEditingList(null);
    setFormMode('future');
    setShowForm(true);
  };

  const handleDelete = async (listId: string) => {
    try {
      await deleteGroceryList(listId);
      setDeleteConfirm(null);
      toast.success('Compra excluída com sucesso!');
    } catch {
      toast.error('Erro ao excluir compra', { description: 'Tente novamente.' });
    }
  };

  const handleDeleteFuture = async (listId: string) => {
    try {
      await deleteFutureGroceryList(listId);
      setDeleteFutureConfirm(null);
      toast.success('Compra futura excluída com sucesso!');
    } catch {
      toast.error('Erro ao excluir compra futura', { description: 'Tente novamente.' });
    }
  };

  const handleBuyNow = async (list: FutureGroceryList) => {
    try {
      await buyFutureGroceryList(list);
      setBuyConfirm(null);
      toast.success('Compra realizada!', { description: 'Lançada como gasto do mês.' });
    } catch {
      toast.error('Erro ao lançar compra', { description: 'Tente novamente.' });
    }
  };

  const handleBack = () => {
    setShowForm(false);
    setEditingList(null);
    setEditingFutureList(null);
  };

  const handleAdd = () => {
    setEditingList(null);
    setEditingFutureList(null);
    setFormMode(tab);
    setShowForm(true);
  };

  if (showForm) {
    const activeEditing = formMode === 'future' ? editingFutureList : editingList;
    return (
      <GroceryForm
        mode={formMode}
        editingList={
          activeEditing
            ? {
                id: activeEditing.id,
                name: activeEditing.name,
                purchaseType: activeEditing.purchaseType,
                items: activeEditing.items,
              }
            : null
        }
        onBack={handleBack}
      />
    );
  }

  const totalSpent = currentMonthLists.reduce((sum, l) => sum + l.total, 0);
  const totalFuture = futureGroceryLists.reduce((sum, l) => sum + l.total, 0);

  return (
    <div className="p-4 pb-24 space-y-4 hide-scrollbar overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground tracking-tight">Compras</h2>
        <div className="text-sm text-muted-foreground">
          {tab === 'now' ? (
            <>Total: <span className="text-[#00d4ff] font-semibold">{formatCurrency(totalSpent)}</span></>
          ) : (
            <>Planejado: <span className="text-primary font-semibold">{formatCurrency(totalFuture)}</span></>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <button
          type="button"
          onClick={() => setTab('now')}
          className={
            tab === 'now'
              ? 'flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/25 text-xs font-semibold transition-all'
              : 'flex items-center justify-center gap-1.5 h-9 rounded-lg text-muted-foreground hover:text-foreground text-xs font-medium transition-all'
          }
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Comprar agora
        </button>
        <button
          type="button"
          onClick={() => setTab('future')}
          className={
            tab === 'future'
              ? 'flex items-center justify-center gap-1.5 h-9 rounded-lg bg-primary/15 text-primary border border-primary/25 text-xs font-semibold transition-all'
              : 'flex items-center justify-center gap-1.5 h-9 rounded-lg text-muted-foreground hover:text-foreground text-xs font-medium transition-all'
          }
        >
          <CalendarClock className="h-3.5 w-3.5" />
          Compra Futura
        </button>
      </div>

      {tab === 'now' ? (
        <>
          {/* Summary */}
          <Card className="premium-card-cyan">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
                  Total Gasto em {getMonthName(now.getMonth() + 1)}
                </p>
                <p className="text-3xl font-bold text-[#00d4ff] tracking-tight">{formatCurrency(totalSpent)}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {currentMonthLists.length} compra{currentMonthLists.length !== 1 ? 's' : ''} neste mês
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Draft Banner */}
          {groceryDraft && groceryDraft.items.length > 0 && (
            <Card className="premium-card-accent animate-fade-in">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0">
                    <FileEdit className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Rascunho salvo</p>
                    <p className="text-xs text-muted-foreground">
                      {groceryDraft.items.length} item{groceryDraft.items.length !== 1 ? 's' : ''} — continue de onde parou
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => { setEditingList(null); setEditingFutureList(null); setFormMode('now'); setShowForm(true); }}
                      className="h-8 text-xs btn-primary px-3"
                    >
                      Continuar
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={async () => { try { await clearGroceryDraft(); } catch { /* ignore */ } }}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/8 rounded-lg"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lists */}
          {sortedLists.length > 0 ? (
            <div className="space-y-3">
              {sortedLists.map((list) => {
                const isExpanded = expandedIds.has(list.id);
                return (
                  <Card key={list.id} className="premium-card">
                    <CardContent className="pt-6">
                      <div
                        className="flex items-start justify-between cursor-pointer"
                        onClick={() => toggleExpand(list.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-foreground truncate">
                              {list.name}
                            </p>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 shrink-0">
                              {list.purchaseType}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(list.date)} - {list.items.length} item{list.items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className="text-sm font-semibold text-[#00d4ff]">
                            {formatCurrency(list.total)}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-3 space-y-2 animate-fade-in">
                          <div className="divider-subtle pt-3">
                            {list.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between py-1.5 text-sm"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <span className="truncate text-foreground">{item.name}</span>
                                  <span className="text-muted-foreground text-xs shrink-0">
                                    x{item.quantity}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 ml-2 shrink-0">
                                  <span className="text-xs text-muted-foreground">
                                    {formatCurrency(item.unitPrice)} un
                                  </span>
                                  <span className="text-xs font-medium text-foreground">
                                    {formatCurrency(item.unitPrice * item.quantity)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(list)}
                              className="flex-1 h-9 btn-ghost-premium text-xs"
                            >
                              <Edit3 className="h-3.5 w-3.5 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteConfirm(list.id)}
                              className="h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/8 text-xs rounded-lg shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="premium-card">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma compra registrada
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Toque no botão + para adicionar
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* Future Summary */}
          <Card className="premium-card-accent">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
                  Total Planejado
                </p>
                <p className="text-3xl font-bold text-primary tracking-tight">{formatCurrency(totalFuture)}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {futureGroceryLists.length} compra{futureGroceryLists.length !== 1 ? 's' : ''} futura{futureGroceryLists.length !== 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Future Lists */}
          {sortedFutureLists.length > 0 ? (
            <div className="space-y-3">
              {sortedFutureLists.map((list) => {
                const isExpanded = expandedIds.has(list.id);
                return (
                  <Card key={list.id} className="premium-card">
                    <CardContent className="pt-6">
                      <div
                        className="flex items-start justify-between cursor-pointer"
                        onClick={() => toggleExpand(list.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-foreground truncate">
                              {list.name}
                            </p>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                              {list.purchaseType}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(list.date)} - {list.items.length} item{list.items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className="text-sm font-semibold text-primary">
                            {formatCurrency(list.total)}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Buy now button (always visible) */}
                      <Button
                        size="sm"
                        onClick={() => setBuyConfirm(list)}
                        className="w-full h-9 btn-primary text-xs mt-3"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Comprar agora
                      </Button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-3 space-y-2 animate-fade-in">
                          <div className="divider-subtle pt-3">
                            {list.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between py-1.5 text-sm"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <span className="truncate text-foreground">{item.name}</span>
                                  <span className="text-muted-foreground text-xs shrink-0">
                                    x{item.quantity}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 ml-2 shrink-0">
                                  <span className="text-xs text-muted-foreground">
                                    {formatCurrency(item.unitPrice)} un
                                  </span>
                                  <span className="text-xs font-medium text-foreground">
                                    {formatCurrency(item.unitPrice * item.quantity)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditFuture(list)}
                              className="flex-1 h-9 btn-ghost-premium text-xs"
                            >
                              <Edit3 className="h-3.5 w-3.5 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteFutureConfirm(list.id)}
                              className="h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/8 text-xs rounded-lg shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="premium-card">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <CalendarClock className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma compra futura planejada
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Toque no botão + para planejar uma compra
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Floating Action Button */}
      <Button
        onClick={handleAdd}
        className="fixed bottom-20 right-4 sm:right-[calc(50%-230px)] h-14 w-14 rounded-full fab-premium z-30"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-[#111118] border-white/[0.06] text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Compra</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir esta compra? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-ghost-premium">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-white hover:bg-destructive/90 font-semibold"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Future Confirm Dialog */}
      <AlertDialog open={!!deleteFutureConfirm} onOpenChange={() => setDeleteFutureConfirm(null)}>
        <AlertDialogContent className="bg-[#111118] border-white/[0.06] text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Compra Futura</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir esta compra futura? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-ghost-premium">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFutureConfirm && handleDeleteFuture(deleteFutureConfirm)}
              className="bg-destructive text-white hover:bg-destructive/90 font-semibold"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Buy Now Confirm Dialog */}
      <AlertDialog open={!!buyConfirm} onOpenChange={() => setBuyConfirm(null)}>
        <AlertDialogContent className="bg-[#111118] border-white/[0.06] text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Comprar agora</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta compra será lançada como gasto do mês atual e removida das compras futuras. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-ghost-premium">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => buyConfirm && handleBuyNow(buyConfirm)}
              className="btn-primary font-semibold"
            >
              Confirmar Compra
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
