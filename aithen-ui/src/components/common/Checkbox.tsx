'use client';

import { forwardRef } from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <label className={`
          flex items-start space-x-2 cursor-pointer
          ${props.disabled ? 'cursor-not-allowed opacity-50' : ''}
          ${className}
        `}>
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              ref={ref}
              type="checkbox"
              className="
                sr-only
              "
              {...props}
            />
            <div className={`
              w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200
              ${
                props.checked
                  ? 'bg-[var(--color-aithen-teal)] border-[var(--color-aithen-teal)]'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
              }
              ${
                error
                  ? 'border-red-300 dark:border-red-600'
                  : ''
              }
              ${props.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              group-hover:border-[var(--color-aithen-teal)]/50
            `}>
              {props.checked && (
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              )}
            </div>
          </div>
          {label && (
            <div className="flex-1">
              <span className="text-sm text-gray-900 dark:text-white">
                {label}
                {props.required && <span className="text-red-500 ml-0.5">*</span>}
              </span>
              {helperText && !error && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
              )}
            </div>
          )}
        </label>
        {error && (
          <p className="mt-1 ml-6 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;

