import type {
  ItemFull,
  ItemUpdateIn,
  ItemsGetResponse,
  ItemsListResponse,
} from '../types/item'
import { apiClient } from './client'

export type ListQuery = {
  q?: string
  limit?: number
  skip?: number
  needsRevision?: boolean
  categories?: string[]
  sortColumn?: 'title' | 'createdAt' | 'price'
  sortDirection?: 'asc' | 'desc'
}

export async function fetchItems(
  query: ListQuery,
  signal?: AbortSignal,
): Promise<ItemsListResponse> {
  const params: Record<string, string | number | boolean | undefined> = {
    limit: query.limit ?? 10,
    skip: query.skip ?? 0,
    sortColumn: query.sortColumn ?? 'createdAt',
    sortDirection: query.sortDirection ?? 'desc',
  }
  if (query.q) params.q = query.q
  if (query.needsRevision === true) params.needsRevision = true
  if (query.categories?.length) params.categories = query.categories.join(',')

  const { data } = await apiClient.get<ItemsListResponse>('/items', {
    params,
    signal,
  })
  return data
}

export async function fetchItemById(
  id: string,
  signal?: AbortSignal,
): Promise<ItemFull> {
  const { data } = await apiClient.get<ItemsGetResponse>(`/items/${id}`, {
    signal,
  })
  const item = data.items[0]
  if (!item) throw new Error('Объявление не найдено')
  return item
}

export async function updateItem(
  id: string,
  body: ItemUpdateIn,
  signal?: AbortSignal,
): Promise<ItemFull> {
  const { data } = await apiClient.put<ItemsGetResponse>(`/items/${id}`, body, {
    signal,
  })
  const item = data.items[0]
  if (!item) throw new Error('Не удалось сохранить')
  return item
}
