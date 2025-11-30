'use client';

import { forwardRef, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  onRightIconClick?: () => void;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon: LeftIcon, rightIcon: RightIcon, onRightIconClick, helperText, className = '', ...props }, ref) => {
    const baseClasses = `
      w-full px-2.5 py-1.5 text-sm
      border rounded-lg
      bg-white dark:bg-gray-700
      text-gray-900 dark:text-white
      placeholder-gray-400 dark:placeholder-gray-500
      focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)]/30 focus:border-[var(--color-aithen-teal)]
      transition-all duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
      ${LeftIcon ? 'pl-8' : ''}
      ${RightIcon ? 'pr-8' : ''}
      ${
        error
          ? 'border-red-300 dark:border-red-600 focus:ring-red-500/30 focus:border-red-500'
          : 'border-gray-300 dark:border-gray-600'
      }
      ${className}
    `;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {LeftIcon && (
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <LeftIcon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            </div>
          )}
          <input
            ref={ref}
            className={baseClasses}
            {...props}
          />
          {RightIcon && (
            <div 
              className={`absolute inset-y-0 right-0 pr-2.5 flex items-center ${onRightIconClick ? 'cursor-pointer' : 'pointer-events-none'}`}
              onClick={onRightIconClick}
            >
              <RightIcon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center space-x-1">
            <span>{error}</span>
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

