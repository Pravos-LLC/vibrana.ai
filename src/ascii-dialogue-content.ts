/**
 * Content for AsciiDialogue (src/components/prism/AsciiDialogue.tsx).
 *
 * PLACEHOLDER NOTICE: ASCII_DIALOGUE_PASSAGE below is a neutral placeholder
 * lifted verbatim from the source study
 * (research/homepage-visual-exploration/08-ascii-monospace/b-code-becomes-language.html)
 * per JE's wave-2 brief ("a neutral placeholder sentence pulled from the study
 * is fine for the first iteration, flag it as placeholder"). It has NOT been
 * through vibrana-copywriting or persona-review. Do not treat `sentence` as
 * shipped marketing copy, replace it with a reviewed line (zero BLOCKs) before
 * this component appears on a real page rather than /prism.
 */

export interface AsciiDialoguePassage {
  /** Source "machine" code lines, disassembles character-by-character. */
  codeLines: readonly string[];
  /** The resolved "human" sentence the code characters fly into. */
  sentence: string;
  /**
   * The single payoff word within `sentence` (exact substring match, no
   * trailing punctuation) that renders with the prism gradient once the
   * sentence resolves. Rest of the sentence stays flat ink. Must appear
   * exactly once in `sentence`.
   */
  gradientWord: string;
}

export const ASCII_DIALOGUE_PASSAGE: AsciiDialoguePassage = {
  codeLines: [
    'const output = model.infer(input);',
    'if (output.confidence < THRESHOLD) {',
    '  return fallback(output, human.review);',
    '}',
    'export default output.map(x => x.value);',
  ],
  sentence: 'So a person can read it and understand.',
  gradientWord: 'understand',
} as const;

/** Small caption rendered under the field, structural/explanatory, not a headline. */
export const ASCII_DIALOGUE_CAPTION = 'Machine output, reverse-translated into a sentence a person can read.';

/** Accessible label for the canvas field (sr-only). */
export const ASCII_DIALOGUE_ARIA_LABEL = 'Decorative animation: source code disassembling into a plain human sentence';
