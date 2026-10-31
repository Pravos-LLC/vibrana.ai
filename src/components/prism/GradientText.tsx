import React from 'react';
import { cn } from './utils/cn';

/**
 * Gradient text. Reserve for large display sizes — gradient text on white can
 * fail WCAG AA at body sizes (see DESIGN.md, light-mode adjustment #2).
 */
export interface GradientTextProps {
  children: React.ReactNode;
  gradient?: 'prism' | 'warm' | 'regenerative' | 'animated';
  as?: React.ElementType;
  className?: string;
}

export function GradientText({ children, gradient = 'prism', as: Tag = 'span', className }: GradientTextProps) {
  return <Tag className={cn(`text-gradient-${gradient}`, className)}>{children}</Tag>;
}

/** Wrap the first occurrence of `word` in `title` with a GradientText. */
export function withGradientWord(title: string, word?: string, gradient: GradientTextProps['gradient'] = 'prism', className?: string) {
  if (!word || !title.includes(word)) return title;
  const [before, ...rest] = title.split(word);
  const after = rest.join(word);
  return (
    <>
      {before}
      <GradientText gradient={gradient} className={className}>{word}</GradientText>
      {after}
    </>
  );
}
