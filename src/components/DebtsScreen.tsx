'use client';

import { useState } from 'react';
import {
  useGastosStore,
  formatCurrency,
  getDebtEndDate,
  getMonthYearLabel,
  getInstallmentSchedule,
} from '@/lib/store';
import type { Debt } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DebtsScreen() {
  const debts = useGastosStore((s) => s.debts);
  const addDebt = useGastosStore((s) => s.addDebt);
  const deleteDebt = useGastosStore((s) => s.deleteDebt);
  const payDebtInstallment = useGastosStore((s) => s.payDebtInstallment);

  const [showNewDebt, setShowNewDebt] = useState(false);
  const [showPaidOff, setShowPaidOff] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [payConfirm, setPayConfirm] = useState<string | null>(null);

  // New debt form
  const [desc, setDesc] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [installmentType, setInstallmentType] = useState<'single' | 'installments'>('single');
  const [numInstallments, setNumInstallments] = useState('2');

  const pendingDebts = debts.filter((d) => d.paidInstallments < d.installments);
  const paidOffDebts = debts.filter((d) => d.paidInstallments >= d.installments);

  const resetForm = () => {
    setDesc('');
    setTotalValue('');
    setInstallmentType('single');
    setNumInstallments('2');
  };

  const handleAddDebt = async () => {
    const raw = totalValue.replace(/\./g, '').replace(',', '.');
    const value = parseFloat(raw);
    if (!desc.trim() || isNaN(value) || value <= 0) {
      toast.error('Preencha todos os campos', { description: 'Informe a descrição e o valor total.' });
      return;
    }
    const installments = installmentType === 'single' ? 1 : Math.max(2, parseInt(numInstallments) || 2);
    const installmentValue = value / installments;
    const startDate = new Date().toISOString();

    try {
      await addDebt({
        description: desc.trim(),
        totalValue: value,
        installments,
        installmentValue,
        startDate,
        dueDate: getDebtEndDate(startDate, installments),
      });
      resetForm();
      setShowNewDebt(false);
      toast.success('Dívida cadastrada com sucesso!');
    } catch {
      toast.error('Erro ao cadastrar dívida', { description: 'Tente novamente.' });
    }
  };

  const handlePayInstallment = async (debtId: string) => {
    try {
      await payDebtInstallment(debtId);
      setPayConfirm(null);
      const debt = debts.find((d) => d.id === debtId);
      if (debt && debt.paidInstallments + 1 >= debt.installments) {
        toast.success('Parabéns! Dívida quitada!', { description: 'Todas as parcelas foram pagas.' });
      } else {
        toast.success('Parcela paga com sucesso!');
      }
    } catch {
      toast.error('Erro ao pagar parcela', { description: 'Tente novamente.' });
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    try {
      await deleteDebt(debtId);
      setDeleteConfirm(null);
      toast.success('Dívida excluída com sucesso!');
    } catch {
      toast.error('Erro ao excluir dívida', { description: 'Tente novamente.' });
    }
  };

  const totalPending = pendingDebts.reduce(
    (sum, d) => sum + d.installmentValue * (d.installments - d.paidInstallments),
    0
  );

  // Preview do formulário (valor da parcela e mês de término)
  const previewValue = parseFloat(totalValue.replace(/\./g, '').replace(',', '.')) || 0;
  const previewInstallments =
    installmentType === 'single' ? 1 : Math.max(2, parseInt(numInstallments) || 2);

  return (
    <div className="p-4 pb-24 space-y-4 hide-scrollbar overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground tracking-tight">Dívidas</h2>
        <Button
          size="sm"
          onClick={() => setShowNewDebt(true)}
          className="btn-primary h-9 text-sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nova Dívida
        </Button>
      </div>

      {/* Summary */}
      <Card className="premium-card-danger">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Total Pendente</p>
            <p className="text-3xl font-bold text-destructive tracking-tight">
              {formatCurrency(totalPending)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {pendingDebts.length} dívida{pendingDebts.length !== 1 ? 's' : ''} pendente{pendingDebts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pending Debts */}
      {pendingDebts.length > 0 ? (
        <div className="space-y-3">
          {pendingDebts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onPay={() => setPayConfirm(debt.id)}
              onDelete={() => setDeleteConfirm(debt.id)}
            />
          ))}
        </div>
      ) : (
        <Card className="premium-card">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma dívida pendente. Parabéns!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Paid Off Debts */}
      {paidOffDebts.length > 0 && (
        <div>
          <Button
            variant="ghost"
            onClick={() => setShowPaidOff(!showPaidOff)}
            className="w-full flex items-center justify-between text-muted-foreground hover:text-foreground p-3 h-auto rounded-xl hover:bg-white/[0.03]"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Dívidas Quitadas ({paidOffDebts.length})
            </span>
            {showPaidOff ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          {showPaidOff && (
            <div className="space-y-3 mt-2">
              {paidOffDebts.map((debt) => (
                <DebtCard
                  key={debt.id}
                  debt={debt}
                  onPay={() => {}}
                  onDelete={() => setDeleteConfirm(debt.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Debt Dialog */}
      <Dialog open={showNewDebt} onOpenChange={setShowNewDebt}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-[#111118] border-white/[0.06] text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              Nova Dívida
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Cadastre uma nova dívida ou compromisso financeiro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Descrição</Label>
              <Input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="h-10 field-dark text-foreground"
                placeholder="Ex: Cartão de crédito, Empréstimo..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Valor Total (R$)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                <Input
                  type="text"
                  inputMode="decimal"
                  value={totalValue}
                  onChange={(e) => setTotalValue(e.target.value)}
                  className="pl-9 h-10 field-dark text-foreground"
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Tipo</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={installmentType === 'single' ? 'default' : 'outline'}
                  onClick={() => setInstallmentType('single')}
                  className={
                    installmentType === 'single'
                      ? 'btn-primary flex-1 h-10'
                      : 'btn-ghost-premium flex-1 h-10'
                  }
                >
                  Parcela Única
                </Button>
                <Button
                  type="button"
                  variant={installmentType === 'installments' ? 'default' : 'outline'}
                  onClick={() => setInstallmentType('installments')}
                  className={
                    installmentType === 'installments'
                      ? 'btn-primary flex-1 h-10'
                      : 'btn-ghost-premium flex-1 h-10'
                  }
                >
                  Parcelado
                </Button>
              </div>
            </div>
            {installmentType === 'installments' && (
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Número de Parcelas</Label>
                <Input
                  type="number"
                  min="2"
                  value={numInstallments}
                  onChange={(e) => setNumInstallments(e.target.value)}
                  className="h-10 field-dark text-foreground"
                />
              </div>
            )}

            {/* Preview automático */}
            {previewValue > 0 && (
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Valor de cada parcela</span>
                  <span className="text-primary font-semibold">
                    {formatCurrency(previewValue / previewInstallments)}
                    <span className="text-muted-foreground font-normal">
                      {' '}× {previewInstallments}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {previewInstallments > 1 ? 'Termina em' : 'Vencimento'}
                  </span>
                  <span className="text-foreground font-medium">
                    {getMonthYearLabel(getDebtEndDate(new Date().toISOString(), previewInstallments))}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1 divider-subtle">
                  {previewInstallments > 1
                    ? `${previewInstallments} parcelas mensais a partir de ${getMonthYearLabel(new Date().toISOString())}.`
                    : `Pagamento único em ${getMonthYearLabel(new Date().toISOString())}.`}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => { resetForm(); setShowNewDebt(false); }}
              className="btn-ghost-premium w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddDebt}
              className="btn-primary w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-1" />
              Cadastrar Dívida
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Confirm Dialog */}
      <AlertDialog open={!!payConfirm} onOpenChange={() => setPayConfirm(null)}>
        <AlertDialogContent className="bg-[#111118] border-white/[0.06] text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Deseja registrar o pagamento desta parcela?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-ghost-premium">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => payConfirm && handlePayInstallment(payConfirm)}
              className="btn-primary"
            >
              Confirmar Pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-[#111118] border-white/[0.06] text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Dívida</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir esta dívida? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-ghost-premium">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteDebt(deleteConfirm)}
              className="bg-destructive text-white hover:bg-destructive/90 font-semibold"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DebtCard({
  debt,
  onPay,
  onDelete,
}: {
  debt: Debt;
  onPay: () => void;
  onDelete: () => void;
}) {
  const [showSchedule, setShowSchedule] = useState(false);
  const isPaid = debt.paidInstallments >= debt.installments;
  const progress =
    debt.installments > 0
      ? Math.round((debt.paidInstallments / debt.installments) * 100)
      : 0;

  return (
    <Card className={isPaid ? 'premium-card' : 'premium-card-danger'}>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <p className="text-sm font-medium text-foreground truncate">{debt.description}</p>
              {isPaid ? (
                <Badge className="badge-success shrink-0 text-[10px]">Quitada</Badge>
              ) : (
                <Badge className="badge-danger shrink-0 text-[10px]">Pendente</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Valor total: {formatCurrency(debt.totalValue)}</span>
              <span>Parcelas: {debt.paidInstallments}/{debt.installments}</span>
              <span>Valor parcela: {formatCurrency(debt.installmentValue)}</span>
              <span>
                {debt.installments > 1 ? 'Termina em' : 'Vencimento'}: {getMonthYearLabel(debt.dueDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {!isPaid && debt.installments > 1 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
              <span>Progresso</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-track h-1.5">
              <div
                className="progress-fill h-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Schedule toggle + list */}
        {debt.installments > 1 && (
          <div className="divider-subtle pt-3">
            <button
              type="button"
              onClick={() => setShowSchedule((v) => !v)}
              className="w-full flex items-center justify-between text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Cronograma de parcelas
              </span>
              {showSchedule ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
            {showSchedule && (
              <div className="mt-2 space-y-1 max-h-44 overflow-y-auto hide-scrollbar animate-fade-in">
                {getInstallmentSchedule(debt.startDate, debt.installments, debt.installmentValue).map(
                  (p) => {
                    const paid = p.index <= debt.paidInstallments;
                    return (
                      <div
                        key={p.index}
                        className="flex items-center justify-between text-xs py-1"
                      >
                        <span className="flex items-center gap-2 text-muted-foreground">
                          {paid ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          ) : (
                            <span className="h-3.5 w-3.5 rounded-full border border-white/15 shrink-0" />
                          )}
                          <span className={paid ? 'text-muted-foreground line-through' : 'text-foreground'}>
                            {p.index}/{debt.installments} — {p.label}
                          </span>
                        </span>
                        <span className={paid ? 'text-muted-foreground' : 'text-foreground font-medium'}>
                          {formatCurrency(p.value)}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {!isPaid && (
            <Button
              size="sm"
              onClick={onPay}
              className="flex-1 h-9 bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 hover:border-primary/25 font-medium text-xs rounded-lg transition-all"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Pagar Parcela
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/8 text-xs rounded-lg shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
