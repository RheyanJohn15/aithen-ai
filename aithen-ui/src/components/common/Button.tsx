'use client';

import { forwardRef, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    leftIcon,
    rightIcon,
    children, 
    className = '', 
    disabled,
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'px-2.5 py-1 text-xs',
      md: 'px-3 py-1.5 text-sm',
      lg: 'px-4 py-2 text-sm',
    };

    const variantClasses = {
      primary: `
        bg-[var(--color-aithen-teal)] hover:bg-[var(--color-aithen-teal-dark)]
        text-white
        shadow-sm hover:shadow-md
      `,
      secondary: `
        bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
        text-gray-900 dark:text-white
      `,
      outline: `
        border border-gray-300 dark:border-gray-600
        bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
        text-gray-900 dark:text-white
      `,
      ghost: `
        hover:bg-gray-100 dark:hover:bg-gray-800
        text-gray-700 dark:text-gray-300
      `,
      danger: `
        bg-red-600 hover:bg-red-700
        text-white
        shadow-sm hover:shadow-md
      `,
    };

    const baseClasses = `
      inline-flex items-center justify-center space-x-1.5
      font-medium rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)]/30 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      ${className}
    `;

    return (
      <button
        ref={ref}
        className={baseClasses}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span>{leftIcon}</span>}
            {children}
            {rightIcon && <span>{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

