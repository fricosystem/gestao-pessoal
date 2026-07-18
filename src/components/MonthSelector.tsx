'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMonthName } from '@/lib/store';

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const YEARS = Array.from({ length: 11 }, (_, i) => 2020 + i);

interface MonthSelectorProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export default function MonthSelector({ month, year, onChange }: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={String(month)}
        onValueChange={(v) => onChange(Number(v), year)}
      >
        <SelectTrigger className="w-[120px] sm:w-[140px] h-9 text-xs sm:text-sm field-dark border-white/[0.08] text-foreground">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#16162a] border-white/[0.08] text-foreground">
          {MONTHS.map((m) => (
            <SelectItem key={m} value={String(m)} className="focus:bg-primary/8 focus:text-primary">
              {getMonthName(m)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(year)}
        onValueChange={(v) => onChange(month, Number(v))}
      >
        <SelectTrigger className="w-[85px] sm:w-[100px] h-9 text-xs sm:text-sm field-dark border-white/[0.08] text-foreground">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#16162a] border-white/[0.08] text-foreground">
          {YEARS.map((y) => (
            <SelectItem key={y} value={String(y)} className="focus:bg-primary/8 focus:text-primary">
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
