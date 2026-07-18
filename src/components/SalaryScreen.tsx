'use client';

import { useState } from 'react';
import { useGastosStore, formatCurrency, formatDate } from '@/lib/store';
import type { MonthlySalary } from '@/lib/types';
import MonthSelector from './MonthSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, Plus, Trash2, Wallet, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

function formatSalaryForInput(salary: number): string {
  if (salary > 0) {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(salary);
  }
  return '';
}

export default function SalaryScreen() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [salaryInput, setSalaryInput] = useState(() => {
    const salaries = useGastosStore.getState().monthlySalaries;
    const found = salaries.find(
      (s) => s.month === now.getMonth() + 1 && s.year === now.getFullYear()
    );
    return formatSalaryForInput(found?.salary || 0);
  });
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [extraName, setExtraName] = useState('');
  const [extraValue, setExtraValue] = useState('');
  const [extraDate, setExtraDate] = useState(new Date().toISOString().split('T')[0]);

  const monthlySalaries = useGastosStore((s) => s.monthlySalaries);
  const saveSalary = useGastosStore((s) => s.saveSalary);
  const addExtra = useGastosStore((s) => s.addExtra);
  const removeExtra = useGastosStore((s) => s.removeExtra);

  const currentSalary: MonthlySalary | undefined = monthlySalaries.find(
    (s) => s.month === month && s.year === year
  );

  const handleMonthChange = (newMonth: number, newYear: number) => {
    const found = monthlySalaries.find(
      (s) => s.month === newMonth && s.year === newYear
    );
    setSalaryInput(formatSalaryForInput(found?.salary || 0));
    setMonth(newMonth);
    setYear(newYear);
  };

  const handleSaveSalary = async () => {
    const raw = salaryInput.replace(/\./g, '').replace(',', '.');
    const value = parseFloat(raw);
    if (isNaN(value) || value < 0) {
      toast.error('Valor inválido', { description: 'Insira um valor válido para o salário.' });
      return;
    }
    try {
      await saveSalary(month, year, value);
      setSalaryInput(formatSalaryForInput(value));
      toast.success('Salário salvo com sucesso!');
    } catch {
      toast.error('Erro ao salvar salário', { description: 'Tente novamente.' });
    }
  };

  const handleAddExtra = async () => {
    const raw = extraValue.replace(/\./g, '').replace(',', '.');
    const value = parseFloat(raw);
    if (!extraName.trim() || isNaN(value) || value <= 0) {
      toast.error('Preencha todos os campos', { description: 'Nome e valor são obrigatórios.' });
      return;
    }
    try {
      await addExtra(month, year, {
        name: extraName.trim(),
        value,
        date: new Date(extraDate + 'T12:00:00').toISOString(),
      });
      setExtraName('');
      setExtraValue('');
      setExtraDate(new Date().toISOString().split('T')[0]);
      setShowExtraForm(false);
      toast.success('Extra adicionado com sucesso!');
    } catch {
      toast.error('Erro ao adicionar extra', { description: 'Tente novamente.' });
    }
  };

  const handleRemoveExtra = async (extraId: string) => {
    try {
      await removeExtra(month, year, extraId);
      toast.success('Extra removido com sucesso!');
    } catch {
      toast.error('Erro ao remover extra', { description: 'Tente novamente.' });
    }
  };

  const totalExtras = (currentSalary?.extras || []).reduce((sum, e) => sum + e.value, 0);
  const totalMonth = (currentSalary?.salary || 0) + totalExtras;

  return (
    <div className="p-4 pb-24 space-y-4 hide-scrollbar overflow-y-auto">
      {/* Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-lg font-bold text-foreground tracking-tight">Salário & Extras</h2>
        <MonthSelector month={month} year={year} onChange={handleMonthChange} />
      </div>

      {/* Salary Card */}
      <Card className="premium-card-accent">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
            <div className="h-8 w-8 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            Salário Líquido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Valor do Salário</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                type="text"
                inputMode="decimal"
                value={salaryInput}
                onChange={(e) => setSalaryInput(e.target.value)}
                className="pl-9 h-12 field-dark text-foreground text-base"
                placeholder="0,00"
              />
            </div>
          </div>
          <Button
            onClick={handleSaveSalary}
            className="w-full h-11 btn-primary"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Salário
          </Button>
        </CardContent>
      </Card>

      {/* Extras Section */}
      <Card className="premium-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
              <div className="h-8 w-8 rounded-lg bg-[#00d4ff]/8 border border-[#00d4ff]/15 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-[#00d4ff]" />
              </div>
              Extras do Mês
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowExtraForm(!showExtraForm)}
              className="btn-ghost-premium h-8 text-xs px-3"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Extra Form */}
          {showExtraForm && (
            <div className="space-y-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-fade-in">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Nome</Label>
                <Input
                  value={extraName}
                  onChange={(e) => setExtraName(e.target.value)}
                  className="h-10 field-dark text-foreground"
                  placeholder="Ex: Bônus, Freelance..."
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Valor (R$)</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={extraValue}
                    onChange={(e) => setExtraValue(e.target.value)}
                    className="h-10 field-dark text-foreground"
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Data</Label>
                  <Input
                    type="date"
                    value={extraDate}
                    onChange={(e) => setExtraDate(e.target.value)}
                    className="h-10 field-dark text-foreground"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAddExtra}
                  className="flex-1 h-10 btn-primary text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Extra
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowExtraForm(false)}
                  className="h-10 btn-ghost-premium text-sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Extras List */}
          {currentSalary && currentSalary.extras.length > 0 ? (
            <div className="space-y-2">
              {currentSalary.extras.map((extra) => (
                <div
                  key={extra.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] transition-colors hover:border-[#00d4ff]/15"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{extra.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(extra.date)}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm font-semibold text-[#00d4ff]">
                      {formatCurrency(extra.value)}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveExtra(extra.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/8 rounded-lg shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum extra cadastrado neste mês
            </p>
          )}
        </CardContent>
      </Card>

      {/* Total Card */}
      <Card className="premium-card-accent">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Total do Mês</p>
            <p className="text-3xl font-bold text-primary tracking-tight">
              {formatCurrency(totalMonth)}
            </p>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
              <span>Salário: {formatCurrency(currentSalary?.salary || 0)}</span>
              <span className="text-white/10">|</span>
              <span>Extras: {formatCurrency(totalExtras)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
