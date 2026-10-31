/**
 * Preflight for the plan PDF's built-in fonts.
 *
 * pdfkit (under @react-pdf/renderer) loads its standard fonts lazily with
 * `require('#standard-fonts/<Name>')`, from a `createRequire` inside its ESM build.
 * The package `imports` map sends that `require` to `js/standard-fonts/<Name>.cjs`.
 * Two things follow:
 *
 * - Webpack's output file tracing follows the ESM side of that map and ships only
 *   the `.mjs` twins, so next.config.js lists the `.cjs` files in
 *   `outputFileTracingIncludes`.
 * - @react-pdf/renderer's font store starts four Helvetica loads at import time and
 *   never awaits them. If a font file is missing, those rejections are unhandled and
 *   the Vercel function process exits (status 128) after the request.
 *
 * So before the renderer is ever imported, resolve and load the same files the same
 * way pdfkit does. If this throws, the caller skips the PDF and the renderer is never
 * loaded, so nothing is left to reject unhandled.
 */
import path from 'node:path';

/** The Helvetica faces the font store loads on import (normal/bold, upright/oblique). */
export const PDF_STANDARD_FONTS = ['Helvetica', 'HelveticaBold', 'HelveticaOblique', 'HelveticaBoldOblique'] as const;

/** Throws if any built-in font pdfkit needs cannot be required from `root`'s node_modules. */
export function assertPdfFontsAvailable(root: string = process.cwd()): void {
  // A require anchored inside pdfkit's own package, so `#standard-fonts/*` resolves
  // through pdfkit's `imports` map with the `require` condition, exactly as pdfkit does.
  // Taken from process.getBuiltinModule, not an import: webpack rewrites a static
  // `createRequire(<not import.meta.url>)` into an undefined call.
  const { createRequire } = process.getBuiltinModule('node:module');
  const pdfkitRequire = createRequire(path.join(root, 'node_modules', 'pdfkit', 'package.json'));
  for (const font of PDF_STANDARD_FONTS) pdfkitRequire(`#standard-fonts/${font}`);
}
