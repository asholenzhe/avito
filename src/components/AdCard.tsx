import { Link } from 'react-router-dom'
import type { ItemListEntry } from '../types/item'
import { CATEGORY_LABELS } from '../utils/category'
import { formatPriceRub } from '../utils/format'
import { PlaceholderImage } from './PlaceholderImage'
import styles from './AdCard.module.css'

export function AdCard({
  item,
  layout,
}: {
  item: ItemListEntry
  layout: 'grid' | 'list'
}) {
  const cat = CATEGORY_LABELS[item.category]
  return (
    <Link
      to={`/ads/${item.id}`}
      className={[styles.card, layout === 'list' ? styles.list : styles.grid].join(' ')}
    >
      <PlaceholderImage label="Изображение (placeholder)" className={styles.img} />
      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.cat}>{cat}</span>
          {item.needsRevision ? (
            <span className={styles.badge}>Требует доработок</span>
          ) : null}
        </div>
        <div className={styles.title}>{item.title}</div>
        <div className={styles.price}>{formatPriceRub(item.price)}</div>
      </div>
    </Link>
  )
}
