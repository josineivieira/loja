import { Minus, Plus } from "lucide-react";

type QuantityStepperProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

export function QuantityStepper({ value, min = 1, max = 99, onChange }: QuantityStepperProps) {
  return (
    <div className="inline-grid h-10 grid-cols-[40px_48px_40px] overflow-hidden rounded-md border border-slate-200">
      <button className="grid place-items-center hover:bg-mist disabled:text-slate-300" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} aria-label="Decrease quantity">
        <Minus className="h-4 w-4" />
      </button>
      <input className="border-x border-slate-200 text-center text-sm outline-none" value={value} onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || min)))} />
      <button className="grid place-items-center hover:bg-mist disabled:text-slate-300" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} aria-label="Increase quantity">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

