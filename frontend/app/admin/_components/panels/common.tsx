import CardDense from "@/components/ui/cards/CardDense";
import {ReactNode} from "react";

export function ResourcePanel({
  form,
  list,
}: {
  form: ReactNode;
  list: ReactNode;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
      <CardDense>{form}</CardDense>
      <CardDense>{list}</CardDense>
    </div>
  );
}

export function InputField({
  label,
  value,
  onChange,
  type = "text",
  required,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  helper?: string;
}) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none"
        required={required}
      />
      {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </label>
  );
}

export function TextareaField({
  label,
  value,
  onChange,
  rows = 4,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none"
        required={required}
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: {label: string; value: string}[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
