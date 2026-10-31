/**
 * The "full model" PDF the plan email carries (spec 4, 12): headline ranges, the
 * sequence, month by month, every line item, and the full assumptions appendix
 * with sources. Rendered from the stored, server-computed result. Built-in
 * Helvetica keeps it free of font files in the serverless bundle.
 */
import { Document, Link, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { SIM_PDF } from '@/src/simulator-email-content';
import {
  SIM_DASH,
  SIM_DATA_RULES,
  SIM_FUNCTION_LABELS,
  SIM_OFFERS,
  SIM_PROVIDER_LABELS,
  SIM_REGION_LABELS,
  SIM_SECTOR_LABELS,
  SIM_TEAM,
} from '@/src/simulator-content';
import { compareDelivery, simulate } from '../engine';
import type { OfferCard } from '../types';
import type { StoredRun } from '../api';
import { HOURLY_COST_SOURCES, REGION_CURRENCY } from '../assumptions';
import { EVIDENCE, FUNCTION_PARAMS } from '../benchmarks';
import { convert, formatMoney, formatMoneyRange, formatNumber, formatPercent, formatRange, sizeBand } from '../format';
import { PRICES_READ_ON, SEAT_PRICES, TOKEN_PRICES } from '../prices';
import { FUNCTIONS, PROVIDERS, SCENARIOS, type Currency, type SimulatorResult } from '../types';

const INK = '#1a1530';
const MUTED = '#5b5670';
const ACCENT = '#7c3aed';
const RULE = '#e4e1ee';

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 9, color: INK, lineHeight: 1.4 },
  eyebrow: { fontSize: 8, color: ACCENT, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  subtitle: { fontSize: 12, color: MUTED, marginBottom: 6 },
  meta: { fontSize: 9, color: MUTED, marginBottom: 2 },
  h2: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 14, marginBottom: 6, color: INK },
  p: { marginBottom: 4 },
  small: { fontSize: 8, color: MUTED },
  stat: { marginBottom: 8, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: ACCENT },
  statValue: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: RULE, paddingVertical: 2 },
  head: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: INK, paddingVertical: 2, fontFamily: 'Helvetica-Bold' },
  cell: { flex: 1, paddingRight: 4 },
  wide: { flex: 3, paddingRight: 4 },
  link: { color: ACCENT, textDecoration: 'none' },
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, fontSize: 7, color: MUTED, flexDirection: 'row', justifyContent: 'space-between' },
});

