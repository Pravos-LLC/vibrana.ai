import { PUBLIC_DEMO_DOWNLOAD as DEMO_DOWNLOAD } from '@/src/public-demo-download-content';
import { NextRequest, NextResponse, after } from 'next/server';
import { saveAssessment, claimAssessmentNotification, releaseAssessmentNotificationClaim, isWhitepaperAlreadySent } from '@/src/lib/assessment/db';
import { calculateOrgDimensionScores, calculateOverallScore, getReadinessLevel, identifyBlockers, generateRecommendations, calculateAxisScores, determineArchetype, instrumentVersionOf, isOptionScore } from '@/src/lib/assessment/scoring';
import { estimateAssessmentWorkflows, parseAssessmentWorkflows } from '@/src/lib/assessment/workflows';
import { workflowEmailHtml } from '@/lib/assessment/workflow-render';
import { sendAssessmentAdminNotification } from '@/lib/assessment-admin-notification';
import { computeQualitySignals, parseAssessmentTiming } from '@/lib/assessment/quality-signals';
import { Resend } from 'resend';
import { openRouterConfigured } from '@/lib/llm/openrouter';
import { generateIndustryAnalysisForAssessment } from '@/lib/assessment/generate-industry-analysis';
import { analysisEmailHtml, type StoredAnalysis } from '@/lib/assessment/analysis-render';
import { escapeHtml } from '@/lib/escape-html';
import { evidenceSectionHtml } from '@/lib/assessment-evidence-email';
import { FORM_GUARDS, guardFieldsFromBody, guardSubmission } from '@/lib/form-guard/server';
import { LIMITS, cleanText, isValidEmail, normalizeEmail } from '@/lib/form-guard/validation';
import { FORM_GUARD_MESSAGES } from '@/src/form-guard-content';
import { ASSESSMENT_NURTURE_DAY10 as DAY10 } from '@/src/assessment-nurture-day10-content';
import { nurtureFooterHtml } from '@/lib/assessment/nurture-footer';
import { parseEntryPoint } from '@/src/lib/funnel/entry';
import { cancelResendEmail, isOptedOut, listUnsubscribeHeaders, recordScheduledEmails, unsubscribePageUrl, type ScheduledSend } from '@/lib/unsubscribe';

// The analysis pipeline: up to two drafts, each checked by a judge model, plus the rest of the work.
export const maxDuration = 300;

const MAX_INSIGHTS_BYTES = 50_000;
const MAX_ANSWERS = 100;

