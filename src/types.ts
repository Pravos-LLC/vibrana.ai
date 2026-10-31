/**
 * Type definitions for Vibrana landing page components
 * - DayNode: Represents a day in the 5-day curriculum
 * - FAQItem: FAQ question/answer pair
 * - Testimonial: Customer testimonial data
 */

import { ReactNode } from 'react';

export interface DayNode {
  id: number;
  label: string;
  title: string;
  description: string;
  icon: ReactNode;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  image?: string;
  linkedin?: string;
}

export interface NodeColor {
  primary: string;
  secondary: string;
  glow: string;
}
