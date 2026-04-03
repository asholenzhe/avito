import type { Category, ItemParams } from '../types/item'
import { CATEGORY_LABELS } from '../utils/category'

export type LlmMode = 'ollama' | 'compat'

function getCompatConfig() {
  const url = import.meta.env.VITE_LLM_COMPAT_URL?.trim()
  const key = import.meta.env.VITE_LLM_COMPAT_KEY?.trim()
  if (url && key) return { url, key }
  return null
}

function buildContextSnippet(
  category: Category,
  title: string,
  price: number,
  description: string,
  params: ItemParams,
) {
  const cat = CATEGORY_LABELS[category]
  return [
    `Категория: ${cat}`,
    `Название: ${title}`,
    `Цена: ${price} ₽`,
    `Описание: ${description || '(пусто)'}`,
    `Характеристики (JSON): ${JSON.stringify(params)}`,
  ].join('\n')
}

async function callOllama(prompt: string, signal?: AbortSignal): Promise<string> {
  const model = import.meta.env.VITE_OLLAMA_MODEL || 'llama3'
  const res = await fetch('/ollama/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
    signal,
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Ollama: ${res.status}`)
  }
  const json = (await res.json()) as { response?: string }
  return (json.response || '').trim()
}

async function callOpenAiCompatible(
  prompt: string,
  signal?: AbortSignal,
): Promise<string> {
  const cfg = getCompatConfig()
  if (!cfg) throw new Error('Не настроен LLM (Ollama или VITE_LLM_COMPAT_*)')

  const model = import.meta.env.VITE_LLM_COMPAT_MODEL?.trim() || 'grok-2-latest'

  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.key}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
    }),
    signal,
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `LLM: ${res.status}`)
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  return (json.choices?.[0]?.message?.content || '').trim()
}

async function generate(prompt: string, signal?: AbortSignal): Promise<string> {
  const compat = getCompatConfig()
  if (compat) return callOpenAiCompatible(prompt, signal)
  return callOllama(prompt, signal)
}

export async function suggestDescription(
  input: {
    category: Category
    title: string
    price: number
    description: string
    params: ItemParams
  },
  mode: 'create' | 'improve',
  signal?: AbortSignal,
): Promise<string> {
  const ctx = buildContextSnippet(
    input.category,
    input.title,
    input.price,
    input.description,
    input.params,
  )
  const task =
    mode === 'create'
      ? 'Сформируй продающее описание для объявления на русском, 4–8 предложений, без Markdown и без заголовков.'
      : 'Улучши описание: сделай текст информативнее и дружелюбнее, 4–10 предложений, без Markdown и без заголовков.'

  const prompt = `${task}\n\nКонтекст объявления:\n${ctx}\n\nОтвет — только текст описания.`
  return generate(prompt, signal)
}

export async function suggestMarketPrice(
  input: {
    category: Category
    title: string
    price: number
    description: string
    params: ItemParams
  },
  signal?: AbortSignal,
): Promise<string> {
  const ctx = buildContextSnippet(
    input.category,
    input.title,
    input.price,
    input.description,
    input.params,
  )
  const prompt = `Оцени ориентировочную рыночную цену в рублях для объявления в РФ (не юридическая оценка).\nОтветь одной строкой: только число в рублях без пробелов и текста, например: 125000\n\nКонтекст:\n${ctx}`
  const raw = await generate(prompt, signal)
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return raw
  return digits
}

export async function chatReply(
  messages: { role: 'user' | 'assistant'; content: string }[],
  cardContext: string,
  signal?: AbortSignal,
): Promise<string> {
  const history = messages
    .map((m) => `${m.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${m.content}`)
    .join('\n')
  const prompt = `Ты помощник продавца на площадке объявлений. Отвечай кратко по-русски.\n\nКонтекст карточки:\n${cardContext}\n\nДиалог:\n${history}\n\nАссистент:`
  return generate(prompt, signal)
}
