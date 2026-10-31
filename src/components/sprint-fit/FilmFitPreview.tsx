/** Deterministic view of the real survey controls for frame-based rendering.
 * Contact collection, company research and network requests never run in a film.
 */
import { FIT } from '@/src/sprint-fit-content'
import { EMPTY_FIT, FIT_SAMPLE } from '@/src/lib/sprint-fit'
import { FitBrief, FitQuestion } from './FitPanels'

const ignoreAnswer = () => {}
export function FilmFitPreview({ scene, answered = false }: { scene: 'starting-point' | 'summary'; answered?: boolean }) {
  if (scene === 'summary') return <FitBrief answers={FIT_SAMPLE} compact />
  return <>
    <div className="font-display" style={{ fontSize: 29, fontWeight: 600, lineHeight: 1.12, marginBottom: 24 }}>{FIT.steps[0].title}</div>
    <FitQuestion step={0} answers={answered ? FIT_SAMPLE : EMPTY_FIT} onChange={ignoreAnswer} />
  </>
}
