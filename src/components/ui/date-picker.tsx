'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type PickerMode = 'date' | 'monthYear';

interface DatePickerProps {
  value?: Date | null;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  fromYear?: number;
  toYear?: number;
  maxDate?: Date;
  pickerMode?: PickerMode; // 'date' (default) or 'monthYear'
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
  disabled = false,
  fromYear = 1950,
  toYear = new Date().getFullYear() + 10,
  maxDate = new Date(),
  pickerMode = 'date',
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const displayValue = () => {
    if (!value) return null;
    return pickerMode === 'monthYear' ? format(value, 'MMM yyyy') : format(value, 'MMM d, yyyy');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            // glassmorphic AI-style button
            'w-full justify-start text-left font-normal backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 dark:bg-gray-900/30 dark:hover:bg-gray-900/40 text-white',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-80" />
          {value ? displayValue() : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0 rounded-xl shadow-xl border border-white/20 backdrop-blur-lg bg-white/20 dark:bg-gray-900/60"
        align="start"
      >
        <Calendar
          mode="single"
          selected={value || undefined}
          onSelect={(date) => {
            if (pickerMode === 'monthYear' && date) {
              // force 1st of month for consistency
              const adjusted = new Date(date);
              adjusted.setDate(1);
              onChange(adjusted);
            } else {
              onChange(date || undefined);
            }
            setOpen(false);
          }}
          disabled={(date) =>
            date > maxDate ||
            date < new Date(fromYear, 0, 1) ||
            date > new Date(toYear, 11, 31)
          }
          initialFocus
          captionLayout="dropdown"
          fromYear={fromYear}
          toYear={toYear}
          showOutsideDays={pickerMode === 'date'}
          classNames={{
            nav: 'hidden',
            caption_label: 'hidden',
            dropdown: 'bg-transparent text-white border border-white/40 rounded-md py-1 px-2 focus:outline-none',
            dropdown_year: 'bg-transparent text-white border border-white/40 rounded-md py-1 px-2 focus:outline-none',
            button: 'hover:bg-primary/10 rounded-lg',
            months: 'flex flex-col space-y-4',
            day: cn('rounded-lg', 'aria-selected:!bg-primary aria-selected:text-primary-foreground'),
            day_selected: 'bg-primary text-primary-foreground hover:bg-primary/90',
            day_today: 'ring-2 ring-primary',
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
