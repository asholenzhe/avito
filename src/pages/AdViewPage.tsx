import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchItemById } from '../api/itemsApi'
import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { PlaceholderImage } from '../components/PlaceholderImage'
import type { ItemFull } from '../types/item'
import { CATEGORY_LABELS } from '../utils/category'
import { formatDateRu, formatPriceRub } from '../utils/format'
import { isAbortError } from '../utils/abort'
import { missingFieldLabels } from '../utils/revision'
import styles from './AdViewPage.module.css'

function ParamsTable({ item }: { item: ItemFull }) {
  if (item.category === 'electronics') {
    const p = item.params as import('../types/item').ElectronicsItemParams
    const rows = [
      [
        'Тип',
        p.type === 'phone'
          ? 'Телефон'
          : p.type === 'laptop'
            ? 'Ноутбук'
            : p.type === 'misc'
              ? 'Другое'
              : '—',
      ],
      ['Бренд', p.brand || '—'],
      ['Модель', p.model || '—'],
      [
        'Состояние',
        p.condition === 'new' ? 'Новое' : p.condition === 'used' ? 'Б/у' : '—',
      ],
      ['Цвет', p.color || '—'],
    ]
    return (
      <table className={styles.table}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <th>{k}</th>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  if (item.category === 'auto') {
    const p = item.params as import('../types/item').AutoItemParams
    const rows = [
      ['Марка', p.brand || '—'],
      ['Модель', p.model || '—'],
      ['Год', p.yearOfManufacture != null ? String(p.yearOfManufacture) : '—'],
      [
        'Коробка',
        p.transmission === 'automatic'
          ? 'Автомат'
          : p.transmission === 'manual'
            ? 'Механика'
            : '—',
      ],
      ['Пробег', p.mileage != null ? `${p.mileage.toLocaleString('ru-RU')} км` : '—'],
      ['Мощность', p.enginePower != null ? `${p.enginePower} л.с.` : '—'],
    ]
    return (
      <table className={styles.table}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <th>{k}</th>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  const p = item.params as import('../types/item').RealEstateItemParams
  const rows = [
    [
      'Тип',
      p.type === 'flat'
        ? 'Квартира'
        : p.type === 'house'
          ? 'Дом'
          : p.type === 'room'
            ? 'Комната'
            : '—',
    ],
    ['Адрес', p.address || '—'],
    ['Площадь', p.area != null ? `${p.area} м²` : '—'],
    ['Этаж', p.floor != null ? String(p.floor) : '—'],
  ]
  return (
    <table className={styles.table}>
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <th>{k}</th>
            <td>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function AdViewPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [item, setItem] = useState<ItemFull | null>(null)

  useEffect(() => {
    if (!id) return
    const ac = new AbortController()
    setLoading(true)
    setError(null)
    fetchItemById(id, ac.signal)
      .then(setItem)
      .catch((e: unknown) => {
        if (isAbortError(e)) return
        const msg =
          e && typeof e === 'object' && 'message' in e
            ? String((e as { message?: unknown }).message)
            : 'Неизвестная ошибка'
        setError(msg)
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })
    return () => ac.abort()
  }, [id])

  if (!id) return <ErrorState message="Не указан идентификатор объявления" />

  if (loading) return <LoadingState />

  if (error || !item) {
    return (
      <ErrorState
        message={error || 'Объявление не найдено'}
        onRetry={() => {
          setError(null)
          setLoading(true)
          void fetchItemById(id)
            .then(setItem)
            .catch((e: unknown) => {
              const msg =
                e && typeof e === 'object' && 'message' in e
                  ? String((e as { message?: unknown }).message)
                  : 'Неизвестная ошибка'
              setError(msg)
            })
            .finally(() => setLoading(false))
        }}
      />
    )
  }

  const missing = missingFieldLabels(item)

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <Link className={styles.back} to="/ads">
          ← К списку объявлений
        </Link>
        <div className={styles.actions}>
          <Link className={styles.primary} to={`/ads/${item.id}/edit`}>
            Редактировать
          </Link>
        </div>
      </div>

      <div className={styles.grid}>
        <PlaceholderImage label="Фото товара (placeholder)" />

        <div className={styles.info}>
          <div className={styles.kicker}>{CATEGORY_LABELS[item.category]}</div>
          <h1 className={styles.title}>{item.title}</h1>
          <div className={styles.price}>{formatPriceRub(item.price)}</div>
          <div className={styles.date}>
            Дата публикации: {formatDateRu(item.createdAt)}
          </div>

          {missing.length ? (
            <div className={styles.warn} role="status">
              <div className={styles.warnTitle}>Требуются доработки</div>
              <ul className={styles.list}>
                {missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <h2 className={styles.h2}>Характеристики</h2>
          <ParamsTable item={item} />

          <h2 className={styles.h2}>Описание</h2>
          <div className={styles.desc}>
            {item.description?.trim() ? item.description : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}
