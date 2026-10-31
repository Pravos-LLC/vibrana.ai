import React from 'react';
import { cn } from '@/src/components/prism/utils/cn';

/**
 * ImageryOverlay — the reusable chat/terminal overlay slot for `VibranaImage`.
 * Floats directly on the photo (no backdrop glass panel behind the whole
 * thing) — each bubble/window carries its own surface. Two variants:
 *
 *   - `chat` — a two-sided iMessage-style exchange (incoming grey-left,
 *     outgoing Prism-blue-right), seeded with a real AIOS "ask the shared
 *     brain" example.
 *   - `terminal` — a dark terminal window (traffic-light dots, mono body,
 *     blinking cursor), seeded with real AIOS scaffold/push commands.
 *
 * Purely presentational and content-driven — pass `messages`/`lines` to
 * show a different exchange; omit them to use the seeded defaults.
 */

export interface ChatMessage {
  side: 'in' | 'out';
  text: string;
}

export interface ImageryOverlayChatProps {
  variant: 'chat';
  messages?: ChatMessage[];
  className?: string;
}

export interface TerminalLine {
  kind?: 'prompt' | 'output' | 'success';
  text: string;
}

export interface ImageryOverlayTerminalProps {
  variant: 'terminal';
  lines?: TerminalLine[];
  className?: string;
}

export type ImageryOverlayProps = ImageryOverlayChatProps | ImageryOverlayTerminalProps;

const DEFAULT_CHAT_MESSAGES: ChatMessage[] = [
  { side: 'in', text: 'what did we decide about pricing on tuesday?' },
  { side: 'out', text: '3 decisions from that call, promoted to team' },
];

const DEFAULT_TERMINAL_LINES: TerminalLine[] = [
  { kind: 'prompt', text: 'scripts/scaffold-project.sh --context employee --slug pravos' },
  { kind: 'output', text: 'workspace scaffolded' },
  { kind: 'prompt', text: 'aios push' },
  { kind: 'success', text: 'promoted private -> team, nothing leaked' },
];

const TERMINAL_PREFIX: Record<NonNullable<TerminalLine['kind']>, string> = {
  prompt: '$',
  output: '▸',
  success: '✓',
};

function ChatOverlay({ messages = DEFAULT_CHAT_MESSAGES, className }: Omit<ImageryOverlayChatProps, 'variant'>) {
  return (
    <div className={cn('absolute inset-x-4 bottom-4 flex flex-col gap-2 sm:inset-x-6 sm:bottom-6', className)}>
      {messages.map((m, i) => (
        <div key={i} className={cn('flex', m.side === 'out' ? 'justify-end' : 'justify-start')}>
          <div
            className={cn(
              'max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-snug shadow-lg',
              m.side === 'out'
                ? 'rounded-br-md bg-blue text-white shadow-black/30'
                : 'rounded-bl-md text-ink shadow-black/20 backdrop-blur-xs',
            )}
          >
            {m.text}
          </div>
        </div>
      ))}
    </div>
  );
}

function TerminalOverlay({ lines = DEFAULT_TERMINAL_LINES, className }: Omit<ImageryOverlayTerminalProps, 'variant'>) {
  return (
    <div className={cn('absolute inset-4 flex items-end sm:inset-6', className)}>
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-white/10 bg-ink shadow-2xl shadow-black/40 backdrop-blur-xs">
        <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald" />
        </div>
        <div className="space-y-1 px-4 py-3 font-mono text-[13px] leading-relaxed text-white/85">
          {lines.map((line, i) => {
            const kind = line.kind ?? 'output';
            return (
              <div key={i} className={cn(kind === 'prompt' && 'text-white')}>
                <span className="mr-1.5 text-white/40">{TERMINAL_PREFIX[kind]}</span>
                {line.text}
              </div>
            );
          })}
          <span
            aria-hidden
            className="vibrana-terminal-cursor mt-0.5 inline-block h-[1em] w-[7px] translate-y-[2px] bg-white/80"
          />
        </div>
      </div>
      <style>{`
        @keyframes vibrana-terminal-cursor-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
        .vibrana-terminal-cursor { animation: vibrana-terminal-cursor-blink 1s step-end infinite; }
        @media (prefers-reduced-motion: reduce) {
          .vibrana-terminal-cursor { animation: none; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export function ImageryOverlay(props: ImageryOverlayProps) {
  if (props.variant === 'terminal') {
    return <TerminalOverlay lines={props.lines} className={props.className} />;
  }
  return <ChatOverlay messages={props.messages} className={props.className} />;
}
