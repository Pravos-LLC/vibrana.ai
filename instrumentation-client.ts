import { initBotId } from 'botid/client/core';

/**
 * Vercel BotID client. Attaches an invisible challenge to matching same-origin
 * requests; the matching route calls checkBotId() (via lib/form-guard/server.ts).
 * No API key: BotID runs through the Vercel project itself.
 */
initBotId({
  protect: [
    { path: '/api/assessment-leads', method: 'POST' },
    { path: '/api/analyze-company', method: 'POST' },
    { path: '/api/assessments', method: 'POST' },
    { path: '/api/eu-ai-act-assessments', method: 'POST' },
    { path: '/api/whitepaper', method: 'POST' },
    { path: '/api/enterprise-inquiry', method: 'POST' },
    { path: '/api/sprint-inquiries', method: 'POST' },
    { path: '/api/sprint-fit/profile', method: 'POST' },
    { path: '/api/feedback', method: 'POST' },
    { path: '/api/roi-leads', method: 'POST' },
    { path: '/api/simulator/profile', method: 'POST' },
    { path: '/api/simulator/runs', method: 'POST' },
  ],
});
