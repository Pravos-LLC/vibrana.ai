import React from 'react'

/**
 * Renders a copy-deck headline where `*word*` marks the one serif italic word (Prism's three
 * voices). Anything outside the asterisks is plain text; a string with no marker comes back as is.
 */
export function accent(text: string): React.ReactNode {
  const parts = text.split(/\*([^*]+)\*/)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="font-serif-accent" style={{ letterSpacing: '-0.01em' }}>
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  )
}

/** The headline without its markers, for accessible names and metadata. */
export function plain(text: string): string {
  return text.replace(/\*([^*]+)\*/g, '$1')
}
