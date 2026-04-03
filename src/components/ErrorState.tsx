import styles from './ErrorState.module.css'

export function ErrorState({
  title = 'Не удалось загрузить данные',
  message,
  onRetry,
}: {
  title?: string
  message: string
  onRetry?: () => void
}) {
  return (
    <div className={styles.wrap} role="alert">
      <div className={styles.title}>{title}</div>
      <div className={styles.msg}>{message}</div>
      {onRetry ? (
        <button type="button" className={styles.btn} onClick={onRetry}>
          Повторить
        </button>
      ) : null}
    </div>
  )
}
