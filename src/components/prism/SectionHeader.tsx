import React from 'react';
import { cn } from './utils/cn';
import { Eyebrow } from './Eyebrow';
import { Heading } from './typography';
import { RevealGroup, RevealItem } from './motion/Reveal';

/**
 * SectionHeader — eyebrow + display heading + optional subtitle. Strict Prism
 * (display heading, not mono). By default the eyebrow, heading and subtitle
 * stagger in on scroll (RevealGroup). Replaces the legacy SectionHeader.
 */
export interface SectionHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  /** Highlight a word in a string title with the prism gradient. */
  gradientWord?: string;
  gradient?: 'prism' | 'warm' | 'regenerative' | 'animated';
  /** Class applied to the gradient-word span (e.g. font-serif-accent). */
  gradientClassName?: string;
  subtitle?: React.ReactNode;
  align?: 'center' | 'left';
  reveal?: boolean;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  gradientWord,
  gradient,
  gradientClassName,
  subtitle,
  align = 'center',
  reveal = true,
  className,
}: SectionHeaderProps) {
  // Each line reveals in turn when `reveal` is on; plain fragments otherwise.
  const Item = reveal ? RevealItem : React.Fragment;
  const itemProps = (cls?: string) => (reveal ? { className: cls } : {});
  const Wrap = reveal ? RevealGroup : 'div';

  return (
    <Wrap className={cn(align === 'center' ? 'text-center' : 'text-left', 'mb-12', className)}>
      {eyebrow && (
        <Item {...itemProps()}>
          <Eyebrow className="mb-4">{eyebrow}</Eyebrow>
        </Item>
      )}
      <Item {...itemProps()}>
        <Heading
          level={2}
          gradientWord={typeof title === 'string' ? gradientWord : undefined}
          gradient={gradient}
          gradientClassName={gradientClassName}
        >
          {title}
        </Heading>
      </Item>
      {subtitle && (
        <Item {...itemProps()}>
          <p
            className={cn('type-base text-secondary-token mt-4 max-w-2xl', align === 'center' && 'mx-auto')}
          >
            {subtitle}
          </p>
        </Item>
      )}
    </Wrap>
  );
}
