import React from 'react'
import { Document, Font, Image, Link, Page, StyleSheet, Text, View, Svg, Path } from '@react-pdf/renderer'
import { BRIEF_EXPORT as C } from '@/src/sprint-brief-export-content'
import { SPRINT_FIT_CALL_URL } from '@/src/ai-build-sprint-content'
import type { SprintBrief } from '@/src/lib/sprint-brief'
import { briefCaseRows, briefDate, briefInputRows, briefSafeLink, type BriefAssets } from '@/src/lib/sprint-brief-export'

/** Registered only after the lazy export is requested, with embedded local assets. */
export function registerBriefFonts(assets: BriefAssets) {
  if (assets.displayFont) Font.register({ family: 'SprintBricolage', src: assets.displayFont, fontWeight: 600 })
  if (assets.bodyFont) Font.register({ family: 'SprintHanken', fonts: [
    { src: assets.bodyFont, fontWeight: 400 },
    { src: assets.bodySemiboldFont || assets.bodyFont, fontWeight: 600 },
  ] })
  Font.registerHyphenationCallback(word => word.length > 40 ? word.match(/.{1,24}/gu) || [word] : [word])
}

const s = StyleSheet.create({
  page: { padding: 36, paddingTop: 36, paddingBottom: 57, color: '#211b2b', fontSize: 10, lineHeight: 1.55 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.6, borderBottomColor: '#e8e3ed', paddingBottom: 11, marginBottom: 16 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { width: 27, height: 27, objectFit: 'contain' },
  wordmark: { fontSize: 12, letterSpacing: 0.4 },
  meta: { fontSize: 8, color: '#6b6375' },
  company: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 9 },
  logo: { width: 56, height: 36, objectFit: 'contain' },
  eyebrow: { fontSize: 7, color: '#7131ca', letterSpacing: 0.8, textTransform: 'uppercase' },
  companyName: { fontSize: 19, lineHeight: 1.2, marginTop: 5 },
  title: { fontSize: 32, lineHeight: 1.1, letterSpacing: -1, marginTop: 8, marginBottom: 11 },
  intro: { fontSize: 11, lineHeight: 1.65, color: '#51475e', marginTop: 10, marginBottom: 4 },
  section: { marginTop: 15, paddingTop: 12, borderTopWidth: 0.6, borderTopColor: '#e8e3ed' },
  heading: { fontSize: 16, lineHeight: 1.2, marginBottom: 11, letterSpacing: -0.3 },
  subheading: { fontSize: 11, marginTop: 14, marginBottom: 7 },
  paragraph: { marginBottom: 8 },
  scopeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  scopeNode: { width: '49%', padding: 10, borderWidth: 0.7, borderColor: '#e0d7ed', backgroundColor: '#faf8fd', borderRadius: 6 },
  scopeValue: { fontSize: 11, lineHeight: 1.55, color: '#211b2b', marginTop: 6 },
  stats: { backgroundColor: '#f5f1fa', padding: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '30%' },
  statValue: { fontSize: 17, marginTop: 5, lineHeight: 1.2 },
  note: { fontSize: 8, color: '#6b6375', marginTop: 9 },
  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#eeeaf2', paddingVertical: 7 },
  label: { width: '30%', paddingRight: 12, color: '#6b6375', fontSize: 8 },
  value: { width: '70%', fontSize: 9 },
  example: { paddingLeft: 14, borderLeftWidth: 2, borderLeftColor: '#7c3aed' },
  exampleName: { fontSize: 13, marginBottom: 4 },
  link: { color: '#7131ca', textDecoration: 'none' },
  listRow: { flexDirection: 'row', marginBottom: 7 },
  bullet: { width: 10, color: '#7131ca' },
  listText: { flex: 1 },
  checkbox: { width: 9, height: 9, borderWidth: 0.8, borderColor: '#7131ca', borderRadius: 1, marginTop: 3, marginRight: 7 },
  call: { backgroundColor: '#f5f1fa', padding: 16, marginTop: 25, flexDirection: 'row', gap: 16, alignItems: 'center' },
  portrait: { width: 52, height: 65, objectFit: 'cover', borderRadius: 4 },
  callTitle: { fontSize: 15, color: '#7131ca', textDecoration: 'none', marginBottom: 6 },
  footer: { position: 'absolute', bottom: 22, left: 40, right: 40, borderTopWidth: 0.5, borderTopColor: '#e8e3ed', paddingTop: 7, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#6b6375', maxWidth: '82%' },
})

function Rows({ rows }: { rows: [string, string][] }) {
  return <View>{rows.map(([label, value], index) => <View key={index} style={s.row}>
    <Text style={s.label}>{label}</Text><Text style={s.value}>{value}</Text>
  </View>)}</View>
}
function Items({ items, checklist = false }: { items: string[]; checklist?: boolean }) {
  return <View>{items.map((item, index) => <View key={index} style={s.listRow}>
    {checklist ? <View style={s.checkbox} /> : <Text style={s.bullet}>•</Text>}<Text style={s.listText}>{item}</Text>
  </View>)}</View>
}

const scopePaths = ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75', 'M12 3 2 8l10 5 10-5-10-5 M2 12l10 5 10-5 M2 16l10 5 10-5', 'M4 22V3 M4 3h14l-3 5 3 5H4', 'M4 20V12 M10 20V4 M16 20V9 M22 20H2']
function ScopeIcon({ index }: { index: number }) { return <Svg width={16} height={16} viewBox="0 0 24 24"><Path d={scopePaths[index]} stroke="#7131ca" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg> }

export function BriefPdf({ brief, assets = {} }: { brief: SprintBrief; assets?: BriefAssets }) {
  const display = { fontFamily: assets.displayFont ? 'SprintBricolage' : 'Helvetica-Bold', fontWeight: 600 as const }
  const body = assets.bodyFont ? 'SprintHanken' : 'Helvetica'
  const scope = [brief.scope.user, brief.scope.task, brief.scope.firstRelease, brief.scope.successMeasure]
  const caseRows = briefCaseRows(brief)
  const inputRows = briefInputRows(brief)
  const evidence = brief.benchmark
  const evidenceUrl = briefSafeLink(evidence?.url)
  const website = briefSafeLink(brief.company.website)
  const source = briefSafeLink(brief.company.sourceUrl)
  return <Document title={`${brief.company.name} · ${C.title}`} author={C.john} subject={C.title} language="en">
    <Page size="A4" style={[s.page, { fontFamily: body }]}>
      <View fixed style={{ position: 'absolute', top: 17, left: 40, right: 40 }} render={({ pageNumber }) => pageNumber > 1 ? <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 0.5, borderBottomColor: '#e8e3ed', paddingBottom: 7 }}>
        <Text style={{ fontSize: 7, color: '#6b6375' }}>{brief.company.name.length > 60 ? `${brief.company.name.slice(0, 57)}…` : brief.company.name}</Text>
        <Text style={{ fontSize: 7, color: '#6b6375' }}>{`${C.title} · ${C.page} ${pageNumber}`}</Text>
      </View> : null} />
      <View style={s.header} wrap={false}>
        <View style={s.brand}>{assets.mark ? <Image src={assets.mark} style={s.mark} /> : null}<Text style={[s.wordmark, display]}>{C.brand}</Text></View>
        <Text style={s.meta}>{C.created} {briefDate(brief.createdAt)}</Text>
      </View>
      <View style={s.company} wrap={false}>
        {assets.companyLogo ? <Image src={assets.companyLogo} style={s.logo} /> : null}
        <View style={{ flex: 1 }}><Text style={s.eyebrow}>{C.preparedFor}</Text><Text style={[s.companyName, display]}>{brief.company.name}</Text>
          {website ? <Link src={website} style={[s.meta, s.link]}>{new URL(website).hostname}</Link> : null}
        </View>
      </View>
      <Text style={[s.title, display]}>{C.title}</Text>
      {brief.company.projectName ? <Text style={s.meta}>{C.project}: {brief.company.projectName}</Text> : null}
      {brief.narrative.summary ? <Text style={s.intro}>{brief.narrative.summary}</Text> : null}
      {brief.company.description && brief.company.description !== brief.narrative.summary ? <View style={s.section}>
        <Text style={[s.heading, display]} minPresenceAhead={30}>{C.businessContext}</Text><Text>{brief.company.description}</Text>
      </View> : null}
      <View style={s.section}>
        <Text style={[s.heading, display]} minPresenceAhead={40}>{C.proposedBuild}</Text><Text style={s.paragraph}>{brief.narrative.proposal}</Text>
        <View style={s.scopeGrid}>{scope.map((value, index) => <View style={s.scopeNode} key={index}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><ScopeIcon index={index} /><Text style={{ fontSize: 9, fontWeight: 600, color: '#211b2b' }}>{C.scopeLabels[index]}</Text></View><Text style={s.scopeValue}>{value}</Text>
        </View>)}</View>
      </View>
      {caseRows.length || inputRows.length ? <View style={s.section}>
        <Text style={[s.heading, display]} minPresenceAhead={70}>{C.businessCase}</Text>
        {caseRows.length ? <View style={s.stats}>{caseRows.map(([label, value]) => <View style={s.stat} key={label} wrap={false}>
          <Text style={s.meta}>{label}</Text><Text style={[s.statValue, display]}>{value}</Text>
        </View>)}</View> : null}
        <Text style={s.note}>{C.caseNote}</Text>
        {inputRows.length ? <><Text style={[s.subheading, display]} minPresenceAhead={30}>{C.inputs}</Text><Rows rows={inputRows} /></> : null}
        <Text style={s.note}>{C.formula}</Text>
      </View> : null}
      {evidence && evidenceUrl ? <View style={s.section}>
        <Text style={[s.heading, display]} minPresenceAhead={55}>{C.evidence}</Text><View style={s.example}>
          <Text style={[s.exampleName, display]}>{evidence.company}</Text><Text style={s.meta}>{evidence.descriptor}</Text>
          <Text style={s.paragraph}>{evidence.result}</Text><Link src={evidenceUrl} style={s.link}>{evidence.publisher} · {evidence.date}</Link>
          <Text style={s.note}>{evidence.reportedBy === 'company' ? C.companyReported : C.vendorReported}. {C.evidenceNote}</Text>
        </View>
      </View> : null}
      {brief.preparation.length ? <View style={s.section}>
        <Text style={[s.heading, display]} minPresenceAhead={35}>{C.preparation}</Text><Items items={brief.preparation} checklist />
      </View> : null}
      {brief.narrative.assumptions.length ? <View style={s.section}>
        <Text style={[s.heading, display]} minPresenceAhead={35}>{C.assumptions}</Text><Items items={brief.narrative.assumptions} />
      </View> : null}
      {brief.rows.length ? <View style={s.section}>
        <Text style={[s.heading, display]} minPresenceAhead={35}>{C.answers}</Text><Rows rows={brief.rows} />
      </View> : null}
      {source ? <View style={s.section}>
        <Text style={[s.heading, display]} minPresenceAhead={30}>{C.provenance}</Text><Link src={source} style={[s.meta, s.link]}>{source}</Link>
        {brief.company.researchedAt ? <Text style={s.note}>{C.researched} {briefDate(brief.company.researchedAt)}</Text> : null}
      </View> : null}
      <View style={s.call} wrap={false}>
        {assets.john ? <Image src={assets.john} style={s.portrait} /> : null}
        <View><Link src={SPRINT_FIT_CALL_URL} style={[s.callTitle, display]}>{C.book}</Link><Text>{C.john} · {C.johnRole}</Text><Text style={s.meta}>{C.studio}</Text><Text style={s.note}>{C.bookingNote}</Text></View>
      </View>
      <Text fixed style={{ position: 'absolute', bottom: 24, left: 40, width: 410, fontSize: 7, color: '#6b6375' }}>{C.footer}</Text>
    </Page>
  </Document>
}
