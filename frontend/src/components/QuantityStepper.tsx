import { Minus, Plus } from "lucide-react";

type QuantityStepperProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

export function QuantityStepper({ value, min = 1, max = 99, onChange }: QuantityStepperProps) {
  return (
    <div className="inline-grid h-12 grid-cols-[44px_60px_44px] overflow-hidden border border-slate-300 bg-white">
      <button
        className="grid place-items-center border-r border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:text-slate-300"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        className="text-center text-sm font-medium text-slate-900 outline-none"
        value={value}
        onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || min)))}
      />
      <button
        className="grid place-items-center border-l border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:text-slate-300"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
