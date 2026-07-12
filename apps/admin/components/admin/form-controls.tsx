import type { SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  name: string;
  options: Array<{ label: string; value: string }>;
  error?: string;
};

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
  error?: string;
};

type CheckboxFieldProps = {
  label: string;
  name: string;
  defaultChecked?: boolean;
  helper?: string;
};

export function SelectField({ label, name, options, error, className, ...props }: SelectFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink">
      {label}
      <select
        name={name}
        className={`rounded-md border border-ink/15 bg-ivory px-3 py-2 outline-none transition focus:border-rust ${className || ""}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs font-medium text-rust">{error}</span> : null}
    </label>
  );
}

export function TextareaField({ label, name, error, className, ...props }: TextareaFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink">
      {label}
      <textarea
        name={name}
        className={`rounded-md border border-ink/15 bg-ivory px-3 py-2 outline-none transition focus:border-rust ${className || ""}`}
        {...props}
      />
      {error ? <span className="text-xs font-medium text-rust">{error}</span> : null}
    </label>
  );
}

export function CheckboxField({ label, name, defaultChecked, helper }: CheckboxFieldProps) {
  return (
    <label className="flex items-start gap-3 rounded-md border border-ink/10 bg-ivory px-3 py-3 text-sm text-ink">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="mt-1 h-4 w-4 accent-rust" />
      <span>
        <span className="font-semibold">{label}</span>
        {helper ? <span className="mt-1 block text-xs leading-5 text-ink/55">{helper}</span> : null}
      </span>
    </label>
  );
}
