import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchItemById, updateItem } from '../api/itemsApi'
import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { TextDiff } from '../components/TextDiff'
import { chatReply, suggestDescription, suggestMarketPrice } from '../services/llm'
import { useChatStore, type ChatMessage } from '../store/chatStore'
import type {
  AutoItemParams,
  Category,
  ElectronicsItemParams,
  ItemFull,
  ItemUpdateIn,
  RealEstateItemParams,
} from '../types/item'
import { isAbortError } from '../utils/abort'
import { CATEGORY_LABELS, CATEGORIES } from '../utils/category'
import { cleanParams, defaultParamsForCategory } from '../utils/params'
import styles from './AdEditPage.module.css'

type Draft = {
  category: Category
  title: string
  price: string
  description: string
  params: AutoItemParams & RealEstateItemParams & ElectronicsItemParams
}

function toDraft(item: ItemFull): Draft {
  return {
    category: item.category,
    title: item.title,
    price: String(item.price),
    description: item.description || '',
    params: {
      ...(defaultParamsForCategory(item.category) as Draft['params']),
      ...(item.params as object),
    } as Draft['params'],
  }
}

function draftKey(id: string) {
  return `ad-draft-${id}`
}

export function AdEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [baseItem, setBaseItem] = useState<ItemFull | null>(null)

  const [form, setForm] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)

  const [aiBusy, setAiBusy] = useState<'desc' | 'price' | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [pendingDesc, setPendingDesc] = useState<string | null>(null)
  const [pendingPrice, setPendingPrice] = useState<string | null>(null)

  const [chatInput, setChatInput] = useState('')
  const [chatBusy, setChatBusy] = useState(false)

  const chatMessages = useChatStore((s) => (id ? s.byAdId[id] || [] : []))
  const pushChat = useChatStore((s) => s.push)

  const aiAbort = useRef<AbortController | null>(null)
  const chatAbort = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!id) return
    const ac = new AbortController()
    setLoading(true)
    setError(null)
    fetchItemById(id, ac.signal)
      .then((item) => {
        setBaseItem(item)
        const fromStorage = localStorage.getItem(draftKey(id))
        if (fromStorage) {
          try {
            const parsed = JSON.parse(fromStorage) as Draft
            setForm(parsed)
          } catch {
            setForm(toDraft(item))
          }
        } else {
          setForm(toDraft(item))
        }
      })
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

  useEffect(() => {
    if (!id || !form) return
    const t = window.setTimeout(() => {
      localStorage.setItem(draftKey(id), JSON.stringify(form))
    }, 400)
    return () => window.clearTimeout(t)
  }, [id, form])

  const cardContext = useMemo(() => {
    if (!form) return ''
    return [
      `Категория: ${CATEGORY_LABELS[form.category]}`,
      `Название: ${form.title}`,
      `Цена: ${form.price}`,
      `Описание: ${form.description}`,
      `Параметры: ${JSON.stringify(form.params)}`,
    ].join('\n')
  }, [form])

  function setParams(next: Record<string, unknown>) {
    setForm((f) =>
      f
        ? {
            ...f,
            params: { ...f.params, ...next } as Draft['params'],
          }
        : f,
    )
  }

  async function onSave() {
    if (!id || !form) return
    setSaving(true)
    setError(null)
    const ac = new AbortController()
    try {
      const priceNum = Number(String(form.price).replace(/\s/g, ''))
      if (!form.title.trim() || !Number.isFinite(priceNum)) {
        throw new Error('Проверьте название и цену')
      }
      const body: ItemUpdateIn = {
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim() ? form.description.trim() : undefined,
        price: priceNum,
        params: cleanParams(form.category, form.params),
      }
      await updateItem(id, body, ac.signal)
      localStorage.removeItem(draftKey(id))
      navigate(`/ads/${id}`)
    } catch (e: unknown) {
      if (isAbortError(e)) return
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message?: unknown }).message)
          : 'Не удалось сохранить'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  function onCancel() {
    if (!id) return
    navigate(`/ads/${id}`)
  }

  async function onAiDescription() {
    if (!form) return
    aiAbort.current?.abort()
    const ac = new AbortController()
    aiAbort.current = ac
    setAiBusy('desc')
    setAiError(null)
    try {
      const mode = form.description.trim() ? 'improve' : 'create'
      const text = await suggestDescription(
        {
          category: form.category,
          title: form.title,
          price: Number(form.price) || 0,
          description: form.description,
          params: form.params,
        },
        mode,
        ac.signal,
      )
      setPendingDesc(text)
    } catch (e: unknown) {
      if (isAbortError(e)) return
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message?: unknown }).message)
          : 'Ошибка LLM'
      setAiError(msg)
    } finally {
      setAiBusy(null)
    }
  }

  async function onAiPrice() {
    if (!form) return
    aiAbort.current?.abort()
    const ac = new AbortController()
    aiAbort.current = ac
    setAiBusy('price')
    setAiError(null)
    try {
      const text = await suggestMarketPrice(
        {
          category: form.category,
          title: form.title,
          price: Number(form.price) || 0,
          description: form.description,
          params: form.params,
        },
        ac.signal,
      )
      setPendingPrice(text)
    } catch (e: unknown) {
      if (isAbortError(e)) return
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message?: unknown }).message)
          : 'Ошибка LLM'
      setAiError(msg)
    } finally {
      setAiBusy(null)
    }
  }

  useEffect(() => {
    return () => {
      aiAbort.current?.abort()
      chatAbort.current?.abort()
    }
  }, [])

  async function onSendChat() {
    if (!id || !form || !chatInput.trim()) return
    const userMsg: ChatMessage = { role: 'user', content: chatInput.trim() }
    pushChat(id, userMsg)
    setChatInput('')
    setChatBusy(true)
    chatAbort.current?.abort()
    const ac = new AbortController()
    chatAbort.current = ac
    const history: ChatMessage[] = [...chatMessages, userMsg]
    try {
      const answer = await chatReply(
        history.map((m) => ({ role: m.role, content: m.content })),
        cardContext,
        ac.signal,
      )
      pushChat(id, { role: 'assistant', content: answer })
    } catch (e: unknown) {
      if (isAbortError(e)) return
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message?: unknown }).message)
          : 'Ошибка LLM'
      pushChat(id, { role: 'assistant', content: `Ошибка: ${msg}` })
    } finally {
      setChatBusy(false)
    }
  }

  if (!id) return <ErrorState message="Не указан идентификатор объявления" />
  if (loading || !form) return <LoadingState />
  if (error && !baseItem) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />
  }

  const descMode = form.description.trim() ? 'improve' : 'create'

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <Link className={styles.back} to={`/ads/${id}`}>
          ← К объявлению
        </Link>
        <div className={styles.hint}>
          Черновик сохраняется автоматически в этом браузере
        </div>
      </div>

      <div className={styles.layout}>
        <section className={styles.form}>
          <h1 className={styles.h1}>Редактирование</h1>

          {error ? <div className={styles.inlineError}>{error}</div> : null}

          <label className={styles.field}>
            <div className={styles.label}>Категория</div>
            <select
              className={styles.input}
              value={form.category}
              onChange={(e) => {
                const category = e.target.value as Category
                setForm({
                  ...form,
                  category,
                  params: defaultParamsForCategory(category) as Draft['params'],
                })
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <div className={styles.label}>Название</div>
            <input
              className={styles.input}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>

          <label className={styles.field}>
            <div className={styles.label}>Цена (₽)</div>
            <input
              className={styles.input}
              inputMode="numeric"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </label>

          <div className={styles.field}>
            <div className={styles.label}>Характеристики</div>
            <ParamsEditor
              category={form.category}
              params={form.params}
              onChange={setParams}
            />
          </div>

          <label className={styles.field}>
            <div className={styles.label}>
              Описание{' '}
              <span className={styles.counter}>{form.description.length} симв.</span>
            </div>
            <textarea
              className={styles.textarea}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={8}
            />
          </label>

          <div className={styles.aiRow}>
            <button
              type="button"
              className={styles.aiBtn}
              onClick={onAiDescription}
              disabled={!!aiBusy}
            >
              {descMode === 'create' ? 'Придумать описание' : 'Улучшить описание'}
            </button>
            <button
              type="button"
              className={styles.aiBtn}
              onClick={onAiPrice}
              disabled={!!aiBusy}
            >
              Узнать рыночную цену
            </button>
          </div>

          {aiError ? <div className={styles.inlineError}>{aiError}</div> : null}

          {pendingDesc ? (
            <div className={styles.panel}>
              <div className={styles.panelTitle}>Предложение AI</div>
              <TextDiff before={form.description} after={pendingDesc} />
              <div className={styles.row}>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => {
                    setForm({ ...form, description: pendingDesc })
                    setPendingDesc(null)
                  }}
                >
                  Применить
                </button>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() => setPendingDesc(null)}
                >
                  Отклонить
                </button>
              </div>
            </div>
          ) : null}

          {pendingPrice ? (
            <div className={styles.panel}>
              <div className={styles.panelTitle}>Оценка рыночной цены</div>
              <div className={styles.priceHint}>
                Предложение: <b>{pendingPrice}</b> ₽
              </div>
              <div className={styles.row}>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => {
                    setForm({ ...form, price: String(pendingPrice) })
                    setPendingPrice(null)
                  }}
                >
                  Подставить в поле цены
                </button>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() => setPendingPrice(null)}
                >
                  Закрыть
                </button>
              </div>
            </div>
          ) : null}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              onClick={onSave}
              disabled={saving}
            >
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
            <button
              type="button"
              className={styles.ghost}
              onClick={onCancel}
              disabled={saving}
            >
              Отменить
            </button>
          </div>
        </section>

        <aside className={styles.chat} aria-label="Чат с AI">
          <div className={styles.chatTitle}>Чат с AI</div>
          <div className={styles.chatBody}>
            {chatMessages.length ? (
              chatMessages.map((m, idx) => (
                <div
                  key={`${idx}-${m.role}`}
                  className={m.role === 'user' ? styles.bubbleUser : styles.bubbleAi}
                >
                  {m.content}
                </div>
              ))
            ) : (
              <div className={styles.chatEmpty}>
                Задайте вопрос об этом объявлении — контекст карточки передаётся
                автоматически.
              </div>
            )}
            {chatBusy ? <div className={styles.typing}>AI печатает…</div> : null}
          </div>
          <div className={styles.chatComposer}>
            <input
              className={styles.chatInput}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Сообщение…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void onSendChat()
              }}
            />
            <button
              type="button"
              className={styles.chatSend}
              onClick={() => void onSendChat()}
              disabled={chatBusy || !chatInput.trim()}
            >
              Отправить
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ParamsEditor({
  category,
  params,
  onChange,
}: {
  category: Category
  params: Draft['params']
  onChange: (p: Record<string, unknown>) => void
}) {
  if (category === 'electronics') {
    const p = params as ElectronicsItemParams
    return (
      <div className={styles.params}>
        <label className={styles.mini}>
          Тип
          <select
            className={styles.input}
            value={p.type || ''}
            onChange={(e) =>
              onChange({
                type: e.target.value
                  ? (e.target.value as ElectronicsItemParams['type'])
                  : undefined,
              })
            }
          >
            <option value="">—</option>
            <option value="phone">Телефон</option>
            <option value="laptop">Ноутбук</option>
            <option value="misc">Другое</option>
          </select>
        </label>
        <label className={styles.mini}>
          Бренд
          <input
            className={styles.input}
            value={p.brand || ''}
            onChange={(e) => onChange({ brand: e.target.value })}
          />
        </label>
        <label className={styles.mini}>
          Модель
          <input
            className={styles.input}
            value={p.model || ''}
            onChange={(e) => onChange({ model: e.target.value })}
          />
        </label>
        <label className={styles.mini}>
          Состояние
          <select
            className={styles.input}
            value={p.condition || ''}
            onChange={(e) =>
              onChange({
                condition: e.target.value
                  ? (e.target.value as ElectronicsItemParams['condition'])
                  : undefined,
              })
            }
          >
            <option value="">—</option>
            <option value="new">Новое</option>
            <option value="used">Б/у</option>
          </select>
        </label>
        <label className={styles.mini}>
          Цвет
          <input
            className={styles.input}
            value={p.color || ''}
            onChange={(e) => onChange({ color: e.target.value })}
          />
        </label>
      </div>
    )
  }

  if (category === 'auto') {
    const p = params as AutoItemParams
    return (
      <div className={styles.params}>
        <label className={styles.mini}>
          Марка
          <input
            className={styles.input}
            value={p.brand || ''}
            onChange={(e) => onChange({ brand: e.target.value })}
          />
        </label>
        <label className={styles.mini}>
          Модель
          <input
            className={styles.input}
            value={p.model || ''}
            onChange={(e) => onChange({ model: e.target.value })}
          />
        </label>
        <label className={styles.mini}>
          Год
          <input
            className={styles.input}
            inputMode="numeric"
            value={p.yearOfManufacture ?? ''}
            onChange={(e) =>
              onChange({
                yearOfManufacture: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </label>
        <label className={styles.mini}>
          Коробка
          <select
            className={styles.input}
            value={p.transmission || ''}
            onChange={(e) =>
              onChange({
                transmission: e.target.value
                  ? (e.target.value as AutoItemParams['transmission'])
                  : undefined,
              })
            }
          >
            <option value="">—</option>
            <option value="automatic">Автомат</option>
            <option value="manual">Механика</option>
          </select>
        </label>
        <label className={styles.mini}>
          Пробег (км)
          <input
            className={styles.input}
            inputMode="numeric"
            value={p.mileage ?? ''}
            onChange={(e) =>
              onChange({
                mileage: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </label>
        <label className={styles.mini}>
          Мощность (л.с.)
          <input
            className={styles.input}
            inputMode="numeric"
            value={p.enginePower ?? ''}
            onChange={(e) =>
              onChange({
                enginePower: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </label>
      </div>
    )
  }

  const p = params as RealEstateItemParams
  return (
    <div className={styles.params}>
      <label className={styles.mini}>
        Тип
        <select
          className={styles.input}
          value={p.type || ''}
          onChange={(e) =>
            onChange({
              type: e.target.value
                ? (e.target.value as RealEstateItemParams['type'])
                : undefined,
            })
          }
        >
          <option value="">—</option>
          <option value="flat">Квартира</option>
          <option value="house">Дом</option>
          <option value="room">Комната</option>
        </select>
      </label>
      <label className={styles.mini}>
        Адрес
        <input
          className={styles.input}
          value={p.address || ''}
          onChange={(e) => onChange({ address: e.target.value })}
        />
      </label>
      <label className={styles.mini}>
        Площадь (м²)
        <input
          className={styles.input}
          inputMode="decimal"
          value={p.area ?? ''}
          onChange={(e) =>
            onChange({ area: e.target.value ? Number(e.target.value) : undefined })
          }
        />
      </label>
      <label className={styles.mini}>
        Этаж
        <input
          className={styles.input}
          inputMode="numeric"
          value={p.floor ?? ''}
          onChange={(e) =>
            onChange({ floor: e.target.value ? Number(e.target.value) : undefined })
          }
        />
      </label>
    </div>
  )
}
