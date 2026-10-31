import { Button } from '@/src/components/prism'
import { Headphones, Network, MessagesSquare, BookOpen, UsersRound, GraduationCap, Workflow, ChartNoAxesCombined } from 'lucide-react'
import { LogoRow } from '@/src/components/proof/LogoRow'
import { SPRINT_INTRO as C } from '@/src/sprint-intro-content'
import styles from './intro.module.css'

const exampleIcons = [[Headphones, Network, MessagesSquare, BookOpen], [UsersRound, GraduationCap, Workflow, ChartNoAxesCombined]]

export function SprintIntro({ onStart }: { onStart: () => void }) {
  return <div className={styles.intro}>
    <section className={styles.hero}>
      <video className={styles.heroVideo} autoPlay muted loop playsInline aria-hidden="true" poster="/assets/imagery/homepage/prism-glass-grid.webp"><source src="/assets/sprint-fit/prism-loop.mp4" type="video/mp4" /></video>
      <div className={styles.heroInner}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{C.eyebrow}</p>
          <h1>{C.title}</h1>
          <p className={styles.lead}>{C.description}</p>
          <p>{C.deliverables}</p>
          <Button type="button" onClick={onStart} showArrow>{C.start}</Button>
        </div>
        <figure className={styles.preview}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static sample brief */}
          <img src="/assets/sprint-fit/sample-brief.png" alt={C.previewAlt} />
          <figcaption>{C.previewLabel}</figcaption>
        </figure>
      </div>
    </section>
    <div className={styles.container}>
      <LogoRow className={styles.logos} />
      <section className={styles.examples}>
        <p className={styles.eyebrow}>{C.exampleEyebrow}</p>
        <h2>{C.exampleTitle}</h2>
        <p>{C.exampleNote}</p>
        <div className={styles.exampleGrid}>{C.examples.map((group, groupIndex) => <div key={group.period}><h3>{group.period}</h3><ul>{group.items.map((item, itemIndex) => { const Icon = exampleIcons[groupIndex][itemIndex]; return <li key={item}><Icon aria-hidden="true" size={20} /><span>{item}</span></li> })}</ul></div>)}</div>
      </section>
      <blockquote className={styles.testimonial}><p>“{C.testimonial.quote}”</p><footer>{C.testimonial.attribution}</footer></blockquote>
      <section className={styles.team}>
        <h2>{C.teamTitle}</h2><p>{C.teamIntro}</p>
        <div className={styles.teamGrid}>{C.team.map(person => <div className={styles.person} key={person.name}>
          <img src={person.photo} alt={person.name} width="80" height="80" />
          <div><strong>{person.name}</strong><small>{person.role}</small></div>
        </div>)}</div>
      </section>
      <section className={styles.closing}><h2>{C.finalTitle}</h2><Button type="button" onClick={onStart} showArrow>{C.start}</Button></section>
    </div>
  </div>
}
