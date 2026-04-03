import styles from './PlaceholderImage.module.css'

export function PlaceholderImage({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <div
      className={[styles.box, className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      <div className={styles.inner}>
        <div className={styles.icon} />
        <div className={styles.text}>{label}</div>
      </div>
    </div>
  )
}
