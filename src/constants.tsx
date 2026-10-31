/**
 * Constants for Vibrana landing page
 * - DAYS: 5-day curriculum nodes with icons
 * - NODE_COLORS: Gradient colors for curriculum nodes
 * - TESTIMONIALS: Customer testimonials
 * - FAQ_ITEMS: Frequently asked questions
 * - NAV_ITEMS: Navigation menu items
 */

import React from 'react';
import { Lightbulb, Palette, Code2, Rocket } from 'lucide-react';
import { DayNode, NodeColor, FAQItem, Testimonial } from './types';

export const DAYS: DayNode[] = [
  { id: 1, label: 'DAY 01', title: 'MAP', description: 'Define long-term goal, stakeholder interviews, create HMW questions', icon: <Lightbulb className="w-5 h-5" /> },
  { id: 2, label: 'DAY 02', title: 'TARGET', description: 'Sketch solutions, decide on target, produce PRD', icon: <Palette className="w-5 h-5" /> },
  { id: 3, label: 'DAY 03', title: 'BUILD', description: 'Vibe coding day 1 — scaffold and core features', icon: <Code2 className="w-5 h-5" /> },
  { id: 4, label: 'DAY 04', title: 'BUILD', description: 'Vibe coding day 2 — polish and integrate', icon: <Code2 className="w-5 h-5" /> },
  { id: 5, label: 'DAY 05', title: 'TEST', description: 'Test with 5 real users, iterate based on feedback', icon: <Rocket className="w-5 h-5" /> },
];

export const NODE_COLORS: NodeColor[] = [
  { primary: '#7c3aed', secondary: '#6d28d9', glow: 'rgba(124, 58, 237, 0.5)' },
  { primary: '#D4A744', secondary: '#B8A030', glow: 'rgba(180, 160, 50, 0.6)' },
  { primary: '#3b82f6', secondary: '#2563eb', glow: 'rgba(59, 130, 246, 0.5)' },
  { primary: '#22C55E', secondary: '#16A34A', glow: 'rgba(34, 197, 94, 0.6)' },
  { primary: '#2dd4bf', secondary: '#0d9488', glow: 'rgba(45, 212, 191, 0.5)' },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "I was able to vibe code in 20 minutes, what took me six months in my last startup. It's unbelievable.",
    name: "Charlie Pool",
    role: "Head of Carbon Advisory",
    company: "Howden",
    image: "/assets/imagery/homepage/prism-grid-solar.webp",
  },
  {
    quote: "In just two weeks, I've been able to build several apps and websites. Your emails have honestly been clearer and more helpful than many YouTube tutorials.",
    name: "Patrick Amiabi",
    role: "Founder",
    company: "CivicChain",
    image: "public-demo:portrait",
    linkedin: "https://www.linkedin.com/in/patrickamaibi",
  },
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What technical skills do I need to start?",
    answer: "None. Vibrana is designed for product thinkers, not developers. If you can describe what you want to build, you have enough skill to start. We teach you to leverage AI tools that handle the technical implementation.",
  },
  {
    question: "How is this different from a typical bootcamp?",
    answer: "Traditional bootcamps teach you to code over several months. Vibrana teaches you to ship products in days using AI-native methodology. You won't become a traditional developer—you'll become something more valuable: a product builder who can go from idea to live product at unprecedented speed.",
  },
  {
    question: "What happens after the 5 days?",
    answer: "You'll have a live, working product and the methodology to build more. Pro track participants get 30 days of async support post-sprint. Many alumni continue iterating on their projects and some have gone on to raise funding for products they built during the sprint.",
  },
  {
    question: "Who qualifies for the Commons Track?",
    answer: "The Commons Track is specifically for indigenous land stewards, conservation workers, and allies with proven track records of service to indigenous communities. Applicants are reviewed case-by-case to ensure alignment with our mission of supporting those working in harmony with nature.",
  },
  {
    question: "What kind of products can I build?",
    answer: "Internal tools, SaaS MVPs, mobile apps, data dashboards, community platforms—anything that can be built as a web application. The methodology is product-agnostic; we focus on the process of rapid, validated development.",
  },
  {
    question: "What's the time commitment during the sprint?",
    answer: "Plan for 6-8 focused hours per day across 5 days or a lesser investment spread out over a longer period of time. This designed to be run as intensive sprint, but it can be taken as a a passive course. You'll be actively building alongside an expert guide who helps you whenever you get stuck.",
  },
];

// Simplified B2B studio nav. Logo → home; "Take Assessment" is the CTA button.
export const NAV_ITEMS = [
  { label: 'AI Build Sprint', href: '/ai-build-sprint' },
  { label: 'Transformation', href: '/ai-transformation' },
  { label: 'Learn', href: '/learn' },
  { label: 'Case Studies', href: '/case-studies' },
  { label: 'About', href: '/about' },
];

// The six-month commercial focus: a bounded build. The way in is a short fit call (VIB-369).
export const NAV_CTA = { label: 'Book a 30-min call', href: '/ai-build-sprint#fit-call' };
