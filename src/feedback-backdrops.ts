// Backdrop slides for the feedback form (/feedback). Photos are Unsplash images of startup hubs,
// pre-blurred and darkened into small webps under public/assets/feedback (see docs/client-feedback-form.md
// for the licence note and the processing recipe). Each slide carries its own prism tint: `hue` walks the
// light spectrum from violet to amber across the set and `bandX` moves the glow from left to right, so the
// carousel reads as one gradual spectrum.

export type FeedbackBackdropSlide = {
  id: string
  city: string
  /** Path under public/. New filename whenever the image changes: /assets/* is served immutable. */
  src: string
  photographer: string
  /** Unsplash username, used for the attribution link. */
  username: string
  /** Spectrum hue in degrees for the main glow. The second glow sits about 40 degrees along. */
  hue: number
  /** Horizontal centre of the main glow, as a percentage of the viewport width. */
  bandX: number
}

export const FEEDBACK_BACKDROPS: readonly FeedbackBackdropSlide[] = [
  { id: 'hong-kong', city: 'Hong Kong', src: '/assets/feedback/bg-hong-kong.webp', photographer: 'Steven Wei', username: 'stevenwei', hue: 275, bandX: 14 },
  { id: 'london', city: 'London', src: '/assets/feedback/bg-london.webp', photographer: 'David Monaghan', username: 'rubicon99', hue: 255, bandX: 28 },
  { id: 'new-york', city: 'New York', src: '/assets/feedback/bg-new-york.webp', photographer: 'Mike Chavarri', username: 'mikechv', hue: 232, bandX: 42 },
  { id: 'san-francisco', city: 'San Francisco', src: '/assets/feedback/bg-san-francisco.webp', photographer: 'Juliann Hervio', username: 'ramaccess', hue: 205, bandX: 56 },
  { id: 'berlin', city: 'Berlin', src: '/assets/feedback/bg-berlin.webp', photographer: 'Norbert Braun', username: 'medion4you', hue: 178, bandX: 70 },
  { id: 'barcelona', city: 'Barcelona', src: '/assets/feedback/bg-barcelona.webp', photographer: 'Taisia Karaseva', username: 'taisiat', hue: 150, bandX: 84 },
  { id: 'lisbon', city: 'Lisbon', src: '/assets/feedback/bg-lisbon.webp', photographer: 'Tobias Reich', username: 'electerious', hue: 30, bandX: 92 },
]

const UTM = 'utm_source=vibrana&utm_medium=referral'

export function photographerUrl(slide: FeedbackBackdropSlide): string {
  return `https://unsplash.com/@${slide.username}?${UTM}`
}

export const UNSPLASH_URL = `https://unsplash.com/?${UTM}`
