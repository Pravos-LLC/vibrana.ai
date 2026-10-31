'use client';

/**
 * Privacy Policy Page — Prism Light (strict DS).
 */

import React from 'react';
import { EnterprisePageShell } from '../components/enterprise/EnterprisePageShell';

export default function PrivacyPage() {
  return (
    <EnterprisePageShell>
      <section className="mx-auto max-w-4xl px-6 pb-24 pt-32">
        <h1 className="mb-8 text-4xl font-semibold text-ink">Privacy Policy</h1>
        <div className="max-w-none text-ink-secondary">
          <p className="mb-4 text-sm">Last updated: 16 October 2026</p>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Controller</h2>
            <p className="mb-4">Pravos LLC, doing business as Vibrana, is the controller for information submitted directly to vibrana.ai unless a branded assessment names a partner controller. Privacy requests can be sent to hello@vibrana.ai.</p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Information We Collect</h2>
            <p className="mb-4">We collect information that you provide directly to us, including:</p>
            <ul className="mb-4 list-disc pl-6">
              <li>Contact, company, role, budget, timing, and attribution information submitted through our forms</li>
              <li>AI readiness answers, scores, any workflows you name (type of work, people, hours and an optional hourly cost), reports, quality signals, and optional company context</li>
              <li>Public company website and LinkedIn URLs supplied for company analysis</li>
              <li>Commercial correspondence, booking, proposal, and pipeline status</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="mb-4 list-disc pl-6">
              <li>Deliver requested assessments, reports, confirmations, and service communications</li>
              <li>Review Sprint and transformation fit, arrange calls, and manage proposals</li>
              <li>Analyze a company’s public website to personalize an assessment report</li>
              <li>Send assessment-related follow-up and, where separately requested, newsletters</li>
              <li>Measure funnel performance and improve our services and website</li>
            </ul>
            <p className="mb-4">Our basis depends on the purpose: providing a requested assessment, report, or proposal and taking pre-contract steps; legitimate interests in responding to business inquiries, maintaining security, and measuring service performance; consent for optional newsletters or other consent-based marketing; and legal obligations where applicable. Every assessment follow-up email has an unsubscribe link. Using it cancels the follow-up emails still scheduled for your address, and we keep the address on a suppression list, used for nothing else, so the follow-up sequence is not started for it again. The entry stays until you ask us to delete it. Replying &quot;stop&quot; works too.</p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Business Contacts and Prospecting</h2>
            <p className="mb-4">This section covers people we contact about our work who have not filled in one of our forms. Pravos LLC, doing business as Vibrana, is the controller.</p>
            <p className="mb-2">What we hold about a business contact:</p>
            <ul className="mb-4 list-disc pl-6">
              <li>Name, work email, role, company and, for people in our founders&apos; networks, LinkedIn profile URL</li>
              <li>Public business signals about the company, with the source of each</li>
              <li>For people in our founders&apos; own networks, the dates we last exchanged messages. We do not store the messages themselves.</li>
            </ul>
            <p className="mb-4">Where it comes from: public company sources, professional data providers, and our founders&apos; own professional networks.</p>
            <p className="mb-4">Why we hold it: to contact you about AI transformation work for your company. We rely on legitimate interest, which means we think a relevant business message to a work address is a reasonable thing to send and that it is unlikely to surprise you. Contacts from a founder&apos;s own network are only used for that founder&apos;s personal messages to people they know, never for cold email sequences.</p>
            <p className="mb-4">Where it is stored: in our CRM (Twenty, hosted by us on Fly.io) and in private files on our founders&apos; own devices. How long: we keep a record while it is relevant to our work. The founders review these records at least once a year.</p>
            <p className="mb-4">You can object, opt out or ask what we hold about you at any time. Email hello@vibrana.ai. If you ask, we stop contacting you, remove your record from our CRM and keep only a suppression entry, used for nothing else, so you are not contacted again. This notice is general information, not legal advice.</p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Meeting Notes</h2>
            <p className="mb-4">This section covers work meetings that members of the Vibrana team (John or Abe) record. Pravos LLC, doing business as Vibrana, is the controller.</p>
            <p className="mb-4">When we record a work meeting, Granola transcribes and summarizes it. If the meeting is with someone who is already a Vibrana contact, we remove email addresses, phone numbers, links and long numbers from the transcript. We then send the redacted transcript through OpenRouter to an AI model, which extracts a summary, decisions, follow-ups and dates. We restrict these requests to model providers that do not retain the data or use it for training (zero data retention routing).</p>
            <p className="mb-2">The processors of meeting content are:</p>
            <ul className="mb-4 list-disc pl-6">
              <li>Granola (Granola, Inc.), a meeting notes service, which transcribes and summarizes recorded meetings</li>
              <li>OpenRouter (OpenRouter, Inc.), an API router, which passes redacted transcripts of meetings with existing contacts to an AI model provider</li>
              <li>The AI model provider that OpenRouter sends these requests to, currently Google (Gemini models served by Google, as listed by OpenRouter)</li>
            </ul>
            <p className="mb-4">We keep this list current and update it when a processor changes.</p>
            <p className="mb-4">The resulting summary is stored in our CRM (Twenty, hosted by us on Fly.io). We do not store raw transcripts in the CRM. Transcript copies on our processing server are deleted within 90 days.</p>
            <p className="mb-4">Internal meetings, and meetings with people who are not Vibrana contacts, are only transcribed and summarized by Granola. We do not send them through OpenRouter or to any AI model ourselves.</p>
            <p className="mb-4">You can ask us to delete the data from a meeting you were in at any time. Email hello@vibrana.ai.</p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">AI Readiness Assessment</h2>
            <p className="mb-4">If you give the readiness assessment your company website, we read the public page you give us to describe your company in your report. Any company LinkedIn page address you add is passed to the AI model as text, exactly as typed; we do not open it. We do not extract or keep the names of people shown on the page. To write the personalized analysis in your report, an AI model then processes your company name, your answers to the assessment questions, any workflows you name with the hours estimated for them, the scores they produce (overall, by axis and by area, and the resulting profile), signals about how the assessment was completed (the time taken, whether every answer was at the maximum, and an automatic flag for very fast completion), and that company description. A second AI model checks the draft against the same information before it is stored; if it does not pass after one rewrite, your report is sent without a written analysis. Your contact details are not sent to any AI model.</p>
            <p className="mb-2">The processors that see this information are:</p>
            <ul className="mb-4 list-disc pl-6">
              <li>Firecrawl (Mendable, Inc.), which retrieves the public page</li>
              <li>OpenRouter (OpenRouter, Inc.), an API router, which passes the page text, and then the information above, to AI model providers</li>
              <li>The AI model providers that OpenRouter sends these requests to, which run the open-weight models we use, currently DeepSeek V4.1 Flash (reading the page and writing the analysis) and Qwen3.6 27B (checking it), as listed by OpenRouter. We restrict these requests to providers that do not retain the data or use it for training (zero data retention routing), so the models run on third-party hosts from that list, not on DeepSeek&apos;s or Alibaba&apos;s own services.</li>
            </ul>
            <p className="mb-4">Each processes the data under its own service and data-processing terms. Some of them may process it outside your country, as described under Data Storage and Security below.</p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">AI Transformation Simulator</h2>
            <p className="mb-4">If you give the simulator a company website, we read that site&apos;s public homepage once to suggest a sector and a team mix. We keep only that classification (the domain, the suggested sector and team mix, two yes or no signals, the page title, a one-sentence summary of what the company does, up to three of its offerings and its head-office country) for 30 days, so the same site isn&apos;t read again. For the same 30 days we also keep a screenshot of the homepage and the site&apos;s logo, which appear on the result and its share card. We never store the page text.</p>
            <p className="mb-2">The processors that see the domain or the public page text are:</p>
            <ul className="mb-4 list-disc pl-6">
              <li>Firecrawl (Mendable, Inc.), which retrieves the public homepage</li>
              <li>Cloudflare (Cloudflare, Inc.), whose Browser Rendering service retrieves the homepage when Firecrawl can&apos;t</li>
              <li>OpenRouter (OpenRouter, Inc.), an API router, which passes the trimmed public page text to an AI model provider</li>
              <li>The AI model provider that OpenRouter sends these requests to, which runs the open-weight model we use, currently Mistral Small 3.2 (as listed by OpenRouter). We restrict these requests to providers that do not retain the data or use it for training (zero data retention routing).</li>
            </ul>
            <p className="mb-4">When you save or share a result, we store your inputs and the computed result behind an unlisted link. The link shows your sector and size band, and your company name only if you choose to show it. We do not store your IP address; to count views we keep a one-way hash that changes every day. You can delete a result at any time from the browser you created it in, and its link then stops working. Results not connected to an email address are deleted after 180 days.</p>
            <p className="mb-4">If you ask for the full model or a call, we store your email address with the result, send you one email with the plan, and reply about the call if you asked for one. We do not add you to a newsletter or an email sequence unless you ask.</p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Site Measurement</h2>
            <p className="mb-4">We count how visitors move through the readiness assessment, the ROI calculator and the Sprint pages, so we can see which pages lead to a completed assessment or a call. Vercel Web Analytics records page views and a few named steps (starting or completing the assessment, opening or downloading the report, using the calculator, and clicking a link to book a call), each tagged with the page the visit started from, such as the readiness page, the calculator, the Sprint page or one of our emails. Vercel Web Analytics does not use cookies.</p>
            <p className="mb-4">Your browser keeps that starting page in session storage for the current tab only, and clears it when the tab closes. When you complete an assessment or send a Sprint request, we store the same starting page with it. When you click a link to book a call, we store a count with the starting page and where the link was, and nothing that identifies you: no name, email address or IP address. To stop a script from inflating that count, we keep a salted one-way hash of your network address, used only to limit how often a count can be sent, and delete it in routine cleanup. Calls are booked on Google Calendar, which does not tell us who booked or from which page.</p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Data Storage and Security</h2>
            <p className="mb-4">Form and assessment records are stored in Supabase. Resend processes transactional and follow-up email. Vercel hosts the website and provides site analytics. For the readiness assessment, Firecrawl, OpenRouter and an AI model provider process the information described under AI Readiness Assessment. Meeting content is processed by Granola, by OpenRouter, and by the AI model provider that OpenRouter sends requests to, as described under Meeting Notes.</p>
            <p className="mb-4">We use these providers under their applicable service and data-processing terms. We do not sell submitted information. Do not submit credentials, special-category personal data, client-confidential material, or regulated data through website forms.</p>
            <p className="mb-4">We keep active inquiry and assessment records while delivering the requested report and managing the related commercial conversation. Records are then reviewed under our operational retention schedule and removed when no longer needed for the stated purpose, contract administration, dispute handling, or a legal obligation. You may ask for the applicable retention date, export, correction, or deletion at any time; where a duty requires retention, we will explain the exception.</p>
            <p className="mb-4">A completed assessment report is also stored in your browser&apos;s local storage so the results page can reopen it. New reports include a seven-day expiry check. You can remove it sooner by clearing site data for vibrana.ai.</p>
            <p className="mb-4">Some providers may process information outside your country, including in the United States. We use the contractual and organizational transfer safeguards available under the relevant provider agreement and applicable law. Contact us for the safeguard applicable to a specific transfer.</p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="mb-4 list-disc pl-6">
              <li>Access your personal information</li>
              <li>Request deletion of your personal information</li>
              <li>Request correction or a copy of submitted information</li>
              <li>Object to or withdraw from marketing follow-up</li>
              <li>Unsubscribe from our email communications at any time</li>
            </ul>
            <p>To exercise these rights, please contact us at hello@vibrana.ai</p>
            <p className="mt-4">You may also complain to the data-protection authority that applies where you live or work.</p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-ink">Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at hello@vibrana.ai</p>
          </section>
        </div>
      </section>
    </EnterprisePageShell>
  );
}
