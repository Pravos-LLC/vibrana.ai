'use client'

/**
 * A native range input with a Prism track: the filled part carries the brand
 * gradient, the thumb is a white disc with a violet ring. Native, so keyboard,
 * touch and screen readers work without extra code.
 */
export function RangeInput({
  min,
  max,
  step,
  value,
  onChange,
  label,
  valueText,
  className = '',
}: {
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  label: string
  valueText: string
  className?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={label}
      aria-valuetext={valueText}
      className={`h-6 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-none
        [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:[background:var(--sim-track)]
        [&::-webkit-slider-thumb]:-mt-[7px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#7c3aed] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_2px_10px_rgba(124,58,237,0.35)] [&::-webkit-slider-thumb]:transition-transform active:[&::-webkit-slider-thumb]:scale-110
        [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:[background:var(--sim-track)] [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#7c3aed] [&::-moz-range-thumb]:bg-white
        focus-visible:[&::-webkit-slider-thumb]:ring-4 focus-visible:[&::-webkit-slider-thumb]:ring-[rgba(124,58,237,0.2)] ${className}`}
      style={{ ['--sim-track' as string]: `linear-gradient(90deg, #7c3aed 0%, #3b82f6 ${pct}%, rgba(15,15,17,0.10) ${pct}%, rgba(15,15,17,0.10) 100%)` }}
    />
  )
}
