import jsPDF from 'jspdf';
import { AssessmentResult } from '@/src/types/assessment';
import { evidenceForDimension, FRAMING_FINDING, lowestDimensions, type EvidenceFinding } from '@/src/lib/assessment/evidence';
import { ASSESSMENT_EVIDENCE_COPY as EV } from '@/src/assessment-evidence-content';
import { analysisSections } from '@/lib/assessment/analysis-render';
import { ASSESSMENT_ANALYSIS_COPY } from '@/src/assessment-analysis-content';
import { workflowSection } from '@/lib/assessment/workflow-render';
import { ASSESSMENT_WORKFLOW_REPORT as WF } from '@/src/assessment-workflows-content';

export function generateAssessmentPDF(result: AssessmentResult): void {
  const doc = new jsPDF();
  let yPos = 20;

  // Colors
  const primaryColor: [number, number, number] = [124, 58, 237]; // Purple
  const darkText: [number, number, number] = [30, 30, 30];
  const lightText: [number, number, number] = [100, 100, 100];

  // Header
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.text('AI Readiness Assessment', 20, yPos);
  yPos += 10;

  // Company name and date
  doc.setFontSize(14);
  doc.setTextColor(...darkText);
  doc.text(result.companyData.name, 20, yPos);
  yPos += 6;

  doc.setFontSize(10);
  doc.setTextColor(...lightText);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 20, yPos);
  yPos += 15;

  // Score Section with background
  doc.setFillColor(248, 245, 255);
  doc.roundedRect(20, yPos, 170, 40, 3, 3, 'F');

  doc.setFontSize(12);
  doc.setTextColor(...lightText);
  doc.text('Overall AI Readiness Score', 30, yPos + 12);

  doc.setFontSize(42);
  doc.setTextColor(...primaryColor);
  doc.text(`${result.overallScore}`, 30, yPos + 32);
  doc.setFontSize(16);
  doc.setTextColor(...lightText);
  doc.text('/100', 65, yPos + 32);
  doc.setFontSize(8);
  doc.text('Based on 38 self-reported answers', 30, yPos + 38);

  // Archetype on the right
  doc.setFontSize(12);
  doc.setTextColor(...lightText);
  doc.text('AI Archetype', 120, yPos + 12);
  doc.setFontSize(16);
  doc.setTextColor(...darkText);
  doc.text(result.archetype.name, 120, yPos + 24);
  doc.setFontSize(10);
  doc.setTextColor(...lightText);
  const hookLines = doc.splitTextToSize(result.archetype.hook, 60);
  doc.text(hookLines, 120, yPos + 32);

  yPos += 50;

  // Axis Scores
  doc.setFontSize(12);
  doc.setTextColor(...darkText);
  doc.text('Axis Scores', 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(...lightText);
  doc.text(`Strategic Vision: ${result.axisScores.vision}/100`, 20, yPos);
  doc.text(`Operational Capability: ${result.axisScores.ops}/100`, 100, yPos);
  yPos += 15;

  // Dimension Scores - Manual table rendering
  doc.setFontSize(12);
  doc.setTextColor(...darkText);
  doc.text('Dimension Scores', 20, yPos);
  yPos += 8;

  // Table header
  doc.setFillColor(...primaryColor);
  doc.rect(20, yPos, 170, 8, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('Dimension', 25, yPos + 6);
  doc.text('Score', 120, yPos + 6);
  doc.text('Status', 155, yPos + 6);
  yPos += 10;

  // Table rows
  result.dimensionScores.forEach((d, i) => {
    const status = d.score >= 70 ? 'Strong' : d.score >= 50 ? 'Developing' : 'Needs Work';
    const bgColor: [number, number, number] = i % 2 === 0 ? [250, 250, 252] : [255, 255, 255];

    doc.setFillColor(...bgColor);
    doc.rect(20, yPos, 170, 7, 'F');

    doc.setFontSize(9);
    doc.setTextColor(...darkText);
    doc.text(d.dimension, 25, yPos + 5);
    doc.text(`${d.score}/100`, 120, yPos + 5);

    // Color-code status
    if (status === 'Strong') {
      doc.setTextColor(22, 163, 74);
    } else if (status === 'Developing') {
      doc.setTextColor(202, 138, 4);
    } else {
      doc.setTextColor(220, 38, 38);
    }
    doc.text(status, 155, yPos + 5);

    yPos += 7;
  });

  yPos += 10;

  // Company Insights (if available)
  if (result.companyInsights?.company_summary) {
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(...darkText);
    doc.text('About you, from your website', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(...lightText);
    const summaryLines = doc.splitTextToSize(result.companyInsights.company_summary, 170);
    doc.text(summaryLines, 20, yPos);
    yPos += summaryLines.length * 5 + 10;
  }

  // The written analysis, from the same render source as the results page and the email
  const analysisBlocks = analysisSections(result.analysis);
  if (analysisBlocks.length > 0) {
    if (yPos > 180) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(...darkText);
    doc.text(ASSESSMENT_ANALYSIS_COPY.heading, 20, yPos);
    yPos += 8;

    const ensureRoom = (lines: number) => {
      if (yPos + lines * 5 > 280) {
        doc.addPage();
        yPos = 20;
      }
    };

    for (const section of analysisBlocks) {
      if (section.heading) {
        ensureRoom(2);
        doc.setFontSize(10);
        doc.setTextColor(...darkText);
        doc.text(section.heading, 20, yPos);
        yPos += 6;
      }
      for (const p of section.paragraphs) {
        doc.setFontSize(10);
        doc.setTextColor(...lightText);
        const lines = doc.splitTextToSize(p.text, 170);
        ensureRoom(lines.length);
        doc.text(lines, 20, yPos);
        yPos += lines.length * 5 + 1;
        if (p.basis) {
          doc.setFontSize(8);
          const basisLines = doc.splitTextToSize(p.basis, 170);
          ensureRoom(basisLines.length);
          doc.text(basisLines, 20, yPos);
          yPos += basisLines.length * 4;
        }
        yPos += 4;
      }
    }
    yPos += 8;
  }

  // Blockers
  if (result.blockers.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(...darkText);
    doc.text('Your lowest-scoring areas', 20, yPos);
    yPos += 8;

    result.blockers.forEach((blocker) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(254, 242, 242);
      doc.roundedRect(20, yPos - 3, 170, 25, 2, 2, 'F');

      doc.setFontSize(11);
      doc.setTextColor(153, 27, 27);
      doc.text(blocker.issue, 25, yPos + 5);

      doc.setFontSize(9);
      doc.setTextColor(...lightText);
      doc.text(blocker.impact, 25, yPos + 12);

      yPos += 30;
    });
  }

  // The workflows they named (same render source as the results page and the email)
  const workflows = workflowSection(result.workflows);
  if (workflows) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }
    const write = (text: string, size: number, color: [number, number, number], indent = 20, width = 170, gap = 2) => {
      doc.setFontSize(size);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, width);
      if (yPos + lines.length * (size * 0.45) > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(lines, indent, yPos);
      yPos += lines.length * (size * 0.45) + gap;
    };
    write(workflows.heading, 14, darkText, 20, 170, 4);
    write(workflows.intro, 9, lightText, 20, 170, 4);
    if (workflows.startWith) write(`${WF.startLabel}: ${workflows.startWith.name}. ${workflows.startWith.note}`, 10, darkText, 20, 170, 4);
    workflows.rows.forEach((r) => {
      write(r.name, 11, darkText, 20, 170, 1);
      write(r.detail, 9, lightText, 25, 165, 1);
      write(`${WF.hoursLabel}: ${r.hours}`, 10, darkText, 25, 165, 1);
      if (r.value) write(`${WF.valueLabel}: ${r.value}`, 10, darkText, 25, 165, 1);
      write(`${r.range}. ${r.sources.map((src) => `${src.label} ${src.source}.`).join(' ')}${r.note ? ` ${r.note}` : ''}`, 8, lightText, 25, 165, 5);
    });
    workflows.footnotes.forEach((f) => write(f, 8, lightText, 20, 170, 2));
    if (workflows.valueSource) write(`${workflows.valueSource.label}: ${workflows.valueSource.source}, ${workflows.valueSource.url}`, 8, lightText, 20, 170, 2);
    yPos += 6;
  }

  // Evidence for the two lowest areas
  const evidenceAreas = lowestDimensions(result.dimensionScores)
    .map((d) => ({ ...d, evidence: evidenceForDimension(d.dimension) }))
    .filter((d) => d.evidence);
  if (evidenceAreas.length > 0) {
    const ensureRoom = (needed: number) => {
      if (yPos + needed > 280) {
        doc.addPage();
        yPos = 20;
      }
    };
    const writeFinding = (f: EvidenceFinding) => {
      doc.setFontSize(10);
      doc.setTextColor(...darkText);
      const claimLines = doc.splitTextToSize(f.claim, 165);
      ensureRoom(claimLines.length * 5 + 12);
      doc.text(claimLines, 25, yPos);
      yPos += claimLines.length * 5;
      doc.setFontSize(8);
      doc.setTextColor(...lightText);
      const sourceLines = doc.splitTextToSize(`${EV.sourcePrefix} ${f.sourceLabel}. ${EV.studiedPrefix} ${f.method}.${f.note ? ` ${f.note}` : ''} ${f.url}`, 165);
      doc.text(sourceLines, 25, yPos);
      yPos += sourceLines.length * 4 + 4;
    };

    ensureRoom(40);
    doc.setFontSize(14);
    doc.setTextColor(...darkText);
    doc.text(EV.heading, 20, yPos);
    yPos += 7;
    doc.setFontSize(9);
    doc.setTextColor(...lightText);
    const introLines = doc.splitTextToSize(EV.intro, 170);
    doc.text(introLines, 20, yPos);
    yPos += introLines.length * 4 + 6;

    evidenceAreas.forEach(({ dimension, score, evidence }) => {
      ensureRoom(30);
      doc.setFontSize(12);
      doc.setTextColor(...primaryColor);
      doc.text(`${dimension} (${score}/100)`, 20, yPos);
      yPos += 7;
      doc.setFontSize(8);
      doc.setTextColor(...lightText);
      doc.text(EV.researchLabel.toUpperCase(), 25, yPos);
      yPos += 5;
      evidence!.findings.forEach(writeFinding);
      if (evidence!.caseFact) {
        doc.setFontSize(8);
        doc.setTextColor(...lightText);
        ensureRoom(16);
        doc.text(EV.caseLabel.toUpperCase(), 25, yPos);
        yPos += 5;
        doc.setFontSize(10);
        doc.setTextColor(...darkText);
        const caseLines = doc.splitTextToSize(
          `${evidence!.caseFact.label}: ${evidence!.caseFact.fact}. https://www.vibrana.ai${evidence!.caseFact.href}`,
          165,
        );
        ensureRoom(caseLines.length * 5);
        doc.text(caseLines, 25, yPos);
        yPos += caseLines.length * 5 + 4;
      }
      yPos += 4;
    });

    doc.setFontSize(9);
    doc.setTextColor(...lightText);
    const refLines = doc.splitTextToSize(EV.referencesOnRequest, 170);
    ensureRoom(refLines.length * 4 + 4);
    doc.text(refLines, 20, yPos);
    yPos += refLines.length * 4 + 6;

    ensureRoom(24);
    doc.setFontSize(8);
    doc.setTextColor(...lightText);
    doc.text(EV.framingHeading.toUpperCase(), 25, yPos);
    yPos += 5;
    writeFinding(FRAMING_FINDING);
    yPos += 8;
  }

  // Roadmap
  if (result.recommendations.length > 0) {
    if (yPos > 160) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(...darkText);
    doc.text('Your next steps', 20, yPos);
    yPos += 12;

    result.recommendations.forEach((rec) => {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      // Phase badge
      doc.setFillColor(...primaryColor);
      doc.roundedRect(20, yPos - 4, 50, 8, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(rec.phase, 25, yPos + 1);
      yPos += 10;

      // Title and description
      doc.setFontSize(12);
      doc.setTextColor(...darkText);
      doc.text(rec.title, 20, yPos);
      yPos += 6;

      doc.setFontSize(10);
      doc.setTextColor(...lightText);
      const descLines = doc.splitTextToSize(rec.description, 170);
      doc.text(descLines, 20, yPos);
      yPos += descLines.length * 5 + 4;

      // Actions
      rec.actions.forEach((action) => {
        if (yPos > 275) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(9);
        doc.setTextColor(...lightText);
        const actionLines = doc.splitTextToSize(`• ${action}`, 165);
        doc.text(actionLines, 25, yPos);
        yPos += actionLines.length * 4 + 2;
      });

      yPos += 8;
    });
  }

  // CTA Page
  doc.addPage();
  yPos = 60;

  doc.setFillColor(248, 245, 255);
  doc.roundedRect(20, yPos - 20, 170, 80, 5, 5, 'F');

  doc.setFontSize(18);
  doc.setTextColor(...primaryColor);
  doc.text('Want to talk it through?', 105, yPos, { align: 'center' });
  yPos += 12;

  doc.setFontSize(11);
  doc.setTextColor(...lightText);
  const ctaText = 'Book a 30-minute call with one of our builders to go through your results and pick a first workflow.';
  const ctaLines = doc.splitTextToSize(ctaText, 150);
  doc.text(ctaLines, 105, yPos, { align: 'center' });
  yPos += 25;

  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.textWithLink('Schedule Strategy Call', 105, yPos, {
    url: 'https://calendar.app.google/2DswLVndhkpMVx7K7',
    align: 'center',
  });

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.text(
      'vibrana.ai/ai-transformation/assessment',
      20,
      doc.internal.pageSize.height - 10
    );
  }

  // Download
  const filename = `${result.companyData.name.replace(/[^a-zA-Z0-9]/g, '_')}_AI_Readiness_Assessment.pdf`;
  doc.save(filename);
}
