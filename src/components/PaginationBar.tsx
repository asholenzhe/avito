import styles from './PaginationBar.module.css'

export function PaginationBar({
  page,
  pageSize,
  total,
  onPrev,
  onNext,
}: {
  page: number
  pageSize: number
  total: number
  onPrev: () => void
  onNext: () => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.btn} onClick={onPrev} disabled={!canPrev}>
        Назад
      </button>
      <div className={styles.info}>
        Страница {page} из {totalPages} · {total} объявлений
      </div>
      <button type="button" className={styles.btn} onClick={onNext} disabled={!canNext}>
        Вперёд
      </button>
    </div>
  )
}
