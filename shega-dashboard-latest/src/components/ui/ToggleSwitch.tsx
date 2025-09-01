'use client';

import { useId } from 'react';

export default function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="inline-flex items-center gap-2 select-none">
      {label ? <span className="text-sm text-gray-700">{label}</span> : null}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        className={`w-11 h-6 rounded-full p-0.5 transition border ${
          checked ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-200 border-gray-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`block h-5 w-5 bg-white rounded-full shadow transform transition ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </label>
  );
}
