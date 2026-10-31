import React from 'react';
import { cn } from './utils/cn';
import { withGradientWord, type GradientTextProps } from './GradientText';

/**
 * Heading — renders semantic h1–h6 picking up the scoped Prism element styles
 * (Bricolage display, tight leading/tracking). Optional `role` applies the
 * named heading utilities; `gradientWord` highlights a word with prism gradient.
 */
export interface HeadingProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  /** Override the rendered tag without changing the visual level. */
  as?: React.ElementType;
  role?: 'section' | 'card' | 'subsection';
  gradientWord?: string;
  gradient?: GradientTextProps['gradient'];
  /** Class applied to the gradient-word span (e.g. font-serif-accent). */
  gradientClassName?: string;
  className?: string;
}

export function Heading({
  level = 2,
  children,
  as,
  role,
  gradientWord,
  gradient = 'prism',
  gradientClassName,
  className,
}: HeadingProps) {
  const Tag = (as ?? (`h${level}` as React.ElementType));
  const roleClass = role ? `heading-${role}` : undefined;
  const content =
    typeof children === 'string' && gradientWord
      ? withGradientWord(children, gradientWord, gradient, gradientClassName)
      : children;
  return <Tag className={cn(roleClass, className)}>{content}</Tag>;
}

/**
 * Text — body/caption text bound to the fluid scale + semantic text tokens.
 */
export interface TextProps {
  children: React.ReactNode;
  as?: React.ElementType;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  tone?: 'primary' | 'secondary' | 'tertiary';
  leading?: 'tight' | 'snug' | 'normal' | 'relaxed';
  className?: string;
}

export function Text({
  children,
  as: Tag = 'p',
  size = 'base',
  tone = 'secondary',
  leading,
  className,
}: TextProps) {
  return (
    <Tag
      className={cn(
        `type-${size}`,
        `text-${tone}-token`,
        leading && `leading-${leading}`,
        className,
      )}
    >
      {children}
    </Tag>
  );
}
