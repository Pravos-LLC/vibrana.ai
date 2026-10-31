// Numbers in the output must already appear in the facts the model was given (the buyer's
// scores, the website summary, cited research). Anything else is a number the model made up.
// A percentage must match a percentage: "40%" is not grounded by a score of 40.
const NUMBER = /\d+(?:[.,]\d+)*\s?%?/g;
const normalize = (n: string) => n.replace(/,/g, '').replace(/\s/g, '');

export function findUngroundedNumbers(output: string, prompt: string): string[] {
  const promptNumbers = new Set((prompt.match(NUMBER) || []).map(normalize));
  const bare = new Set([...promptNumbers].map((n) => n.replace(/%$/, '')));
  const outputNumbers = (output.match(NUMBER) || []).map(normalize);
  return [...new Set(outputNumbers.filter((n) => (n.endsWith('%') ? !promptNumbers.has(n) : !bare.has(n))))];
}

export function cleanAnalysisText(text: string): string {
  return text.replace(/\s*[\u2014\u2013]\s*/g, ', ').trim();
}
