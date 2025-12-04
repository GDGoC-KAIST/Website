"use client";

import {ChangeEvent} from "react";

interface CharCountTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  name?: string;
}

export default function CharCountTextarea({
  label,
  value,
  onChange,
  placeholder,
  maxLength = 600,
  disabled,
  name,
}: CharCountTextareaProps) {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value.slice(0, maxLength));
  };

  const isLimitReached = value.length >= maxLength;

  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
      {label}
      <div className="relative">
        <textarea
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          className="min-h-[140px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-50"
        />
        <span
          className={`absolute bottom-2 right-3 text-xs font-semibold ${
            isLimitReached ? "text-red-500" : "text-gray-400"
          }`}
        >
          {value.length} / {maxLength}
        </span>
      </div>
    </label>
  );
}
