import { NextRequest, NextResponse } from 'next/server';
import { FORM_GUARDS, guardFieldsFromBody, guardSubmission } from '@/lib/form-guard/server';
import { LIMITS, cleanText } from '@/lib/form-guard/validation';
import { extractCompanyInsights } from '@/lib/assessment/company-insights';
import { openRouterConfigured } from '@/lib/llm/openrouter';

// Model calls on OpenRouter (two attempts at most) plus the rest of the work.
export const maxDuration = 60;

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || '';

interface ScrapedContent {
  title?: string;
  description?: string;
  content: string[];
  techStack?: string[];
  aiMentions?: string[];
  leadershipAI?: string[];
  metadata?: {
    favicon?: string;
    ogImage?: string;
    language?: string;
  };
}

async function scrapeCompany(website: string): Promise<ScrapedContent> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: website,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status}`);
    }

    const data = await response.json();

    // Firecrawl v1 returns { success: true, data: { markdown, metadata } }
    const scraped = data.data || data;

    return {
      title: scraped.metadata?.title || '',
      description: scraped.metadata?.description || '',
      content: [scraped.markdown || ''],
      metadata: {
        favicon: scraped.metadata?.favicon,
        ogImage: scraped.metadata?.ogImage,
        language: scraped.metadata?.language,
      },
    };
  } catch (error) {
    console.error('Scraping error:', error);
    return {
      content: [],
    };
  }
}

// One call plus one retry; null means the form simply goes on without company context.
async function analyzeWithAI(content: ScrapedContent, linkedin?: string): Promise<Record<string, unknown> | null> {
  const pageText = content.content.join('\n\n');
  for (let attempt = 0; attempt < 2; attempt++) {
    const { insights, error } = await extractCompanyInsights(pageText, linkedin);
    if (insights) return insights;
    console.error(`Company analysis attempt ${attempt + 1} failed: ${error}`);
    if (error === 'timeout') break;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    if (!FIRECRAWL_API_KEY || !openRouterConfigured()) {
      return NextResponse.json(
        { error: 'Company analysis is not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Each call costs a Firecrawl scrape plus a model call, so this is the most expensive
    // endpoint to abuse. A dropped request looks like a site that couldn't be read, and
    // the assessment form simply skips the insights.
    const guard = await guardSubmission({
      config: FORM_GUARDS.analyzeCompany,
      headers: request.headers,
      ...guardFieldsFromBody(body),
    });
    if (guard.action === 'drop') {
      return NextResponse.json({
        success: false,
        error: 'Unable to retrieve content from website for analysis',
        scraped: { content: [] },
      });
    }
    if (guard.action === 'reject') {
      return NextResponse.json({ error: guard.message }, { status: guard.status });
    }

    const website = cleanText(body?.website, LIMITS.url);
    const linkedinText = cleanText(body?.linkedin, LIMITS.url);
    if (website === null || linkedinText === null) {
      return NextResponse.json({ error: 'Invalid website URL' }, { status: 400 });
    }

    const linkedin = linkedinText || undefined;

    if (!website) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    const scrapedContent = await scrapeCompany(website);

    // Check if we have meaningful content to analyze
    const hasContent = scrapedContent.content.length > 0 &&
      scrapedContent.content.some(c => c && c.trim().length > 50);

    if (!hasContent) {
      return NextResponse.json({
        success: false,
        error: 'Unable to retrieve content from website for analysis',
        scraped: scrapedContent,
      });
    }

    const aiInsights = await analyzeWithAI(scrapedContent, linkedin);

    if (!aiInsights) {
      return NextResponse.json(
        {
          error: 'Failed to analyze company',
          scraped: scrapedContent,
        },
        { status: 500 }
      );
    }

    // Merge scraped metadata into AI insights
    const { company_metadata, ...rest } = aiInsights as { company_metadata?: Record<string, string> };
    const enrichedInsights = {
      ...rest,
      metadata: {
        ...company_metadata,
        favicon: scrapedContent.metadata?.favicon,
        ogImage: scrapedContent.metadata?.ogImage,
        pageTitle: scrapedContent.title,
        pageDescription: scrapedContent.description,
      },
    };

    return NextResponse.json({
      success: true,
      scraped: scrapedContent,
      insights: enrichedInsights,
      usage_hint: 'These insights can be used to pre-fill or personalize the AI Readiness Assessment',
    });
  } catch (error) {
    console.error('Company analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
