/**
 * Prism Light component library — the strict design-system layer.
 * Wraps the `.prism-light` CSS in app/globals.css. See DESIGN.md.
 *
 * Rules for components in this directory:
 *  - No hardcoded brand hex (use accent/semantic vars or the tint maps).
 *  - No legacy ThemeContext reads (the hook, theme colors, or dark-mode branch).
 *  - Render only DS classes + token vars.
 */
export { cn } from './utils/cn';
export { PRISM_TOKENS } from './tokens';
export { Button, type ButtonProps } from './Button';
export { Eyebrow, type EyebrowProps } from './Eyebrow';
export { GradientText, withGradientWord, type GradientTextProps } from './GradientText';
export { ScrollFillText, type ScrollFillTextProps } from './ScrollFillText';
export { Heading, Text, type HeadingProps, type TextProps } from './typography';
export { Section, type SectionProps } from './Section';
export { SectionHeader, type SectionHeaderProps } from './SectionHeader';
export { Card, type CardProps } from './Card';
export { IconBox, type IconBoxProps } from './IconBox';
export { Divider } from './Divider';
export { Reveal, type RevealProps } from './Reveal';
export { RoleImage, type RoleImageProps } from './RoleImage';
export { PolaroidPhoto, type PolaroidPhotoProps } from './PolaroidPhoto';
export { MarkerNote, type MarkerNoteProps } from './MarkerNote';
export { MarkerCaption, type MarkerCaptionProps } from './MarkerCaption';
export { MarkerUnderline, type MarkerUnderlineProps } from './MarkerUnderline';
export { MarkerCircle, type MarkerCircleProps } from './MarkerCircle';
export { MarkerArrow, type MarkerArrowProps } from './MarkerArrow';
export { MarkerHover, type MarkerHoverProps, type MarkerHoverShape } from './MarkerHover';
export {
  AsciiField,
  AsciiClosing,
  WORDS_METHOD,
  WORDS_QUESTIONS,
  WORDS_MOMENTS,
  type AsciiFieldProps,
  type AsciiClosingProps,
} from './AsciiClosing';
export { FilmRoll, type FilmRollProps, type FilmRollFrame } from './FilmRoll';
export { AsciiDialogue, type AsciiDialogueProps } from './AsciiDialogue';
export { BrowserFrame, PhoneFrame, TabletFrame } from './ScreenFrame';
export { RevealGroup, RevealItem, RevealBlock } from './motion/Reveal';
export { ParallaxMedia, type ParallaxMediaProps } from './motion/ParallaxMedia';
export { CountUp, type CountUpProps } from './motion/CountUp';
export { ScrollLine, type ScrollLineProps } from './motion/ScrollLine';
export { Badge, type BadgeProps } from './Badge';
export { Stat, type StatProps } from './Stat';
export { MetricProof, type MetricProofProps } from './MetricProof';
export { PunkThumbnail, type PunkThumbnailProps, type PunkTone } from './PunkThumbnail';
export { Field, type FieldProps } from './form/Field';
export { Input, type InputProps } from './form/Input';
export { Select, type SelectProps } from './form/Select';
export { Textarea, type TextareaProps } from './form/Textarea';
export { Nav, type NavProps, type NavItem, type NavDropdownItem } from './Nav';
export { ResolutionLadder, type ResolutionLadderProps, type ResolutionLadderTrigger } from './ResolutionLadder';
export { ShaderField, type ShaderFieldProps } from './ShaderField';
export { WaveField, type WaveFieldProps } from './WaveField';
export { NewsletterFooter, type NewsletterFooterProps } from './NewsletterFooter';
export { Background, type BackgroundVariant, type BackgroundCoverage } from './Background';
export { FloatingCards, type FloatingCardsProps, type FloatingCardsTile } from './FloatingCards';
export { BackgroundRich } from './BackgroundRich';
export { PageShell, type PageShellProps } from './PageShell';
