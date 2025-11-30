'use client';

import { ReactNode } from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  required?: boolean;
  error?: boolean;
}

export default function Label({ children, required, error, className = '', ...props }: LabelProps) {
  return (
    <label
      className={`
        block text-sm font-medium mb-1
        ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}
        ${className}
      `}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

