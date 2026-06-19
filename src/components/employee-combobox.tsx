"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type EmployeeComboboxOption = {
  id: number;
  fullName: string;
  department: string;
};

type EmployeeComboboxProps = {
  employees: EmployeeComboboxOption[];
  value: string;
  onChange: (employeeId: string) => void;
  disabled?: boolean;
  loading?: boolean;
  loadError?: boolean;
  id?: string;
};

function formatEmployeeLabel(employee: EmployeeComboboxOption): string {
  return employee.department
    ? `${employee.fullName} — ${employee.department}`
    : employee.fullName;
}

function resolvePlaceholder({
  loading,
  loadError,
  employees,
}: Pick<EmployeeComboboxProps, "loading" | "loadError" | "employees">): string {
  if (loading) {
    return "Loading employees...";
  }

  if (loadError) {
    return "Unable to load employees";
  }

  if (employees.length === 0) {
    return "No employees found";
  }

  return "Search and select your name";
}

export function EmployeeCombobox({
  employees,
  value,
  onChange,
  disabled = false,
  loading = false,
  loadError = false,
  id = "employee",
}: EmployeeComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedEmployee =
    employees.find((employee) => String(employee.id) === value) ?? null;
  const placeholder = resolvePlaceholder({ loading, loadError, employees });
  const isDisabled = disabled || loading || loadError || employees.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          disabled={isDisabled}
          className={cn(
            "h-12 w-full justify-between rounded-[var(--radius-input)] border-input bg-card px-3 text-base font-normal text-foreground md:text-sm",
            !selectedEmployee && "text-muted-foreground"
          )}
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {selectedEmployee ? formatEmployeeLabel(selectedEmployee) : placeholder}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command>
          <CommandInput
            placeholder="Search employees..."
            className="h-12 text-base md:text-sm"
          />
          <CommandList id={`${id}-listbox`}>
            <CommandEmpty>No employees found.</CommandEmpty>
            <CommandGroup>
              {employees.map((employee) => {
                const label = formatEmployeeLabel(employee);
                const isSelected = value === String(employee.id);

                return (
                  <CommandItem
                    key={employee.id}
                    value={`${employee.fullName} ${employee.department}`}
                    className="min-h-12 py-3 text-base md:text-sm"
                    onSelect={() => {
                      onChange(String(employee.id));
                      setOpen(false);
                    }}
                  >
                    <span className="truncate">{label}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