const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { companyData, answers, companyInsights, startedAt } = body;
    const workflows = parseAssessmentWorkflows(body.workflows);

    if (!companyData || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!companyData.name || !companyData.website || !companyData.email) {
      return NextResponse.json(
        { error: 'Company name, website, and email are required' },
        { status: 400 }
      );
    }

    if (typeof answers !== 'object' || Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Invalid answers payload' },
        { status: 400 }
      );
    }

    const answerEntries = Object.entries(answers);
    if (
      answerEntries.length > MAX_ANSWERS ||
      answerEntries.some(([key, value]) => key.length > 20 || typeof value !== 'number' || !Number.isFinite(value))
    ) {
      return NextResponse.json({ error: 'Invalid answers payload' }, { status: 400 });
    }
    // Every id from one question set (version 2 now, version 1 from a page loaded before the
    // switch), and every score one of that question's options.
    const instrumentVersion = instrumentVersionOf(answers);
    if (instrumentVersion === null || answerEntries.some(([key, value]) => !isOptionScore(key, value))) {
      return NextResponse.json({ error: 'Invalid answers payload' }, { status: 400 });
    }
    if (workflows === 'invalid') {
      return NextResponse.json({ error: 'Invalid workflows payload' }, { status: 400 });
    }

    // Normalize what gets stored and mailed: one lowercase, validated address, trimmed text.
    const email = normalizeEmail(companyData.email);
    const companyName = cleanText(companyData.name, LIMITS.companyName);
    const website = cleanText(companyData.website, LIMITS.url);
    const linkedin = cleanText(companyData.linkedin, LIMITS.url);
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: FORM_GUARD_MESSAGES.invalidEmail }, { status: 400 });
    }
    if (!companyName || !website || linkedin === null) {
      return NextResponse.json(
        { error: 'Company details are missing or too long' },
        { status: 400 }
      );
    }
    if (companyInsights != null && JSON.stringify(companyInsights).length > MAX_INSIGHTS_BYTES) {
      return NextResponse.json({ error: 'Invalid assessment payload' }, { status: 400 });
    }
    companyData.email = email;
    companyData.name = companyName;
    companyData.website = website;
    companyData.linkedin = linkedin;

    const dimensionScores = calculateOrgDimensionScores(answers);

    const overallScore = calculateOverallScore(dimensionScores);
    const readiness = getReadinessLevel(overallScore);
    const blockers = identifyBlockers(dimensionScores);
    const workflowEstimate = estimateAssessmentWorkflows(workflows);
    const recommendations = generateRecommendations(
      overallScore,
      dimensionScores,
      answers,
      workflowEstimate?.startWith ? { name: workflowEstimate.startWith.name, borrowedEvidence: workflowEstimate.startWith.borrowedEvidence } : null
    );
    
    // New Calculations for Archetypes
    const axisScores = calculateAxisScores(dimensionScores);
    const archetype = determineArchetype(axisScores);

    // NOTE: Industry analysis is now generated asynchronously after the response
    // to improve user experience (they see results immediately)

    // Scoring is pure and cheap, so a dropped bot still gets a plausible report back.
    // What it doesn't get: a saved row, any email, an AI call, or a nurture sequence.
    const guard = await guardSubmission({
      config: FORM_GUARDS.assessments,
      headers: request.headers,
      ...guardFieldsFromBody(body),
      email,
    });
    if (guard.action === 'reject') {
      return NextResponse.json({ error: guard.message }, { status: guard.status });
    }
    if (guard.action === 'drop') {
      return NextResponse.json({
        success: true,
        assessmentId: undefined,
        report: {
          overallScore,
          readiness,
          dimensionScores,
          blockers,
          recommendations,
          archetype,
          axisScores,
          companyData,
          companyInsights: companyInsights || null,
          workflows,
          analysis: null,
          analysisGenerating: false,
        },
      });
    }

    const timing = parseAssessmentTiming(startedAt);
    const quality_signals = computeQualitySignals({
      answers,
      durationSeconds: timing.duration_seconds,
    });

    const assessmentData = {
      company_name: companyData.name,
      website: companyData.website,
      linkedin: companyData.linkedin || '',
      email: companyData.email,
      team_size: companyData.teamSize || null,
      revenue_band: companyData.revenueBand || null,
      // The raw answers (question id -> option score), validated above, so a report can cite them.
      answers,
      instrument_version: instrumentVersion,
      workflows,
      dimension_scores: dimensionScores.reduce((acc, dim) => ({ ...acc, [dim.dimension]: dim.score }), {}),
      overall_score: overallScore,
      readiness_level: readiness.level,
      blockers,
      recommendations,
      company_insights: companyInsights || null,
      archetype,
      axis_scores: axisScores,
      // The analysis is written after the response, in after() below.
      status: 'delivered' as const,
      started_at: timing.started_at,
      completed_at: timing.completed_at,
      duration_seconds: timing.duration_seconds,
      quality_signals,
      // Which front door the buyer came through (docs/funnel-measurement.md); null when not sent.
      entry_point: parseEntryPoint(body.entryPoint),
    };

    const { success, data } = await saveAssessment(assessmentData);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save assessment' },
        { status: 500 }
      );
    }

    const assessmentId = data?.[0]?.id;
    // The analysis rests on the answers; the website context is optional.
    const canGenerateAnalysis = openRouterConfigured();

    const notifyAdmin = (analysisNote?: string) =>
      sendAssessmentAdminNotification({
        kind: 'organization',
        companyName: companyData.name,
        email: companyData.email,
        overallScore,
        archetypeName: archetype?.name,
        readinessLevel: readiness.level,
        dimensionScores: assessmentData.dimension_scores,
        status: assessmentData.status,
        durationSeconds: timing.duration_seconds,
        qualitySignals: quality_signals,
        assessmentId,
        analysisNote,
        workflows,
      });

    after(async () => {
      // The analysis first, so the report email carries it and the admin email says how it went.
      let analysis: StoredAnalysis = null;
      let analysisNote: string | undefined = canGenerateAnalysis ? undefined : 'No analysis: OpenRouter is not configured.';
      if (assessmentId && canGenerateAnalysis) {
        try {
          const outcome = await generateIndustryAnalysisForAssessment(assessmentId);
          analysis = outcome.analysis ?? null;
          analysisNote = outcome.success
            ? `Analysis stored (${outcome.pipeline?.reason ?? 'cached'}).`
            : `No analysis stored: ${outcome.pipeline?.reason ?? outcome.error}. The report went out without it.`;
        } catch (err) {
          console.error('Background analysis generation error:', err);
          analysisNote = 'No analysis stored: the pipeline threw an error (see the function logs).';
        }
      }

      try {
        await notifyAdmin(analysisNote);
      } catch (err) {
        console.error('Admin notification error:', err);
      }

      // A replayed or raced submission for the same address still gets saved
      // above, but only the request that wins this claim sends the report
      // email and schedules the nurture sequence, so the address can't be
      // email-bombed by resubmitting the form. If either send fails, release
      // the claim so the next request (a genuine retry) can try again -- but
      // only when NOTHING was accepted at all. A partial failure (e.g. only
      // the Day 14 send failed) must keep the claim, or a retry re-sends the
      // report and re-schedules nurture emails that already went out.
      const notificationClaimed = await claimAssessmentNotification(companyData.email);
      if (notificationClaimed) {
        let reportSent = false;
        let anyNurtureSent = false;
        let nurtureNotWanted = false;

        try {
          reportSent = await sendAssessmentEmail(companyData.email, {
            overallScore,
            readiness,
            dimensionScores,
            blockers,
            recommendations,
            archetype,
            analysis,
            workflows,
            answerCount: answerEntries.length,
          });
        } catch (err) {
          console.error('Background email error:', err);
        }

        try {
          const nurtureResult = await scheduleNurtureSequence(companyData.email, companyData.name, {
            overallScore,
            readiness,
            archetype,
            blockers,
          }, assessmentId);
          anyNurtureSent = nurtureResult.anySucceeded;
          nurtureNotWanted = nurtureResult.optedOut === true;
        } catch (err) {
          console.error('Nurture sequence error:', err);
        }

        if (!reportSent && !anyNurtureSent) {
          await releaseAssessmentNotificationClaim(companyData.email);
        } else if (!reportSent || (!anyNurtureSent && !nurtureNotWanted)) {
          console.error('Assessment notification partially failed; claim kept so nothing is resent');
        }
      }
    });

    return NextResponse.json({
      success: true,
      assessmentId,
      report: {
        overallScore,
        readiness,
        dimensionScores,
        blockers,
        recommendations,
        archetype,
        axisScores,
        companyData,
        companyInsights: companyInsights || null,
        workflows,
        analysis: null,
        analysisGenerating: canGenerateAnalysis,
      },
    });
  } catch (error) {
    console.error('Assessment submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/** Returns true only if Resend accepted the message, so a caller can release a claim on failure. */
async function sendAssessmentEmail(email: string, report: any): Promise<boolean> {
  try {
    if (!resend) {
      console.warn('RESEND_API_KEY is not configured. Skipping email delivery.');
      return false;
    }

    const { error } = await resend.emails.send({
      from: 'Vibrana <hello@vibrana.ai>',
      to: email,
      cc: 'hello@vibrana.ai',
      subject: 'Your AI Readiness Assessment Report',
      html: generateEmailContent(report),
    });

    if (error) {
      console.error('Email send error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception sending email:', err);
    return false;
  }
}

interface NurtureSequenceResult {
  /**
   * True if at least one email in the sequence was actually accepted by Resend (a
   * skipped Day 10 counts as neither a success nor a failure). A caller must NOT
   * release the notification claim on a partial failure -- only when this is
   * false, meaning nothing at all went out -- or a retry re-sends emails that
   * already reached the inbox (VIB review on PR #105: a lone Day 14 failure was
   * releasing the claim and causing a full resend of the other three).
   */
  anySucceeded: boolean;
  /** The address unsubscribed earlier (email_opt_outs), so nothing was scheduled on purpose. */
  optedOut?: boolean;
}

// Schedule nurture sequence emails.
async function scheduleNurtureSequence(
  email: string,
  companyName: string,
  report: {
    overallScore: number;
    readiness: any;
    archetype: any;
    blockers: any[];
  },
  assessmentId?: string,
): Promise<NurtureSequenceResult> {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured. Skipping nurture sequence.');
    return { anySucceeded: false };
  }

  // Someone who unsubscribed never gets the sequence again, whatever they resubmit.
  if (await isOptedOut(email)) {
    console.log('Nurture sequence skipped: the address unsubscribed');
    return { anySucceeded: false, optedOut: true };
  }

  // Every email carries a working unsubscribe (footer link + RFC 8058 headers), or none is scheduled.
  const unsubscribeUrl = unsubscribePageUrl(email);
  const headers = listUnsubscribeHeaders(email);
  if (!unsubscribeUrl || !headers) {
    console.error('Nurture sequence skipped: no unsubscribe secret (UNSUBSCRIBE_SECRET or SUPABASE_SERVICE_KEY)');
    return { anySucceeded: false };
  }
  const footer = nurtureFooterHtml(unsubscribeUrl);

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002').replace(/\/+$/, '');
  const whitepaperUrl = `${baseUrl}/downloads/public-demo-guide.txt`;
  const calendarUrl = 'https://calendar.app.google/2DswLVndhkpMVx7K7';

  // Day 2: "One thing I'd prioritize" + whitepaper offer
  const day2Date = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

  // Day 5: Case study
  const day5Date = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  // Day 10: Whitepaper delivery
  const day10Date = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

  // Day 14: Final call invitation
  const day14Date = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  // companyName and email are whatever the submitter typed, so the HTML bodies get
  // an escaped copy. Subjects are plain text and keep the raw name.
  const safeCompanyName = escapeHtml(companyName);

  const topBlocker = report.blockers[0];
  const priorityArea = topBlocker?.dimension || 'Data Readiness';

  try {
    // Day 2 Email
    const day2 = await resend.emails.send({
      from: 'Vibrana <hello@vibrana.ai>',
      to: email,
      subject: `One thing I'd prioritize for ${companyName}`,
      scheduledAt: day2Date.toISOString(),
      html: generateDay2Email(safeCompanyName, priorityArea, report.overallScore, whitepaperUrl, footer),
      headers,
    });

    // Day 5 Email
    const day5 = await resend.emails.send({
      from: 'Vibrana <hello@vibrana.ai>',
      to: email,
      subject: 'How a European real-estate firm got 20 years of knowledge out of one head',
      scheduledAt: day5Date.toISOString(),
      html: generateDay5Email(safeCompanyName, report.archetype.name, calendarUrl, footer),
      headers,
    });

    // Day 10 Email: the whitepaper delivery. Skipped (not a failure, and not an
    // "attempt" for the success count below) for a lead who already has it (POST
    // /api/whitepaper marked whitepaper_leads.whitepaper_sent), so they don't get a
    // redundant push for a PDF they already downloaded. This check runs at schedule
    // time (now), not at the actual Day 10 send 10 days later, so it can't catch a
    // whitepaper request made in between -- there's no webhook back from Resend's
    // scheduled send to re-check state at fire time.
    const alreadyHasWhitepaper = await isWhitepaperAlreadySent(email);
    const day10 = alreadyHasWhitepaper
      ? null
      : await resend.emails.send({
          from: 'Vibrana <hello@vibrana.ai>',
          to: email,
          subject: DAY10.subject,
          scheduledAt: day10Date.toISOString(),
          html: generateDay10Email(safeCompanyName, whitepaperUrl, footer),
          headers,
        });

    // Day 14 Email
    const day14 = await resend.emails.send({
      from: 'Vibrana <hello@vibrana.ai>',
      to: email,
      subject: `Quick question about ${companyName}'s AI journey`,
      scheduledAt: day14Date.toISOString(),
      html: generateDay14Email(safeCompanyName, report.overallScore, report.archetype.name, calendarUrl, footer),
      headers,
    });

    type SendResult = Awaited<ReturnType<NonNullable<typeof resend>['emails']['send']>>;
    const attempts = ([day2, day5, day10, day14] as (SendResult | null)[]).filter((r): r is SendResult => r !== null);
    const failures = attempts.filter((r) => r.error);

    // Store every scheduled send's id against the lead, so an unsubscribe can cancel it.
    const scheduled: ScheduledSend[] = (
      [
        ['day2', day2, day2Date],
        ['day5', day5, day5Date],
        ['day10', day10, day10Date],
        ['day14', day14, day14Date],
      ] as [string, SendResult | null, Date][]
    ).flatMap(([step, result, date]) => (result?.data?.id ? [{ resendId: result.data.id, step, scheduledFor: date }] : []));
    const stored = await recordScheduledEmails({ email, sequence: 'assessment-nurture', assessmentId, sends: scheduled });
    if (!stored) {
      // A send we can't find again is a send nobody can unsubscribe from. Cancel them now.
      for (const send of scheduled) await cancelResendEmail(send.resendId);
      console.error(`Nurture sequence canceled: ${scheduled.length} scheduled ids could not be stored`);
      return { anySucceeded: false };
    }

    if (failures.length > 0) {
      // No PII (no email address) in this log -- just the Resend error names, so a
      // provider outage is diagnosable without exposing who the recipient was.
      console.error(
        `Nurture sequence: ${failures.length} of ${attempts.length} scheduled sends failed`,
        failures.map((f) => f.error?.name),
      );
    }
    return { anySucceeded: attempts.length > failures.length };
  } catch (err) {
    console.error('Error scheduling nurture emails:', err);
    return { anySucceeded: false };
  }
}

function generateDay2Email(_companyName: string, _priorityArea: string, _score: number, whitepaperUrl: string, footer: string): string {
  return `<!doctype html><html><body><h1>${DEMO_DOWNLOAD.heading}</h1><p>${DEMO_DOWNLOAD.followup}</p><a href="${whitepaperUrl}">${DEMO_DOWNLOAD.label}</a>${footer}</body></html>`;
}

function generateDay5Email(companyName: string, archetype: string, calendarUrl: string, footer: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, sans-serif; background: #0c0c10; color: #fff; margin: 0; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
          <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            Hi there,
          </p>
          <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            Since ${companyName} came out as a <strong style="color: #7c3aed;">${archetype}</strong>, here is one piece of our own work that I thought you'd find relevant.
          </p>
          <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            A cross-border European real-estate firm of about 50 people had a problem many companies have: for twenty years, one person was the company's knowledge base, and every hard client question went through him.
          </p>
          <div style="background: rgba(255,255,255,0.05); padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid rgba(255,255,255,0.1);">
            <h3 style="color: #fff; font-size: 18px; margin: 0 0 16px 0;">The Transformation</h3>
            <ul style="color: rgba(255,255,255,0.7); padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 8px;">Built a knowledge assistant overnight that searches 261 real answers and drafts a cited reply in the client's language</li>
              <li style="margin-bottom: 8px;">Strips personal data before anything else happens, with a review step for anything sensitive</li>
              <li style="margin-bottom: 8px;">Hardened it with the team in a workshop the next day</li>
              <li style="margin-bottom: 8px;">Taught seven of their people to build the next tool themselves</li>
              <li style="margin-bottom: 8px;">Their estimate: 7 to 11 hours saved per trained person each week</li>
            </ul>
          </div>
          <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            We started with one workflow and one real source of knowledge, not a program.
          </p>
          <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            Want to explore what a focused approach could look like for ${companyName}?
          </p>
          <p style="margin: 24px 0;">
            <a href="${calendarUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #f59e0b); color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Book a Strategy Call
            </a>
          </p>
          <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            John
          </p>
          <p style="color: rgba(255,255,255,0.4); font-size: 13px; margin-top: 40px;">
            John Ellison & Fatma Ghedira | Vibrana<br/>
            <a href="https://vibrana.ai" style="color: rgba(255,255,255,0.4);">vibrana.ai</a>
          </p>
          ${footer}
        </div>
      </body>
    </html>
  `;
}

function generateDay10Email(companyName: string, whitepaperUrl: string, footer: string): string {
  const bullets = DAY10.insideBullets.map((item) => `<li style="margin-bottom: 8px;">${item}</li>`).join('\n            ');
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, sans-serif; background: #0c0c10; color: #fff; margin: 0; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
          <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            Hi there,
          </p>
          <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            ${DAY10.intro}
          </p>
          <div style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(59, 130, 246, 0.2)); padding: 32px; border-radius: 16px; text-align: center; margin: 24px 0; border: 1px solid rgba(124, 58, 237, 0.3);">
            <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 12px 0; color: #fff;">${DAY10.heading}</h2>
            <p style="font-size: 15px; color: rgba(255,255,255,0.7); margin: 0 0 20px 0;">
              ${DAY10.tagline}
            </p>
            <a href="${whitepaperUrl}" style="display: inline-block; background: #fff; color: #7c3aed; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              ${DAY10.downloadLabel}
            </a>
          </div>
          <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.7; margin: 0 0 16px 0;">
            ${DAY10.insideIntro}
          </p>
          <ul style="color: rgba(255,255,255,0.7); padding-left: 20px; margin: 0 0 24px 0;">
            ${bullets}
          </ul>
          <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            ${DAY10.closing}
          </p>
          <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            John
          </p>
          <p style="color: rgba(255,255,255,0.4); font-size: 13px; margin-top: 40px;">
            John Ellison & Fatma Ghedira | Vibrana<br/>
            <a href="https://vibrana.ai" style="color: rgba(255,255,255,0.4);">vibrana.ai</a>
          </p>
          ${footer}
        </div>
      </body>
    </html>
  `;
}

function generateDay14Email(companyName: string, score: number, archetype: string, calendarUrl: string, footer: string): string {
  const readinessMessage = score >= 70
    ? "Your answers indicate broad foundations across several dimensions. This heuristic does not establish production readiness; verify the result through technical, governance, workforce, and operating diligence."
    : score >= 50
    ? "Your answers indicate mixed foundations. Use the lower-scoring dimensions to structure evidence review rather than predict value or success."
    : "Your answers indicate several foundations need direct evidence review. The score does not predict timeline, value, or success.";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, sans-serif; background: #0c0c10; color: #fff; margin: 0; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
          <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            Hi there,
          </p>
          <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            It's been a couple weeks since ${companyName} took our AI Readiness Assessment.
          </p>
          <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            Your answers put ${companyName} at ${score}/100 overall, with a <strong style="color: #7c3aed;">${archetype}</strong> profile.
          </p>
          <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            ${readinessMessage}
          </p>
          <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            I'd love to spend 30 minutes walking through your results together. No pitch, just an honest view of what I'd do in your position.
          </p>
          <div style="background: rgba(16, 185, 129, 0.1); padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid rgba(124, 58, 237, 0.2);">
            <p style="color: rgba(255,255,255,0.9); font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
              <strong>In the call, we'd cover:</strong>
            </p>
            <ul style="color: rgba(255,255,255,0.7); padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 6px;">Your top priority based on the assessment</li>
              <li style="margin-bottom: 6px;">Quick wins you could execute in the next 30 days</li>
              <li style="margin-bottom: 6px;">What a realistic 6-month roadmap looks like</li>
            </ul>
          </div>
          <p style="margin: 24px 0;">
            <a href="${calendarUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #f59e0b); color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Book a 30-Minute Call
            </a>
          </p>
          <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            Either way, I hope the assessment was useful. Always happy to chat if questions come up.
          </p>
          <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
            John
          </p>
          <p style="color: rgba(255,255,255,0.4); font-size: 13px; margin-top: 40px;">
            John Ellison & Fatma Ghedira | Vibrana<br/>
            <a href="https://vibrana.ai" style="color: rgba(255,255,255,0.4);">vibrana.ai</a>
          </p>
          ${footer}
        </div>
      </body>
    </html>
  `;
}

function generateEmailContent(report: any): string {
  const dimensionRows = report.dimensionScores.map((dim: any) => {
    const barWidth = Math.max(dim.score, 5);
    const barColor = dim.score >= 70 ? '#16a34a' : dim.score >= 50 ? '#f59e0b' : '#ef4444';
    return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #2a2a35; color: #e2e2e8; font-size: 15px;">${dim.dimension}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #2a2a35; text-align: right; width: 80px;">
          <span style="font-size: 20px; font-weight: 700; color: ${barColor};">${dim.score}</span>
          <span style="font-size: 13px; color: #9ca3af;">/100</span>
        </td>
      </tr>`;
  }).join('');

  const blockerRows = report.blockers.map((blocker: any) => `
    <div style="background: #1c1012; padding: 16px 20px; border-radius: 8px; margin: 12px 0; border-left: 3px solid #ef4444;">
      <p style="font-weight: 600; color: #fca5a5; margin: 0 0 8px 0; font-size: 15px;">${blocker.issue}</p>
      <p style="color: #d4d4dc; margin: 0; font-size: 14px;">${blocker.impact}</p>
    </div>
  `).join('');

  const recommendationRows = report.recommendations.map((rec: any) => {
    const actions = rec.actions.map((action: string) =>
      `<li style="padding: 4px 0; color: #c4c4cc; font-size: 14px;">${action}</li>`
    ).join('');
    return `
      <div style="margin: 0 0 28px 0; padding: 20px; background: #0f1a0f; border-radius: 8px; border-left: 3px solid #16a34a;">
        <h3 style="font-size: 17px; font-weight: 600; margin: 0 0 8px 0; color: #86efac;">${rec.phase}: ${rec.title}</h3>
        <p style="margin: 0 0 12px 0; color: #d4d4dc; font-size: 14px;">${rec.description}</p>
        <ul style="margin: 0; padding-left: 20px;">
          ${actions}
        </ul>
      </div>`;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0c0c10; color: #fff; margin: 0; padding: 0;">
        <div style="max-width: 640px; margin: 0 auto; padding: 40px 24px;">

          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 28px; font-weight: 700; margin: 0 0 8px 0; color: #ffffff;">Your AI Readiness Assessment</h1>
            <p style="font-size: 15px; color: #9ca3af; margin: 0;">Here's your report, based on the ${report.answerCount} questions you answered.</p>
          </div>

          <!-- Overall Score -->
          <div style="background: linear-gradient(135deg, #7c3aed, #f59e0b); padding: 32px; border-radius: 12px; margin: 0 0 32px 0; text-align: center;">
            <div style="font-size: 64px; font-weight: 700; color: #ffffff; line-height: 1;">${report.overallScore}/100</div>
            <div style="font-size: 18px; color: rgba(255,255,255,0.9); margin-top: 8px;">${report.readiness.level}</div>
          </div>

          <!-- The written analysis, from the same render source as the results page and the PDF -->
          ${analysisEmailHtml(report.analysis)}

          <!-- Dimension Scores -->
          <div style="margin: 0 0 32px 0; padding: 24px; background: #14141b; border-radius: 12px; border: 1px solid #2a2a35;">
            <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #ffffff;">Dimension Scores</h2>
            <table style="width: 100%; border-collapse: collapse;">
              ${dimensionRows}
            </table>
          </div>

          <!-- Top Blockers -->
          ${report.blockers.length > 0 ? `
          <div style="margin: 0 0 32px 0;">
            <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #ffffff;">Your lowest-scoring areas</h2>
            ${blockerRows}
          </div>
          ` : ''}

          <!-- The workflows they named: hours freed, from the ROI calculator's maths -->
          ${workflowEmailHtml(report.workflows)}

          <!-- Evidence for the two lowest areas -->
          ${evidenceSectionHtml(report.dimensionScores)}

          <!-- Recommendations -->
          <div style="margin: 0 0 40px 0;">
            <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #ffffff;">Your next steps</h2>
            ${recommendationRows}
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 40px 0 32px 0; padding: 32px 24px; background: #14141b; border-radius: 12px; border: 1px solid #2a2a35;">
            <p style="font-size: 16px; color: #e2e2e8; margin: 0 0 20px 0;">
              Want to talk it through?
            </p>
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://calendar.app.google/2DswLVndhkpMVx7K7" style="height:50px;v-text-anchor:middle;width:250px;" arcsize="16%" fillcolor="#7c3aed" stroke="f">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">Book a 30-minute call</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="https://calendar.app.google/2DswLVndhkpMVx7K7" style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; mso-padding-alt: 0;">
              Book a 30-minute call
            </a>
            <!--<![endif]-->
            <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 14px;">
              We'll go through your results with you and pick a first workflow.
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #2a2a35;">
            <p style="color: #6b7280; font-size: 13px; margin: 0;">
              John Ellison & Fatma Ghedira | Vibrana<br/>
              <a href="https://vibrana.ai" style="color: #6b7280;">vibrana.ai</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
