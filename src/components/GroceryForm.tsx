'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useGastosStore, formatCurrency } from '@/lib/store';
import type { GroceryItem } from '@/lib/types';
import { PURCHASE_TYPES } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  ShoppingCart,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface GroceryFormProps {
  editingList?: {
    id: string;
    name: string;
    purchaseType: string;
    items: GroceryItem[];
  } | null;
  onBack: () => void;
}

export default function GroceryForm({ editingList, onBack }: GroceryFormProps) {
  const addGroceryList = useGastosStore((s) => s.addGroceryList);
  const updateGroceryList = useGastosStore((s) => s.updateGroceryList);
  const addMasterItems = useGastosStore((s) => s.addMasterItems);
  const groceryItemsMaster = useGastosStore((s) => s.groceryItemsMaster);
  const groceryDraft = useGastosStore((s) => s.groceryDraft);
  const saveGroceryDraft = useGastosStore((s) => s.saveGroceryDraft);
  const clearGroceryDraft = useGastosStore((s) => s.clearGroceryDraft);

  // Load from draft if not editing and draft exists
  const getInitialItems = (): GroceryItem[] => {
    if (editingList?.items?.length) return editingList.items;
    if (!editingList && groceryDraft?.items?.length) return groceryDraft.items;
    return [{ id: uuidv4(), name: '', unitPrice: 0, quantity: 1 }];
  };

  const getInitialName = (): string => {
    if (editingList?.name) return editingList.name;
    if (!editingList && groceryDraft?.listName) return groceryDraft.listName;
    return '';
  };

  // Tipo de compra: se estiver editando, usa o salvo; senão default Supermercado
  const initialType = editingList?.purchaseType || 'Supermercado';
  const isInitialCustom = !!editingList && !PURCHASE_TYPES.includes(initialType as (typeof PURCHASE_TYPES)[number]);
  const [purchaseType, setPurchaseType] = useState<string>(isInitialCustom ? 'Outros' : initialType);
  const [customType, setCustomType] = useState<string>(isInitialCustom ? initialType : '');

  const [listName, setListName] = useState(getInitialName);
  const [items, setItems] = useState<GroceryItem[]>(getInitialItems);
  const [activeAutocomplete, setActiveAutocomplete] = useState<string | null>(null);
  const [autocompleteFilter, setAutocompleteFilter] = useState('');
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Save draft whenever items or listName change (only for new lists, not editing)
  useEffect(() => {
    if (editingList) return; // Don't save draft when editing existing list
    // Only save if there's meaningful content
    const hasContent = listName.trim() || items.some(i => i.name.trim() || i.unitPrice > 0);
    if (hasContent) {
      saveGroceryDraft({
        listName,
        items,
        updatedAt: new Date().toISOString(),
      });
    }
  }, [items, listName, editingList, saveGroceryDraft]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setActiveAutocomplete(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addItem = () => {
    setItems([...items, { id: uuidv4(), name: '', unitPrice: 0, quantity: 1 }]);
  };

  const updateItem = useCallback((id: string, field: keyof GroceryItem, value: string | number) => {
    setItems(prev => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }, []);

  const removeItem = (id: string) => {
    if (items.length === 1) {
      setItems([{ id: uuidv4(), name: '', unitPrice: 0, quantity: 1 }]);
    } else {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const selectAutocompleteItem = (itemId: string, name: string) => {
    updateItem(itemId, 'name', name);
    setActiveAutocomplete(null);
    setAutocompleteFilter('');
  };

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const handleFinish = async () => {
    const validItems = items.filter((item) => item.name.trim() && item.unitPrice > 0 && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Adicione ao menos um item', {
        description: 'Preencha nome, preço e quantidade de todos os itens.',
      });
      return;
    }

    const hasEmpty = items.some(
      (item) => !item.name.trim() || item.unitPrice <= 0 || item.quantity <= 0
    );
    if (hasEmpty) {
      toast.error('Preencha todos os itens', {
        description: 'Remova itens vazios ou preencha todos os campos.',
      });
      return;
    }

    const resolvedType =
      purchaseType === 'Outros' && customType.trim()
        ? customType.trim()
        : purchaseType;

    const name =
      listName.trim() ||
      new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date());

    try {
      if (editingList) {
        await updateGroceryList(editingList.id, {
          name,
          purchaseType: resolvedType,
          items,
          total,
        });
        toast.success('Compra atualizada com sucesso!');
      } else {
        await addGroceryList({
          date: new Date().toISOString(),
          name,
          purchaseType: resolvedType,
          items,
          total,
        });
        const newNames = items
          .map((item) => item.name.trim())
          .filter((n) => n.length > 0);
        await addMasterItems(newNames);
        // Clear draft after finalizing
        await clearGroceryDraft();
        toast.success('Compra finalizada com sucesso!');
      }
      onBack();
    } catch {
      toast.error('Erro ao salvar compra', { description: 'Tente novamente.' });
    }
  };

  const handleBack = async () => {
    // If not editing and has content, save as draft before going back
    if (!editingList) {
      const hasContent = listName.trim() || items.some(i => i.name.trim() || i.unitPrice > 0);
      if (hasContent) {
        await saveGroceryDraft({
          listName,
          items,
          updatedAt: new Date().toISOString(),
        });
        toast.success('Rascunho salvo!', { description: 'Seus itens foram salvos para continuar depois.' });
      }
    }
    onBack();
  };

  const filteredMasterItems = groceryItemsMaster.filter((name) =>
    name.toLowerCase().includes(autocompleteFilter.toLowerCase())
  );

  return (
    <div className="p-4 pb-28 space-y-4 hide-scrollbar overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl hover:bg-white/[0.04]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-bold text-foreground tracking-tight">
          {editingList ? 'Editar Compra' : 'Nova Compra'}
        </h2>
      </div>

      {/* Draft indicator */}
      {!editingList && groceryDraft && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/10 animate-fade-in">
          <Save className="h-3.5 w-3.5 text-primary shrink-0" />
          <p className="text-[11px] text-primary font-medium">
            Rascunho recuperado — seus itens foram restaurados automaticamente
          </p>
        </div>
      )}

      {/* Purchase Type */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Tipo de Compra</Label>
        <div className="grid grid-cols-3 gap-2">
          {PURCHASE_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              variant={purchaseType === type ? 'default' : 'outline'}
              onClick={() => setPurchaseType(type)}
              className={
                purchaseType === type
                  ? 'btn-primary h-9 text-xs px-2'
                  : 'btn-ghost-premium h-9 text-xs px-2'
              }
            >
              {type}
            </Button>
          ))}
        </div>
        {purchaseType === 'Outros' && (
          <Input
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            className="h-10 field-dark text-foreground animate-fade-in"
            placeholder="Especifique o tipo de compra"
          />
        )}
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Nome da Compra (opcional)</Label>
        <Input
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          className="h-11 field-dark text-foreground"
          placeholder="Usa data/hora se vazio"
        />
      </div>

      {/* Items */}
      <div className="space-y-3">
        <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Itens da Compra</Label>
        {items.map((item, index) => (
          <Card key={item.id} className="premium-card">
            <CardContent className="pt-4 pb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Item {index + 1}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeItem(item.id)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/8 rounded-lg"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Name with autocomplete */}
              <div className="relative" ref={activeAutocomplete === item.id ? autocompleteRef : undefined}>
                <Input
                  value={item.name}
                  onChange={(e) => {
                    updateItem(item.id, 'name', e.target.value);
                    setAutocompleteFilter(e.target.value);
                    if (e.target.value.length > 0) {
                      setActiveAutocomplete(item.id);
                    } else {
                      setActiveAutocomplete(null);
                    }
                  }}
                  onFocus={() => {
                    if (item.name.length > 0) {
                      setActiveAutocomplete(item.id);
                      setAutocompleteFilter(item.name);
                    }
                  }}
                  className="h-10 field-dark text-foreground text-sm"
                  placeholder="Nome do produto"
                />
                {activeAutocomplete === item.id && filteredMasterItems.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-32 overflow-y-auto custom-scrollbar autocomplete-dropdown">
                    {filteredMasterItems.slice(0, 5).map((name) => (
                      <button
                        key={name}
                        onClick={() => selectAutocompleteItem(item.id, name)}
                        className="w-full text-left px-3 py-2 text-sm text-foreground autocomplete-item transition-colors"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-[1fr_90px] gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Preço Unit.</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={item.unitPrice || ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\./g, '').replace(',', '.');
                      const val = parseFloat(raw);
                      updateItem(item.id, 'unitPrice', isNaN(val) ? 0 : val);
                    }}
                    className="h-10 field-dark text-foreground text-sm"
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Qtd</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={item.quantity || ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      if (raw === '') {
                        updateItem(item.id, 'quantity', 0);
                      } else {
                        const val = parseInt(raw, 10);
                        updateItem(item.id, 'quantity', isNaN(val) ? 0 : val);
                      }
                    }}
                    onBlur={() => {
                      // Enforce minimum of 1 on blur
                      if (!item.quantity || item.quantity < 1) {
                        updateItem(item.id, 'quantity', 1);
                      }
                    }}
                    className="h-10 field-dark text-foreground text-sm"
                    placeholder="1"
                  />
                </div>
              </div>
              {item.unitPrice > 0 && item.quantity > 0 && (
                <p className="text-xs text-[#00d4ff] text-right font-medium">
                  Subtotal: {formatCurrency(item.unitPrice * item.quantity)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Item Button */}
      <Button
        variant="outline"
        onClick={addItem}
        className="w-full h-11 btn-ghost-premium"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Item
      </Button>

      {/* Total */}
      <Card className="premium-card-accent">
        <CardContent className="pt-6">
          <div className="text-center mb-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Total da Compra</p>
            <p className="text-3xl font-bold text-primary tracking-tight">{formatCurrency(total)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Fixed bottom finish button */}
      <div className="fixed bottom-16 left-0 right-0 p-4 pb-safe glass-header border-t border-white/[0.05] z-40">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleFinish}
            className="w-full h-12 btn-primary text-base"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {editingList ? 'Salvar Alterações' : 'Finalizar Compra'}
          </Button>
        </div>
      </div>
    </div>
  );
}