function Table({ header, rows, wideFirst = false }: { header: string[]; rows: (string | number)[][]; wideFirst?: boolean }) {
  return (
    <View>
      <View style={s.head} fixed>
        {header.map((h, i) => (
          <Text key={i} style={i === 0 && wideFirst ? s.wide : s.cell}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((r, i) => (
        <View key={i} style={s.row} wrap={false}>
          {r.map((c, j) => (
            <Text key={j} style={j === 0 && wideFirst ? s.wide : s.cell}>
              {String(c)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

/** Price text for a menu line, in the reader's currency. */
function offerPriceText(o: OfferCard, currency: Currency): string {
  const p = o.price;
  const h = SIM_DASH.help;
  if (p.kind === 'free') return h.free;
  if (p.kind === 'quote') return h.quote;
  if (p.kind === 'from') return h.from(formatMoney(p.low, currency, { compact: true }));
  const per = p.per === 'each' ? ` ${h.each}` : p.per === 'month' ? ` ${h.month}` : '';
  let text = `${formatMoneyRange(p, currency, { compact: true })}${per}`;
  if (o.quantity) text += `; ${SIM_PDF.outside.quantity(o.quantity)}`;
  return text;
}

export function SimulatorPdf({ run, currency }: { run: StoredRun; currency: Currency }) {
  // Re-run the engine on the stored inputs: older stored runs carry the v1 result shape.
  const r: SimulatorResult = simulate(run.result.inputs);
  const i = r.inputs;
  const h = r.headline;
  const money = (v: number) => formatMoney(v, currency);
  // Line items print exactly, so the itemized fees reconcile with the total on the page.
  const exact = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(convert(v, currency));
  const range = (lo: number, hi: number) => formatMoneyRange({ low: lo, high: hi }, currency);
  const date = run.createdAt.slice(0, 10);
  const sector = SIM_SECTOR_LABELS[i.sector];
  const band = sizeBand(i.headcount);
  const at = (scenario: (typeof SCENARIOS)[number], m: number) => r.scenarios[scenario].months[m];
  const src = HOURLY_COST_SOURCES[r.resolved.region];

  return (
    <Document title={`${SIM_PDF.title}: ${sector}`} author="Vibrana" subject={SIM_PDF.subtitle}>
      <Page size="A4" style={s.page}>
        <Text style={s.eyebrow}>{SIM_PDF.title}</Text>
        <Text style={s.title}>{SIM_PDF.subtitle}</Text>
        <Text style={s.meta}>{SIM_PDF.meta(run.companyName ? `${run.companyName} · ${sector}` : sector, band, date)}</Text>
        <Text style={[s.meta, { marginBottom: 12 }]}>{SIM_PDF.forReview}</Text>

        <Text style={s.h2}>{SIM_PDF.sections.headline}</Text>
        <View style={s.stat}>
          <Text style={s.small}>{SIM_PDF.headline.value}</Text>
          <Text style={s.statValue}>{range(h.capacityValue.low * 12, h.capacityValue.high * 12)}</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.small}>{SIM_PDF.headline.hours}</Text>
          <Text style={s.statValue}>{formatRange(h.hoursFreed)}</Text>
        </View>
        <View style={s.stat}>
          <Text style={s.small}>{SIM_PDF.headline.run}</Text>
          <Text style={s.statValue}>{range(h.runCost.low, h.runCost.high)}</Text>
          <Text style={s.small}>{SIM_PDF.headline.ceiling(money(h.ceiling))}</Text>
          <Text style={s.small}>{SIM_PDF.headline.training(formatNumber(h.trainingHours), money(h.trainingValue))}</Text>
        </View>
        <Text style={s.small}>{SIM_DASH.sources.nationalLine}</Text>

        <Text style={s.h2}>{SIM_PDF.sections.departments}</Text>
        <Table
          wideFirst
          header={[...SIM_PDF.departments.header]}
          rows={FUNCTIONS.filter((f) => at('optimistic', 12).hoursByFunction[f] > 0).map((f) => [
            SIM_FUNCTION_LABELS[f],
            formatRange({ low: at('conservative', 12).hoursByFunction[f], high: at('optimistic', 12).hoursByFunction[f] }),
            range(at('conservative', 12).valueByFunction[f], at('optimistic', 12).valueByFunction[f]),
            money(r.resolved.hourlyByFunction[f]),
          ])}
        />
        <Text style={[s.small, { marginTop: 4 }]}>{SIM_PDF.departments.note}</Text>

        <Text style={s.h2}>{SIM_PDF.sections.roadmap}</Text>
        {SIM_DASH.roadmap.phases.map((ph) => (
          <View key={ph.title} style={{ marginBottom: 5 }} wrap={false}>
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>
              {SIM_DASH.roadmap.months(ph.start, ph.end)}: {ph.title}
            </Text>
            <Text style={s.p}>{ph.milestones.join('. ')}.</Text>
            <Text style={s.small}>
              {SIM_PDF.roadmap.funded(ph.offers.map((id) => SIM_OFFERS[id].title).join(', '))}
            </Text>
          </View>
        ))}
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.h2}>{SIM_PDF.sections.outside}</Text>
        <Text style={s.p}>{SIM_PDF.outside.intro}</Text>
        <Table
          wideFirst
          header={[...SIM_PDF.outside.header]}
          rows={r.offers.map((o) => [
            `${SIM_OFFERS[o.id].title}. ${SIM_OFFERS[o.id].body}`,
            o.typical ? `${offerPriceText(o, currency)}; ${SIM_PDF.outside.typical(formatMoney(o.typical.usd, currency, { compact: true }), o.typical.weeks)}` : offerPriceText(o, currency),
            o.leads.map((id) => SIM_TEAM[id].name).join(', '),
          ])}
        />

        <Text style={s.h2}>{SIM_PDF.sections.costs}</Text>
        <Table
          wideFirst
          header={['', ...SCENARIOS.map((sc) => SIM_PDF.costs.scenario[sc])]}
          rows={[
            [SIM_PDF.costs.rows.seats, ...SCENARIOS.map((sc) => exact(at(sc, 12).costs.seats))],
            [SIM_PDF.costs.rows.builders, ...SCENARIOS.map((sc) => exact(at(sc, 12).costs.builders))],
            [SIM_PDF.costs.rows.usage, ...SCENARIOS.map((sc) => exact(at(sc, 12).costs.usage))],
            [SIM_PDF.costs.rows.agents, ...SCENARIOS.map((sc) => exact(at(sc, 12).costs.agents))],
            [SIM_PDF.costs.rows.tooling, ...SCENARIOS.map((sc) => exact(at(sc, 12).costs.tooling))],
            [SIM_PDF.costs.rows.addOns, ...SCENARIOS.map((sc) => exact(at(sc, 12).costs.addOns))],
            [SIM_PDF.costs.rows.reserve, ...SCENARIOS.map((sc) => exact(at(sc, 12).costs.reserve))],
            [SIM_PDF.costs.rows.governance, ...SCENARIOS.map((sc) => exact(at(sc, 12).costs.governance))],
            [SIM_PDF.costs.rows.run, ...SCENARIOS.map((sc) => exact(at(sc, 12).runCost))],
            [SIM_PDF.costs.rows.capacity, ...SCENARIOS.map((sc) => money(at(sc, 12).capacityValue))],
            ...(at('central', 12).cashSaving === null
              ? []
              : [[SIM_PDF.costs.rows.cash, ...SCENARIOS.map((sc) => money(at(sc, 12).cashSaving ?? 0))]]),
          ]}
        />
        <Text style={[s.small, { marginTop: 4 }]}>{SIM_PDF.costs.note}</Text>

        <Text style={s.h2}>{SIM_PDF.sections.net}</Text>
        <Table
          wideFirst
          header={[...SIM_PDF.net.header]}
          rows={(() => {
            const both = compareDelivery(i);
            const total = (d: 'consultant' | 'diy', pick: (m: (typeof both.consultant.scenarios.central.months)[number]) => number) =>
              both[d].scenarios.central.months.reduce((a, m) => a + pick(m), 0);
            const be = (d: 'consultant' | 'diy') => {
              const v = both[d].scenarios.central.breakEven;
              return v === null ? SIM_PDF.net.never : v === 0 ? SIM_PDF.net.start : String(v);
            };
            const net = (d: 'consultant' | 'diy') => {
              const run = both[d].scenarios;
              return `${money(run.central.cumulativeNet[24])} (${range(run.conservative.cumulativeNet[24], run.optimistic.cumulativeNet[24])})`;
            };
            return [
              [SIM_PDF.net.rows.fees, exact(total('consultant', (m) => m.costs.outsideFees)), exact(total('diy', (m) => m.costs.outsideFees))],
              [SIM_PDF.net.rows.build, money(total('consultant', (m) => m.costs.buildTime)), money(total('diy', (m) => m.costs.buildTime))],
              [SIM_PDF.net.rows.net, net('consultant'), net('diy')],
              [SIM_PDF.net.rows.breakEven, be('consultant'), be('diy')],
            ];
          })()}
        />
        <Text style={[s.small, { marginTop: 4 }]}>{SIM_PDF.net.note}</Text>

        <Text style={s.h2}>{SIM_PDF.sections.months}</Text>
        <Table
          header={[SIM_PDF.monthsTable.month, SIM_PDF.monthsTable.adoption, SIM_PDF.monthsTable.hours, SIM_PDF.monthsTable.run, SIM_PDF.monthsTable.training]}
          rows={r.scenarios.central.months.map((m) => [
            m.month,
            formatPercent(m.adoption),
            formatRange({ low: at('conservative', m.month).hoursFreed, high: at('optimistic', m.month).hoursFreed }),
            range(at('optimistic', m.month).runCost, at('conservative', m.month).runCost),
            money(m.costs.trainingTime),
          ])}
        />
        <Footer />
      </Page>

      <Page size="A4" style={s.page}>
        <Text style={s.h2}>{SIM_PDF.sections.inputs}</Text>
        <Table
          wideFirst
          header={['', '']}
          rows={[
            [SIM_PDF.inputs.sector, sector],
            [SIM_PDF.inputs.people, formatNumber(i.headcount)],
            [SIM_PDF.inputs.providers, i.providers.map((p) => SIM_PROVIDER_LABELS[p]).join(', ')],
            [SIM_PDF.inputs.cap, money(i.cap)],
            [SIM_PDF.inputs.dataRule, SIM_DATA_RULES[i.dataRule].label],
            [SIM_PDF.inputs.pace, formatPercent(r.resolved.adoptionCurve.aMax)],
            [SIM_PDF.inputs.region, SIM_REGION_LABELS[r.resolved.region]],
            [SIM_PDF.inputs.hourly, `${money(r.resolved.hourlyCost)} (${i.overrides?.hourlyCost ? SIM_PDF.assumptions.ourAssumption : src.label}, ${src.period})`],
            [SIM_PDF.inputs.weeks, formatNumber(r.resolved.workingHoursPerMonth)],
            [SIM_PDF.inputs.mix, FUNCTIONS.map((f) => `${SIM_FUNCTION_LABELS[f]} ${formatPercent(r.resolved.functionMix[f])}`).join(', ')],
          ]}
        />

        <Text style={s.h2}>{SIM_PDF.sections.assumptions}</Text>
        <Text style={s.p}>{SIM_PDF.assumptions.intro}</Text>
        <Table
          wideFirst
          header={[...SIM_PDF.assumptions.functionHeader]}
          rows={FUNCTIONS.map((f) => {
            const p = FUNCTION_PARAMS[f];
            const rows = [...new Set(Object.values(p.rows).flat())];
            return [
              SIM_FUNCTION_LABELS[f],
              formatPercent(p.s.conservative),
              formatPercent(p.s.central),
              formatPercent(p.s.optimistic),
              `${formatPercent(p.e)} (${SIM_PDF.assumptions.ourAssumption})`,
              rows.length ? rows.join(', ') : SIM_PDF.assumptions.ourAssumption,
            ];
          })}
        />
        <Text style={[s.small, { marginTop: 4 }]}>{SIM_PDF.assumptions.selfReported}</Text>

        <Text style={s.h2}>{SIM_PDF.sections.evidence}</Text>
        {EVIDENCE.map((e) => (
          <View key={e.id} style={{ marginBottom: 4 }} wrap={false}>
            <Text>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>{e.id}. </Text>
              {e.function}: {e.effect}. {e.setting}. {e.caveat}.
            </Text>
            <Link src={e.url} style={[s.small, s.link]}>
              {e.citation}. {e.url}
            </Link>
          </View>
        ))}

        <Text style={s.h2}>{SIM_PDF.sections.prices}</Text>
        <Text style={s.small}>{SIM_PDF.pricesRead(PRICES_READ_ON)}</Text>
        <Table
          wideFirst
          header={[...SIM_PDF.pricesHeader]}
          rows={PROVIDERS.map((p) => {
            const mid = TOKEN_PRICES[p].find((t) => t.tier === 'mid');
            return [
              `${SIM_PROVIDER_LABELS[p]}: ${SEAT_PRICES[p].plan}`,
              formatMoney(SEAT_PRICES[p].usd, 'USD'),
              mid?.model ?? '',
              mid ? `$${mid.input} / $${mid.output}` : '',
            ];
          })}
        />
        <Text style={[s.small, { marginTop: 10 }]}>{SIM_PDF.finePrint(PRICES_READ_ON)}</Text>
        <Footer />
      </Page>
    </Document>
  );
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text>{SIM_PDF.footer}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

export async function renderSimulatorPdf(run: StoredRun): Promise<Buffer> {
  const currency = REGION_CURRENCY[simulate(run.result.inputs).resolved.region] ?? 'USD';
  return renderToBuffer(<SimulatorPdf run={run} currency={currency} />);
}
