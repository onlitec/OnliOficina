import React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
<<<<<<< HEAD
import { DateRange } from 'react-day-picker';
=======
>>>>>>> 0383991 (Remove opção de cadastro da página de login - agora o cadastro será feito via API ou página de configurações)
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

<<<<<<< HEAD
interface DateRangePickerProps {
  date?: DateRange;
  onDateChange?: (date: DateRange | undefined) => void;
=======
export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
>>>>>>> 0383991 (Remove opção de cadastro da página de login - agora o cadastro será feito via API ou página de configurações)
  placeholder?: string;
  className?: string;
}

export function DateRangePicker({
<<<<<<< HEAD
  date,
  onDateChange,
  placeholder = "Selecione um período",
  className,
}: DateRangePickerProps) {
=======
  value,
  onChange,
  placeholder = "Selecione um período",
  className,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(value);

  React.useEffect(() => {
    setDate(value);
  }, [value]);

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    onChange?.(range);
  };

>>>>>>> 0383991 (Remove opção de cadastro da página de login - agora o cadastro será feito via API ou página de configurações)
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
<<<<<<< HEAD
              "w-full justify-start text-left font-normal",
=======
              "w-[300px] justify-start text-left font-normal",
>>>>>>> 0383991 (Remove opção de cadastro da página de login - agora o cadastro será feito via API ou página de configurações)
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(date.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(date.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
<<<<<<< HEAD
            onSelect={onDateChange}
=======
            onSelect={handleSelect}
>>>>>>> 0383991 (Remove opção de cadastro da página de login - agora o cadastro será feito via API ou página de configurações)
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}