import { diffWordsWithSpace } from 'diff'
import styles from './TextDiff.module.css'

export function TextDiff({ before, after }: { before: string; after: string }) {
  const parts = diffWordsWithSpace(before, after)
  const left = parts.filter((p) => !p.added)
  const right = parts.filter((p) => !p.removed)
  return (
    <div className={styles.grid}>
      <div className={styles.col}>
        <div className={styles.h}>Было</div>
        <div className={styles.box}>
          {left.map((p, i) => (
            <span
              key={`b-${i}-${p.value.slice(0, 24)}`}
              className={p.removed ? styles.removed : undefined}
            >
              {p.value}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.col}>
        <div className={styles.h}>Стало</div>
        <div className={styles.box}>
          {right.map((p, i) => (
            <span
              key={`a-${i}-${p.value.slice(0, 24)}`}
              className={p.added ? styles.added : undefined}
            >
              {p.value}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
