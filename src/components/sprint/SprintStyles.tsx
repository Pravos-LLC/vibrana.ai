/**
 * Page-local keyframes for the Build Sprint scenes and build log. Kept out of globals.css so the
 * page owns its own motion. Everything is gated on prefers-reduced-motion: no-preference.
 */
const CSS = `
@media (prefers-reduced-motion: no-preference) {
  .sprint-cursor { animation: sprint-cursor 2.8s cubic-bezier(0.77, 0, 0.175, 1) infinite; }
  .sprint-slide { animation: sprint-slide 360ms cubic-bezier(0.23, 1, 0.32, 1) both; }
  .sprint-stamp { animation: sprint-stamp 320ms cubic-bezier(0.23, 1, 0.32, 1) 240ms both; }
  .sprint-caret { animation: sprint-caret 1s steps(1) infinite; }
}
@keyframes sprint-cursor {
  0%, 12% { transform: translate(-44px, -34px); }
  45% { transform: translate(0, 0) scale(1); }
  52% { transform: translate(0, 0) scale(0.85); }
  60%, 80% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(-44px, -34px); }
}
@keyframes sprint-slide { from { opacity: 0; transform: translateX(18px); } to { opacity: 1; transform: none; } }
@keyframes sprint-stamp { from { opacity: 0; transform: rotate(-6deg) scale(1.3); } to { opacity: 1; transform: rotate(-6deg) scale(1); } }
@keyframes sprint-caret { 50% { opacity: 0; } }
/* Kit workaround: DistinctProductFrame holds unfitted browser and app frames at 560px on phones
   and scrolls them sideways. The Build Sprint product screens reflow to a purpose-made phone crop
   instead, so on this page the frame takes the column width. */
@media (max-width: 639px) {
  .sprint-work-frame > figure { overflow-x: visible !important; padding-bottom: 0 !important; }
  .sprint-work-frame > figure > div { min-width: 0 !important; }
}
/* The build log pins only where its whole block, CTA included, fits: 1024px wide, 860px tall,
   motion allowed (the pinned block measures about 800px). The height is reserved from the server
   render so hydration never moves the page. */
@media (min-width: 1024px) and (min-height: 860px) and (prefers-reduced-motion: no-preference) {
  .sprint-log-track { height: calc(100dvh + 11 * 38vh); }
}
`

export function SprintStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />
}
