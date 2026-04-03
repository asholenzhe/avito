import styles from './LoadingState.module.css'

export function LoadingState({ label = 'Загрузка…' }: { label?: string }) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <div className={styles.spinner} />
      <div className={styles.label}>{label}</div>
    </div>
  )
}
