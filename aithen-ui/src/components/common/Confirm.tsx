'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, Save, Archive, XCircle, CheckCircle } from 'lucide-react';
import Button from './Button';

export type ConfirmAction = 'delete' | 'save' | 'archive' | 'custom';

export interface ConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: string;
  description?: string;
  action?: ConfirmAction;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

const actionConfig: Record<ConfirmAction, { icon: typeof AlertTriangle; defaultTitle: string; defaultVariant: 'danger' | 'warning' | 'info' | 'success'; defaultConfirmLabel: string }> = {
  delete: {
    icon: Trash2,
    defaultTitle: 'Delete',
    defaultVariant: 'danger',
    defaultConfirmLabel: 'Delete',
  },
  save: {
    icon: Save,
    defaultTitle: 'Save Changes',
    defaultVariant: 'info',
    defaultConfirmLabel: 'Save',
  },
  archive: {
    icon: Archive,
    defaultTitle: 'Archive',
    defaultVariant: 'warning',
    defaultConfirmLabel: 'Archive',
  },
  custom: {
    icon: AlertTriangle,
    defaultTitle: 'Confirm Action',
    defaultVariant: 'info',
    defaultConfirmLabel: 'Confirm',
  },
};

const variantStyles = {
  danger: {
    iconColor: 'text-red-600 dark:text-red-500',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
  },
  warning: {
    iconColor: 'text-amber-600 dark:text-amber-500',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  info: {
    iconColor: 'text-blue-600 dark:text-blue-500',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  success: {
    iconColor: 'text-emerald-600 dark:text-emerald-500',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
};

export default function Confirm({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  action = 'custom',
  confirmLabel,
  cancelLabel = 'Cancel',
  variant,
  isLoading = false,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
}: ConfirmProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const config = actionConfig[action];
  const finalVariant = variant || config.defaultVariant;
  const finalTitle = title || config.defaultTitle;
  const finalConfirmLabel = confirmLabel || config.defaultConfirmLabel;
  const styles = variantStyles[finalVariant];
  const IconComponent = config.icon;

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, isLoading, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && !isLoading && e.target === overlayRef.current) {
      onClose();
    }
  };

  // Handle confirm
  const handleConfirm = async () => {
    if (isLoading) return;
    await onConfirm();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black/60 dark:bg-black/80
        backdrop-blur-sm
        animate-in fade-in duration-200
      `}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        ref={modalRef}
        className={`
          bg-white dark:bg-gray-900
          rounded-2xl shadow-2xl
          w-full max-w-md
          animate-in zoom-in-95 duration-200
          flex flex-col
          border border-gray-200 dark:border-gray-800
          overflow-hidden
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Content */}
        <div className="px-6 py-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`flex-shrink-0 w-14 h-14 rounded-full ${styles.iconBg} flex items-center justify-center ring-4 ring-opacity-10 ${
              finalVariant === 'danger' ? 'ring-red-500' :
              finalVariant === 'warning' ? 'ring-yellow-500' :
              finalVariant === 'info' ? 'ring-blue-500' :
              'ring-green-500'
            }`}>
              <IconComponent className={`w-7 h-7 ${styles.iconColor}`} strokeWidth={2} />
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <h3
                id="confirm-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2 leading-tight"
              >
                {finalTitle}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                {message}
              </p>
              {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="min-w-[80px]"
            suppressHydrationWarning
          >
            {cancelLabel}
          </Button>
          <Button
            variant={finalVariant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            disabled={isLoading}
            isLoading={isLoading}
            className="min-w-[80px]"
            suppressHydrationWarning
          >
            {finalConfirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
