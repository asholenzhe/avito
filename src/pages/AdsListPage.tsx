import { useEffect, useMemo, useState } from 'react'
import { fetchItems } from '../api/itemsApi'
import { AdCard } from '../components/AdCard'
import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { PaginationBar } from '../components/PaginationBar'
import { useLayoutStore } from '../store/layoutStore'
import type { Category } from '../types/item'
import { CATEGORY_LABELS, CATEGORIES } from '../utils/category'
import styles from './AdsListPage.module.css'

const PAGE_SIZE = 10

type SortKey =
  | 'createdAt_desc'
  | 'createdAt_asc'
  | 'price_desc'
  | 'price_asc'
  | 'title_asc'
  | 'title_desc'

function sortToApi(sort: SortKey) {
  if (sort.startsWith('price')) {
    return {
      sortColumn: 'price' as const,
      sortDirection: sort.endsWith('asc') ? ('asc' as const) : ('desc' as const),
    }
  }
  if (sort.startsWith('title')) {
    return {
      sortColumn: 'title' as const,
      sortDirection: sort.endsWith('asc') ? ('asc' as const) : ('desc' as const),
    }
  }
  return {
    sortColumn: 'createdAt' as const,
    sortDirection: sort.endsWith('asc') ? ('asc' as const) : ('desc' as const),
  }
}

export function AdsListPage() {
  const adsLayout = useLayoutStore((s) => s.adsLayout)
  const setAdsLayout = useLayoutStore((s) => s.setAdsLayout)

  const [searchInput, setSearchInput] = useState('')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('createdAt_desc')
  const [categories, setCategories] = useState<Category[]>([])
  const [needsOnly, setNeedsOnly] = useState(false)
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [items, setItems] = useState<Awaited<ReturnType<typeof fetchItems>>['items']>(
    [],
  )

  useEffect(() => {
    const t = window.setTimeout(() => setQ(searchInput.trim()), 300)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [q, sort, categories, needsOnly])

  const apiSort = useMemo(() => sortToApi(sort), [sort])

  useEffect(() => {
    const ac = new AbortController()
    setLoading(true)
    setError(null)
    fetchItems(
      {
        q: q || undefined,
        limit: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
        needsRevision: needsOnly ? true : undefined,
        categories: categories.length ? categories : undefined,
        sortColumn: apiSort.sortColumn,
        sortDirection: apiSort.sortDirection,
      },
      ac.signal,
    )
      .then((res) => {
        setItems(res.items)
        setTotal(res.total)
      })
      .catch((e: unknown) => {
        if (ac.signal.aborted) return
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
  }, [q, page, sort, categories, needsOnly, apiSort.sortColumn, apiSort.sortDirection])

  function resetFilters() {
    setSearchInput('')
    setQ('')
    setSort('createdAt_desc')
    setCategories([])
    setNeedsOnly(false)
    setPage(1)
  }

  function toggleCategory(c: Category) {
    setCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.h1}>Мои объявления</h1>
          <div className={styles.sub}>
            Всего объявлений: <b>{total}</b>
          </div>
        </div>

        <div className={styles.toolbar}>
          <input
            className={styles.search}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Поиск по названию"
            aria-label="Поиск по названию"
          />
          <label className={styles.field}>
            <span className={styles.muted}>Сортировка</span>
            <select
              className={styles.select}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="createdAt_desc">По новизне (сначала новые)</option>
              <option value="createdAt_asc">По новизне (сначала старые)</option>
              <option value="price_asc">По цене (возрастание)</option>
              <option value="price_desc">По цене (убывание)</option>
              <option value="title_asc">По названию (А→Я)</option>
              <option value="title_desc">По названию (Я→А)</option>
            </select>
          </label>
          <div className={styles.layoutToggle} role="group" aria-label="Вид списка">
            <button
              type="button"
              className={adsLayout === 'grid' ? styles.segActive : styles.seg}
              onClick={() => setAdsLayout('grid')}
            >
              Сетка
            </button>
            <button
              type="button"
              className={adsLayout === 'list' ? styles.segActive : styles.seg}
              onClick={() => setAdsLayout('list')}
            >
              Список
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <aside className={styles.aside}>
          <div className={styles.asideTitle}>Фильтры</div>
          <div className={styles.filterBlock}>
            <div className={styles.muted}>Категория</div>
            <div className={styles.chips}>
              {CATEGORIES.map((c) => (
                <label key={c} className={styles.chip}>
                  <input
                    type="checkbox"
                    checked={categories.includes(c)}
                    onChange={() => toggleCategory(c)}
                  />
                  <span>{CATEGORY_LABELS[c]}</span>
                </label>
              ))}
            </div>
          </div>

          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={needsOnly}
              onChange={(e) => setNeedsOnly(e.target.checked)}
            />
            Только требующие доработок
          </label>

          <button type="button" className={styles.reset} onClick={resetFilters}>
            Сбросить фильтры
          </button>
        </aside>

        <section className={styles.main}>
          {loading ? <LoadingState /> : null}
          {!loading && error ? (
            <ErrorState
              message={error}
              onRetry={() => {
                setError(null)
                setLoading(true)
                void fetchItems({
                  q: q || undefined,
                  limit: PAGE_SIZE,
                  skip: (page - 1) * PAGE_SIZE,
                  needsRevision: needsOnly ? true : undefined,
                  categories: categories.length ? categories : undefined,
                  sortColumn: apiSort.sortColumn,
                  sortDirection: apiSort.sortDirection,
                })
                  .then((res) => {
                    setItems(res.items)
                    setTotal(res.total)
                  })
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
          ) : null}

          {!loading && !error ? (
            items.length ? (
              <div className={adsLayout === 'grid' ? styles.grid : styles.list}>
                {items.map((it) => (
                  <AdCard key={it.id} item={it} layout={adsLayout} />
                ))}
              </div>
            ) : (
              <div className={styles.empty}>Ничего не найдено</div>
            )
          ) : null}

          {!loading && !error && total > 0 ? (
            <PaginationBar
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          ) : null}
        </section>
      </div>
    </div>
  )
}
