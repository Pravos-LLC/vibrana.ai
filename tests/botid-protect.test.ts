import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

// A route that calls guardSubmission() runs Vercel BotID server-side. Without a matching
// client entry in instrumentation-client.ts, BotID flags every real visitor as a bot and the
// guard silently drops them (VIB-430: the simulator shipped this way).
function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return routeFiles(path);
    return name === 'route.ts' ? [path] : [];
  });
}

describe('BotID client protection', () => {
  it('covers every POST route that calls guardSubmission', () => {
    const client = readFileSync('instrumentation-client.ts', 'utf8');
    const missing = routeFiles('app/api')
      .filter((file) => /guardSubmission\(/.test(readFileSync(file, 'utf8')))
      .filter((file) => /export async function POST/.test(readFileSync(file, 'utf8')))
      .map((file) => '/' + relative('app', file).split(sep).slice(0, -1).join('/'))
      .filter((path) => !path.includes('['))
      .filter((path) => !client.includes(`path: '${path}'`));
    expect(missing).toEqual([]);
  });
});
