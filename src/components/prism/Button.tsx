import React from 'react';
import Link from 'next/link';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { cn } from './utils/cn';

/**
 * Prism Button. Renders the `.btn-primary` / `.btn-secondary` design-system
 * classes (defined under `.prism-light` in app/globals.css). One size, plus a compact `sm` for the nav. Renders a `next/link` when `href` is set, otherwise a `<button>`.
 *
 * Strict DS: emits only DS classes — no hex, no theme reads.
 */
export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  /** `sm` is for dense bars (the nav). Everything else uses the one default size. */
  size?: 'md' | 'sm';
  /** Leading icon. */
  icon?: LucideIcon;
  /** Trailing arrow (defaults on for primary CTAs). */
  showArrow?: boolean;
  /** Trailing icon (overrides arrow). */
  iconRight?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  href?: string;
  /**
   * Set for links to a downloadable file (zip, pdf, …) rather than an app route.
   * Renders a plain `<a>` instead of `next/link`, so the router never prefetches
   * the file on mount/hover and the browser's native download semantics apply.
   * Pass a string to suggest a filename, or `true` to use the server's default.
   */
  download?: boolean | string;
  onClick?: React.MouseEventHandler;
  type?: 'button' | 'submit' | 'reset';
  target?: string;
  rel?: string;
  className?: string;
  'aria-label'?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  showArrow = false,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  href,
  download,
  onClick,
  type = 'button',
  target,
  rel,
  className,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const cls = cn(variant === 'primary' ? 'btn-primary' : 'btn-secondary', size === 'sm' && 'btn-sm', className);
  const isDisabled = disabled || loading;

  const content = (
    <>
      {loading && <span className="spinner" aria-hidden />}
      {!loading && Icon && <Icon size={16} aria-hidden />}
      {children}
      {!loading && IconRight && <IconRight size={16} aria-hidden />}
      {!loading && !IconRight && showArrow && <ArrowRight size={16} aria-hidden />}
    </>
  );

  if (href && !isDisabled) {
    if (download) {
      return (
        <a
          href={href}
          download={download === true ? '' : download}
          onClick={onClick}
          target={target}
          rel={rel}
          className={cls}
          aria-label={ariaLabel}
        >
          {content}
        </a>
      );
    }
    return (
      <Link href={href} onClick={onClick} target={target} rel={rel} className={cls} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cls}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
    >
      {content}
    </button>
  );
}
