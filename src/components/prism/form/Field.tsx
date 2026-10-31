import React from 'react';
import { cn } from '../utils/cn';

/** Field — label + control + optional hint/error, using the `.field-*` classes. */
export interface FieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, hint, error, required, children, className }: FieldProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={htmlFor} className="field-label">
          {label}
          {required && <span style={{ color: 'var(--red)' }}> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="type-xs text-tertiary-token mt-1.5">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
