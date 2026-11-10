import { DistinctProductFrame, ProductToggle, ProofMetric, ProofMetricRow } from '@/src/components/landing'
import { SPRINT_WORK } from '@/src/ai-build-sprint-content'
import { MERIDIAN_MOCK_CHROME } from '@/src/meridian-assist-mock-content'
import { InsurtechCallQaScreen, RealEstateAnswerScreen } from './SprintProductScreens'
import { TrackedLink } from './TrackedLink'
import { MonoLabel } from './ui'

/**
 * "Real builds. Real outcomes." (plan B3): one product at a time, at full size, behind a labeled
 * toggle. Insurtech is a browser console on the violet end, compact; real estate is a desktop
 * app on the teal end, comfortable. Each metric sits in a ProofMetric cell beside its product.
 */
type Card = (typeof SPRINT_WORK.cards)[number]

/** "7 to 11 hours" sets its unit smaller; the words stay the same. */
function metricParts(metric: string) {
  const m = metric.match(/^(.*?)( hours)$/)
  return m ? { value: m[1], unit: m[2] } : { value: metric, unit: undefined }
}

function Panel({ card }: { card: Card }) {
  const insurtech = card.mock === 'insurtech-call-qa'
  const { value, unit } = metricParts(card.metric)
  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12" data-testid={`sprint-work-${card.id}`}>
      <div className="sprint-work-frame min-w-0">
      <DistinctProductFrame
        chrome={insurtech ? 'browser' : 'app'}
        accent={insurtech ? 'violet' : 'teal'}
        density={insurtech ? 'compact' : 'comfortable'}
        theme="inherit"
        bleed
        title={insurtech ? card.mockUrl : MERIDIAN_MOCK_CHROME.productName}
      >
        {insurtech ? <InsurtechCallQaScreen /> : <RealEstateAnswerScreen />}
      </DistinctProductFrame>
      </div>
      <div className="flex flex-col gap-5">
        <MonoLabel>{card.tag}</MonoLabel>
        <ProofMetricRow maxColumns={2} label={card.tag}>
          <ProofMetric value={value} unit={unit} label={card.metricLabel} />
        </ProofMetricRow>
        <p className="text-ink-secondary" style={{ lineHeight: 1.55 }}>
          {card.body}
        </p>
        <div>
          <TrackedLink href={card.href} event="sprint_case_study_click" className="btn-secondary">
            {SPRINT_WORK.linkLabel}
          </TrackedLink>
        </div>
      </div>
    </div>
  )
}

export function SprintWorkShowcase() {
  return (
    <div>
      <ProductToggle
        label={SPRINT_WORK.toggleLabel}
        items={SPRINT_WORK.cards.map((card) => ({ id: card.id, label: card.option, audience: card.audience, content: <Panel card={card} /> }))}
      />
      <MonoLabel className="mt-8 text-center">{SPRINT_WORK.recreatedNote}</MonoLabel>
      {/*
        ProductToggle renders only the active panel, so the other case would be missing from the
        server HTML. This hidden copy keeps every case's caption, metric and summary crawlable and
        readable without JavaScript; `hidden` keeps it out of the layout and the accessibility tree.
      */}
      <div hidden data-testid="sprint-work-crawlable">
        {SPRINT_WORK.cards.map((card) => (
          <section key={card.id}>
            <h3>{card.tag}</h3>
            <p>{card.audience}</p>
            <p>
              {card.metric} {card.metricLabel}
            </p>
            <p>{card.body}</p>
            <a href={card.href}>{SPRINT_WORK.linkLabel}</a>
          </section>
        ))}
      </div>
    </div>
  )
}
