import { Button } from '@/src/components/prism'
import { LogoRow } from '@/src/components/proof/LogoRow'
import { SPRINT_INTRO as C } from '@/src/sprint-intro-content'
import styles from './intro.module.css'

export function SprintIntro({ onStart }: { onStart: () => void }) {
  return <div className={styles.intro}>
    <section className={styles.hero}>
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
        <div className={styles.exampleGrid}>{C.examples.map(group => <div key={group.period}><h3>{group.period}</h3><ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul></div>)}</div>
      </section>
      <section className={styles.team}>
        <h2>{C.teamTitle}</h2><p>{C.teamIntro}</p>
        <div className={styles.teamGrid}>{C.team.map(person => <div className={styles.person} key={person.name}>
          {person.photo ? <img src={person.photo} alt="" width="80" height="80" /> : <span aria-hidden>{person.name[0]}</span>}
          <div><strong>{person.name}</strong><small>{person.role}</small></div>
        </div>)}</div>
      </section>
      <section className={styles.closing}><h2>{C.finalTitle}</h2><Button type="button" onClick={onStart} showArrow>{C.start}</Button></section>
    </div>
  </div>
}
