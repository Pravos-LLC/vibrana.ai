import React from 'react'
import { Document, Font, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
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
  page: { padding: 40, paddingBottom: 57, color: '#211b2b', fontSize: 10, lineHeight: 1.55 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.6, borderBottomColor: '#e8e3ed', paddingBottom: 16, marginBottom: 26 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { width: 27, height: 27, objectFit: 'contain' },
  wordmark: { fontSize: 12, letterSpacing: 0.4 },
  meta: { fontSize: 8, color: '#6b6375' },
  company: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 9 },
  logo: { width: 56, height: 36, objectFit: 'contain' },
  eyebrow: { fontSize: 7, color: '#7131ca', letterSpacing: 0.8, textTransform: 'uppercase' },
  companyName: { fontSize: 16, marginTop: 3 },
  title: { fontSize: 34, lineHeight: 1.1, letterSpacing: -1, marginTop: 13, marginBottom: 15 },
  intro: { fontSize: 12, color: '#51475e', marginBottom: 4 },
  section: { marginTop: 22, paddingTop: 17, borderTopWidth: 0.6, borderTopColor: '#e8e3ed' },
  heading: { fontSize: 16, lineHeight: 1.2, marginBottom: 11, letterSpacing: -0.3 },
  subheading: { fontSize: 11, marginTop: 14, marginBottom: 7 },
  paragraph: { marginBottom: 8 },
  scopeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 9 },
  scopeNode: { width: '47%', paddingTop: 8, borderTopWidth: 1.4, borderTopColor: '#bda4e2' },
  scopeValue: { fontSize: 11, marginTop: 5 },
  stats: { backgroundColor: '#f5f1fa', padding: 15, flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
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
function Items({ items }: { items: string[] }) {
  return <View>{items.map((item, index) => <View key={index} style={s.listRow}>
    <Text style={s.bullet}>•</Text><Text style={s.listText}>{item}</Text>
  </View>)}</View>
}

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
      {brief.narrative.summary ? <Text style={s.intro}>{brief.narrative.summary}</Text> : null}
      {brief.company.description && brief.company.description !== brief.narrative.summary ? <View style={s.section}>
        <Text style={[s.heading, display]} minPresenceAhead={30}>{C.businessContext}</Text><Text>{brief.company.description}</Text>
      </View> : null}
      <View style={s.section}>
        <Text style={[s.heading, display]} minPresenceAhead={40}>{C.proposedBuild}</Text><Text style={s.paragraph}>{brief.narrative.proposal}</Text>
        <View style={s.scopeGrid}>{scope.map((value, index) => <View style={s.scopeNode} key={index}>
          <Text style={s.meta}>{C.scopeLabels[index]}</Text><Text style={s.scopeValue}>{value}</Text>
        </View>)}</View>
      </View>
      {caseRows.length || inputRows.length ? <View style={s.section} wrap={false}>
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
        <Text style={[s.heading, display]} minPresenceAhead={35}>{C.preparation}</Text><Items items={brief.preparation} />
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
        <View><Link src={SPRINT_FIT_CALL_URL} style={[s.callTitle, display]}>{C.book}</Link><Text>{C.john} · {C.studio}</Text><Text style={s.note}>{C.bookingNote}</Text></View>
      </View>
      <Text fixed style={{ position: 'absolute', bottom: 24, left: 40, width: 430, fontSize: 7, color: '#6b6375' }}>{C.footer}</Text>
    </Page>
  </Document>
}
