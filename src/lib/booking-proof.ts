import 'server-only';
import { getPublishedCaseStudies } from './case-studies';

// Reuse cleared, published statements. Do not introduce new proof claims here.
export function bookingProof() {
  return getPublishedCaseStudies().slice(0, 2).map(study => ({
    label: study.client ?? study.anonymizedName,
    title: study.homepageStatement ?? study.oneLineOutcome,
    href: `https://www.vibrana.ai/case-studies/${study.slug}`,
  }));
}
